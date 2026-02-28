/**
 * Daily Orchestrator Agent
 *
 * Autonomous agent that generates 5 sets/day × 6 slides/set.
 * Uses Supabase Storage for all file output.
 */
import prisma from "@/lib/prisma";
import { composePrompt } from "@/lib/prompts";
import { generateAndSaveImage, GEMINI_MODEL } from "@/services/geminiImage";
import {
    uploadJson,
    getFileUrl,
    setImagePath,
    setManifestPath,
    setZipPath,
    bufferHash,
    downloadFile,
} from "@/lib/storage";
import { validatePromptSafety } from "@/lib/validation";
import { createAndUploadZip } from "@/lib/zip";
import { v4 as uuid } from "uuid";

const DEFAULT_SETS_PER_DAY = 1;
const DEFAULT_SLIDES_PER_SET = 6;
const CONCURRENCY = 2;
const MAX_RETRIES = 2;
const RETRY_BASE_MS = 3000;

interface AgentConfig {
    subjectId: string;
    templateId?: string;
    setsPerDay?: number;
    slidesPerSet?: number;
}

export async function runDailyAgent(configOverride?: Partial<AgentConfig>): Promise<string> {
    console.log("\n═══════════════════════════════════════════");
    console.log("  STYLESET AGENT — Starting daily run");
    console.log("═══════════════════════════════════════════\n");

    const config = await resolveConfig(configOverride);

    if (!config.subjectId) {
        throw new Error("Agent requires a subjectId. Configure via /agent or set up a cron job.");
    }

    const setsPerDay = config.setsPerDay || DEFAULT_SETS_PER_DAY;
    const slidesPerSet = config.slidesPerSet || DEFAULT_SLIDES_PER_SET;

    const subject = await prisma.subject.findUnique({ where: { id: config.subjectId } });
    if (!subject) throw new Error(`Subject ${config.subjectId} not found`);

    const template = config.templateId
        ? await prisma.slideRequestTemplate.findUnique({ where: { id: config.templateId } })
        : await prisma.slideRequestTemplate.findFirst({ orderBy: { createdAt: "asc" } });

    const allPresets = await prisma.hairstylePreset.findMany({ orderBy: { createdAt: "asc" } });
    if (allPresets.length < slidesPerSet) {
        throw new Error(`Need at least ${slidesPerSet} presets, have ${allPresets.length}`);
    }

    const runId = uuid();
    await prisma.agentRun.create({
        data: {
            id: runId,
            setsPlanned: setsPerDay,
            slidesTotal: setsPerDay * slidesPerSet,
            configJson: JSON.stringify(config),
        },
    });

    console.log(`[Agent] Run ${runId.slice(0, 8)}`);
    console.log(`[Agent] Subject: ${subject.name}`);
    console.log(`[Agent] Plan: ${setsPerDay}×${slidesPerSet} = ${setsPerDay * slidesPerSet} images\n`);

    const recentUsedPresetIds = await getRecentlyUsedPresets(7);
    let setsCompleted = 0, setsFailed = 0, slidesOk = 0, slidesFailed = 0;
    const usedPresetsToday = new Set<string>();

    for (let setIdx = 0; setIdx < setsPerDay; setIdx++) {
        console.log(`\n───── Set ${setIdx + 1}/${setsPerDay} ─────`);

        try {
            const selectedPresets = selectPresets(allPresets, slidesPerSet, usedPresetsToday, recentUsedPresetIds);
            selectedPresets.forEach((p) => usedPresetsToday.add(p.id));

            const now = new Date();
            const setId = uuid();
            const setName = `${subject.name} — Set ${setIdx + 1} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

            await prisma.slideshowSet.create({
                data: {
                    id: setId,
                    subjectId: subject.id,
                    templateId: template?.id || null,
                    name: setName,
                    status: "generating",
                    outputDir: `sets/${setId}`,
                },
            });

            console.log(`[Agent] Set: ${setName}`);
            console.log(`[Agent] Hairstyles: ${selectedPresets.map((p) => p.name).join(", ")}`);

            const slideIds: string[] = [];
            for (let slideIdx = 0; slideIdx < selectedPresets.length; slideIdx++) {
                const preset = selectedPresets[slideIdx];
                const slideId = uuid();
                slideIds.push(slideId);

                await prisma.slideGeneration.create({
                    data: {
                        id: slideId,
                        slideshowSetId: setId,
                        subjectId: subject.id,
                        templateId: template?.id || null,
                        presetId: preset.id,
                        orderIndex: slideIdx,
                        inputJson: JSON.stringify({
                            hairstylePrompt: preset.hairstylePrompt,
                            negativeHairPrompt: preset.negativeHairPrompt || "",
                        }),
                        status: "queued",
                    },
                });
            }

            let setSlidesFailed = 0;
            for (let i = 0; i < slideIds.length; i += CONCURRENCY) {
                const batch = slideIds.slice(i, i + CONCURRENCY);
                const results = await Promise.allSettled(
                    batch.map((slideId, batchIdx) =>
                        generateSlideWithRetry(
                            slideId, subject, template, selectedPresets[i + batchIdx], setId, i + batchIdx,
                        )
                    )
                );

                for (const result of results) {
                    if (result.status === "fulfilled" && result.value) {
                        slidesOk++;
                    } else {
                        slidesFailed++;
                        setSlidesFailed++;
                    }
                }
            }

            // Build manifest and upload to Supabase
            const manifest = await buildManifest(setId);
            const manifestStoragePath = setManifestPath(setId);
            const manifestUrl = await uploadJson(manifestStoragePath, manifest);

            // Zip the set
            let zipStoragePath: string | null = null;
            if (setSlidesFailed === 0 || slidesOk > 0) {
                const slidesToZip = manifest.slides
                    .filter((s) => s.status === "succeeded" && !!s.storagePath)
                    .map((s) => {
                        const idx = String(s.orderIndex).padStart(3, "0");
                        return {
                            filename: `${idx}.png`,
                            storagePath: s.storagePath as string, // Checked above
                        };
                    });

                if (slidesToZip.length > 0) {
                    zipStoragePath = setZipPath(setId);
                    await createAndUploadZip(slidesToZip, zipStoragePath);
                }
            }

            await prisma.slideshowSet.update({
                where: { id: setId },
                data: {
                    status: setSlidesFailed > 0 ? "failed" : "ready",
                    manifestPath: manifestStoragePath,
                    zipPath: zipStoragePath,
                },
            });

            if (setSlidesFailed > 0) {
                setsFailed++;
                console.log(`[Agent] Set ${setIdx + 1} completed with ${setSlidesFailed} failures`);
            } else {
                setsCompleted++;
                console.log(`[Agent] Set ${setIdx + 1} ✓ complete — manifest: ${manifestUrl}`);
            }
        } catch (error: unknown) {
            setsFailed++;
            console.error(`[Agent] Set ${setIdx + 1} FAILED:`, error instanceof Error ? error.message : error);
        }
    }

    await prisma.agentRun.update({
        where: { id: runId },
        data: {
            status: setsFailed === setsPerDay ? "failed" : "completed",
            setsCompleted,
            setsFailed,
            slidesOk,
            slidesFailed,
            completedAt: new Date(),
        },
    });

    console.log("\n═══════════════════════════════════════════");
    console.log(`  AGENT COMPLETE: ${setsCompleted} OK, ${setsFailed} failed`);
    console.log(`  Images: ${slidesOk} OK, ${slidesFailed} failed`);
    console.log("═══════════════════════════════════════════\n");

    return runId;
}

async function generateSlideWithRetry(
    slideId: string,
    subject: { id: string; referenceImagePaths: string; lockedAttributesJson: string },
    template: { basePromptJson: string } | null,
    preset: { id: string; name: string; hairstylePrompt: string; negativeHairPrompt: string | null },
    setId: string,
    orderIndex: number,
): Promise<boolean> {
    // Parse subject data
    const refPaths: string[] = JSON.parse(subject.referenceImagePaths || "[]");
    const lockedAttributes = JSON.parse(subject.lockedAttributesJson || "{}");
    const basePrompt = template ? JSON.parse(template.basePromptJson) : {};

    validatePromptSafety(preset.hairstylePrompt, preset.negativeHairPrompt || undefined);

    const composed = composePrompt({
        lockedAttributes,
        basePrompt,
        hairstylePrompt: preset.hairstylePrompt,
        negativeHairPrompt: preset.negativeHairPrompt || undefined,
    });

    // Compute ref hashes
    const refHashes: string[] = [];
    for (const refPath of refPaths) {
        try {
            const buf = await downloadFile(refPath);
            refHashes.push(bufferHash(buf));
        } catch {
            refHashes.push("unreadable");
        }
    }

    await prisma.slideGeneration.update({
        where: { id: slideId },
        data: {
            status: "running",
            inputJson: JSON.stringify({
                hairstylePrompt: preset.hairstylePrompt,
                negativeHairPrompt: preset.negativeHairPrompt,
                refHashes,
            }),
            finalPromptText: composed.finalPrompt,
        },
    });

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
            if (attempt > 0) {
                const delay = RETRY_BASE_MS * Math.pow(2, attempt - 1);
                console.log(`[Agent] Slide ${orderIndex} retry ${attempt}/${MAX_RETRIES} after ${delay}ms`);
                await sleep(delay);
            }

            const outputFileName = `${String(orderIndex).padStart(3, "0")}.png`;
            const outputStoragePath = setImagePath(setId, outputFileName);

            const result = await generateAndSaveImage(
                {
                    referenceImagePaths: refPaths,
                    finalPromptText: composed.finalPrompt,
                    negativePrompt: composed.finalNegativePrompt,
                    aspectRatio: (composed.metadata.aspect_ratio as string) || "3:4",
                },
                outputStoragePath,
            );

            if (result.success) {
                await prisma.slideGeneration.update({
                    where: { id: slideId },
                    data: {
                        status: "succeeded",
                        outputImagePath: outputStoragePath,
                        retryCount: attempt,
                    },
                });
                console.log(`[Agent] Slide ${orderIndex} (${preset.name}) ✓`);
                return true;
            }

            throw new Error(result.error || "No image returned");
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            if (attempt === MAX_RETRIES) {
                await prisma.slideGeneration.update({
                    where: { id: slideId },
                    data: { status: "failed", error: msg, retryCount: attempt },
                });
                console.error(`[Agent] Slide ${orderIndex} FAILED: ${msg}`);
                return false;
            }
        }
    }
    return false;
}

function selectPresets(
    allPresets: Array<{ id: string; name: string; hairstylePrompt: string; negativeHairPrompt: string | null }>,
    count: number,
    usedToday: Set<string>,
    recentlyUsed: Set<string>,
) {
    const unused = allPresets.filter((p) => !usedToday.has(p.id));
    const fresh = unused.filter((p) => !recentlyUsed.has(p.id));

    const pool = [...fresh];
    if (pool.length < count) {
        pool.push(...unused.filter((p) => !pool.some((s) => s.id === p.id)));
    }
    if (pool.length < count) {
        pool.push(...allPresets.filter((p) => !pool.some((s) => s.id === p.id)));
    }

    const shuffled = shuffleArray([...pool]);
    const selected: typeof allPresets = [];
    for (const preset of shuffled) {
        if (selected.length >= count) break;
        if (!selected.some((s) => s.id === preset.id)) selected.push(preset);
    }
    return selected;
}

async function getRecentlyUsedPresets(days: number): Promise<Set<string>> {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const recent = await prisma.slideGeneration.findMany({
        where: { createdAt: { gte: since }, presetId: { not: null } },
        select: { presetId: true },
        distinct: ["presetId"],
    });

    return new Set(recent.map((r) => r.presetId!).filter(Boolean));
}

async function buildManifest(setId: string) {
    const set = await prisma.slideshowSet.findUniqueOrThrow({
        where: { id: setId },
        include: {
            slides: { orderBy: { orderIndex: "asc" }, include: { preset: true } },
        },
    });

    return {
        setId: set.id,
        subjectId: set.subjectId,
        name: set.name,
        createdAt: set.createdAt.toISOString(),
        model: GEMINI_MODEL,
        slides: set.slides.map((s) => ({
            orderIndex: s.orderIndex,
            storagePath: s.outputImagePath,
            publicUrl: s.outputImagePath ? getFileUrl(s.outputImagePath) : null,
            status: s.status,
            retries: s.retryCount,
            hairstyle: {
                presetId: s.presetId,
                presetName: s.preset?.name || null,
                prompt: s.preset?.hairstylePrompt || "",
            },
            error: s.error,
        })),
    };
}

function shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

async function resolveConfig(override?: Partial<AgentConfig>): Promise<AgentConfig> {
    if (override?.subjectId) {
        return {
            subjectId: override.subjectId,
            templateId: override.templateId,
            setsPerDay: override.setsPerDay || DEFAULT_SETS_PER_DAY,
            slidesPerSet: override.slidesPerSet || DEFAULT_SLIDES_PER_SET,
        };
    }

    // Check active cron job
    const cronJob = await prisma.cronJob.findFirst({
        where: { enabled: true, actionType: "GENERATE_DAILY_SETS" },
        orderBy: { createdAt: "desc" },
    });

    if (cronJob) {
        const config = JSON.parse(cronJob.configJson);
        return {
            subjectId: config.subjectId,
            templateId: config.templateId,
            setsPerDay: config.setsPerDay || DEFAULT_SETS_PER_DAY,
            slidesPerSet: config.slidesPerSet || DEFAULT_SLIDES_PER_SET,
        };
    }

    // Fallback: first subject
    const first = await prisma.subject.findFirst({ orderBy: { createdAt: "asc" } });
    if (!first) throw new Error("No subjects found. Upload a subject first.");

    return {
        subjectId: first.id,
        setsPerDay: DEFAULT_SETS_PER_DAY,
        slidesPerSet: DEFAULT_SLIDES_PER_SET,
    };
}

function sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
}

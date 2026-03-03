/**
 * Set Generator — per-subject quick-generate.
 * Uses Supabase Storage.
 */
import prisma from "@/lib/prisma";
import { composePrompt } from "@/lib/prompts";
import { generateAndSaveImage } from "@/services/geminiImage";
import { uploadJson, setImagePath, setManifestPath, setZipPath, getFileUrl } from "@/lib/storage";
import { createAndUploadZip } from "@/lib/zip";
import { v4 as uuid } from "uuid";

const CONCURRENCY = 1;
const BATCH_DELAY_MS = 2000;

export async function generateSet(setId: string): Promise<void> {
    const set = await prisma.slideshowSet.findUniqueOrThrow({
        where: { id: setId },
        include: {
            subject: true,
            template: true,
            slides: { orderBy: { orderIndex: "asc" }, include: { preset: true } },
        },
    });

    await prisma.slideshowSet.update({
        where: { id: setId },
        data: { status: "generating" },
    });

    const refPaths: string[] = set.modelImagePath
        ? [set.modelImagePath]
        : JSON.parse(set.subject.referenceImagePaths || "[]");
    const lockedAttrs = JSON.parse(set.subject.lockedAttributesJson || "{}");
    const basePrompt = set.template ? JSON.parse(set.template.basePromptJson) : {};

    let failCount = 0;

    for (let i = 0; i < set.slides.length; i += CONCURRENCY) {
        const batch = set.slides.slice(i, i + CONCURRENCY);
        await Promise.allSettled(
            batch.map(async (slide) => {
                try {
                    await prisma.slideGeneration.update({
                        where: { id: slide.id },
                        data: { status: "running" },
                    });

                    let hairstylePrompt = "";
                    let negativeHairPrompt = "";
                    try {
                        const input = JSON.parse(slide.inputJson || "{}");
                        hairstylePrompt = input.hairstylePrompt || slide.preset?.hairstylePrompt || "";
                        negativeHairPrompt = input.negativeHairPrompt || slide.preset?.negativeHairPrompt || "";
                    } catch {
                        hairstylePrompt = slide.preset?.hairstylePrompt || "";
                    }

                    const composed = composePrompt({
                        lockedAttributes: lockedAttrs,
                        basePrompt,
                        hairstylePrompt,
                        negativeHairPrompt: negativeHairPrompt || undefined,
                    });

                    const cleanName = (slide.preset?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                    const outputFileName = cleanName ? `${String(slide.orderIndex).padStart(3, "0")}_${cleanName}.png` : `${String(slide.orderIndex).padStart(3, "0")}.png`;
                    const storagePath = setImagePath(setId, outputFileName);

                    const result = await generateAndSaveImage(
                        {
                            referenceImagePaths: refPaths,
                            finalPromptText: composed.finalPrompt,
                            negativePrompt: composed.finalNegativePrompt,
                        },
                        storagePath,
                    );

                    if (result.success) {
                        await prisma.slideGeneration.update({
                            where: { id: slide.id },
                            data: {
                                status: "succeeded",
                                outputImagePath: storagePath,
                                finalPromptText: composed.finalPrompt,
                            },
                        });
                    } else {
                        throw new Error(result.error || "No image");
                    }
                } catch (error: unknown) {
                    failCount++;
                    const msg = error instanceof Error ? error.message : String(error);
                    await prisma.slideGeneration.update({
                        where: { id: slide.id },
                        data: { status: "failed", error: msg },
                    });
                }
            })
        );

        // Delay between batches to avoid rate limits
        if (i + CONCURRENCY < set.slides.length) {
            await new Promise((r) => setTimeout(r, BATCH_DELAY_MS));
        }
    }

    // Manifest
    const slides = await prisma.slideGeneration.findMany({
        where: { slideshowSetId: setId },
        orderBy: { orderIndex: "asc" },
        include: { preset: true },
    });

    const manifest = {
        setId,
        name: set.name,
        subjectId: set.subjectId,
        createdAt: new Date().toISOString(),
        slides: slides.map((s) => ({
            orderIndex: s.orderIndex,
            storagePath: s.outputImagePath,
            publicUrl: s.outputImagePath ? getFileUrl(s.outputImagePath) : null,
            status: s.status,
            hairstyle: s.preset?.name || "",
        })),
    };

    const manifestStorage = setManifestPath(setId);
    await uploadJson(manifestStorage, manifest);

    // Zip the set if there are any successful slides
    let zipStoragePath: string | null = null;
    const slidesToZip = slides
        .filter((s) => s.status === "succeeded" && !!s.outputImagePath)
        .map((s) => {
            const cleanName = (s.preset?.name || "").toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const fname = cleanName ? `${String(s.orderIndex).padStart(3, "0")}_${cleanName}.png` : `${String(s.orderIndex).padStart(3, "0")}.png`;
            return {
                filename: fname,
                storagePath: s.outputImagePath as string,
            };
        });

    if (slidesToZip.length > 0) {
        zipStoragePath = setZipPath(setId);
        await createAndUploadZip(slidesToZip, zipStoragePath);
    }

    await prisma.slideshowSet.update({
        where: { id: setId },
        data: {
            status: failCount > 0 ? "failed" : "ready",
            outputDir: `sets/${setId}`,
            manifestPath: manifestStorage,
            zipPath: zipStoragePath,
        },
    });
}

/**
 * Cron job runner.
 * Processes enabled cron jobs that are due.
 */
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";
import { v4 as uuid } from "uuid";

export async function runCronTick(): Promise<void> {
    console.log("[CronRunner] Running tick at", new Date().toISOString());

    const jobs = await prisma.cronJob.findMany({
        where: { enabled: true },
    });

    for (const job of jobs) {
        if (!shouldRunNow(job.schedule, job.lastRunAt)) {
            console.log(`[CronRunner] Job ${job.name} not due, skipping`);
            continue;
        }

        console.log(`[CronRunner] Running job: ${job.name}`);
        await runJob(job.id);
    }
}

export async function runJob(jobId: string): Promise<void> {
    const job = await prisma.cronJob.findUniqueOrThrow({ where: { id: jobId } });

    try {
        const config = JSON.parse(job.configJson);

        if (job.actionType !== "GENERATE_SET") {
            throw new Error(`Unknown action type: ${job.actionType}`);
        }

        const { subjectId, templateId, presetIds, customHairstyles, namingPattern } = config;

        if (!subjectId) throw new Error("configJson must include subjectId");

        // Verify subject exists
        await prisma.subject.findUniqueOrThrow({ where: { id: subjectId } });

        // Build set name
        const now = new Date();
        const setName = (namingPattern || "Auto set {date}")
            .replace("{date}", now.toISOString().split("T")[0])
            .replace("{time}", now.toISOString().split("T")[1].split(".")[0]);

        // Create slides config
        const slides: Array<{
            orderIndex: number;
            presetId?: string;
            hairstylePrompt?: string;
            negativeHairPrompt?: string;
        }> = [];

        if (presetIds && Array.isArray(presetIds)) {
            for (let i = 0; i < presetIds.length; i++) {
                slides.push({ orderIndex: i, presetId: presetIds[i] });
            }
        } else if (customHairstyles && Array.isArray(customHairstyles)) {
            for (let i = 0; i < customHairstyles.length; i++) {
                const h = customHairstyles[i];
                slides.push({
                    orderIndex: i,
                    hairstylePrompt: typeof h === "string" ? h : h.prompt,
                    negativeHairPrompt: typeof h === "object" ? h.negativePrompt : undefined,
                });
            }
        } else {
            throw new Error("configJson must include presetIds or customHairstyles");
        }

        // Create SlideshowSet
        const setId = uuid();
        await prisma.slideshowSet.create({
            data: {
                id: setId,
                subjectId,
                templateId: templateId || null,
                name: setName,
                status: "idle",
            },
        });

        // Create SlideGeneration rows
        for (const slide of slides) {
            await prisma.slideGeneration.create({
                data: {
                    id: uuid(),
                    subjectId,
                    templateId: templateId || null,
                    presetId: slide.presetId || null,
                    slideshowSetId: setId,
                    orderIndex: slide.orderIndex,
                    inputJson: JSON.stringify({
                        hairstylePrompt: slide.hairstylePrompt || "",
                        negativeHairPrompt: slide.negativeHairPrompt || "",
                    }),
                    status: "queued",
                },
            });
        }

        // Generate
        await generateSet(setId);

        // Update job
        await prisma.cronJob.update({
            where: { id: jobId },
            data: {
                lastRunAt: new Date(),
                lastResult: "success",
                lastError: null,
            },
        });

        console.log(`[CronRunner] Job ${job.name} completed successfully`);
    } catch (error: unknown) {
        const errMsg = error instanceof Error ? error.message : String(error);
        console.error(`[CronRunner] Job ${job.name} failed:`, errMsg);

        await prisma.cronJob.update({
            where: { id: jobId },
            data: {
                lastRunAt: new Date(),
                lastResult: "failed",
                lastError: errMsg,
            },
        });
    }
}

function shouldRunNow(schedule: string, lastRunAt: Date | null): boolean {
    // Simple cron check: parse schedule and compare with current time
    // For MVP, we support: "daily", "hourly", or standard cron expressions
    const now = new Date();

    if (!lastRunAt) return true; // Never run, run now

    const elapsed = now.getTime() - lastRunAt.getTime();

    if (schedule === "daily" || schedule === "0 0 * * *") {
        return elapsed >= 24 * 60 * 60 * 1000;
    }
    if (schedule === "hourly" || schedule === "0 * * * *") {
        return elapsed >= 60 * 60 * 1000;
    }
    if (schedule === "*/5 * * * *") {
        return elapsed >= 5 * 60 * 1000;
    }
    if (schedule === "*/15 * * * *") {
        return elapsed >= 15 * 60 * 1000;
    }
    if (schedule === "*/30 * * * *") {
        return elapsed >= 30 * 60 * 1000;
    }

    // Default: run if more than 1 hour has passed
    return elapsed >= 60 * 60 * 1000;
}

/**
 * In-App Cron Scheduler
 *
 * Uses node-cron to schedule daily agent runs.
 * Auto-starts when imported.
 */
import cron from "node-cron";
import { runDailyAgent } from "@/agent/dailyOrchestrator";
import prisma from "@/lib/prisma";

let scheduled = false;
let task: ReturnType<typeof cron.schedule> | null = null;

const DEFAULT_SCHEDULE = process.env.AGENT_SCHEDULE || "0 9 * * *"; // 9am daily

export function startScheduler() {
    if (scheduled) return;
    scheduled = true;

    const schedule = DEFAULT_SCHEDULE;
    console.log(`[Scheduler] Starting with schedule: ${schedule}`);

    task = cron.schedule(schedule, async () => {
        console.log(`[Scheduler] Triggered at ${new Date().toISOString()}`);

        try {
            // Update cron job record
            const cronJob = await prisma.cronJob.findFirst({
                where: { enabled: true, actionType: "GENERATE_DAILY_SETS" },
            });

            if (cronJob) {
                await prisma.cronJob.update({
                    where: { id: cronJob.id },
                    data: { lastRunAt: new Date() },
                });
            }

            const runId = await runDailyAgent();

            if (cronJob) {
                await prisma.cronJob.update({
                    where: { id: cronJob.id },
                    data: {
                        lastResult: "success",
                        lastError: null,
                    },
                });
            }

            console.log(`[Scheduler] Completed run ${runId}`);
        } catch (error: unknown) {
            const msg = error instanceof Error ? error.message : String(error);
            console.error(`[Scheduler] Run failed:`, msg);

            const cronJob = await prisma.cronJob.findFirst({
                where: { enabled: true, actionType: "GENERATE_DAILY_SETS" },
            });

            if (cronJob) {
                await prisma.cronJob.update({
                    where: { id: cronJob.id },
                    data: {
                        lastResult: "failed",
                        lastError: msg,
                    },
                });
            }
        }
    });
}

export function stopScheduler() {
    if (task) {
        task.stop();
        task = null;
        scheduled = false;
        console.log("[Scheduler] Stopped");
    }
}

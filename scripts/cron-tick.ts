// Cron tick CLI
// Run with: npx tsx scripts/cron-tick.ts
// Can be called from external cron: */1 * * * * cd / path / to / styleset && npx tsx scripts / cron - tick.ts
import { PrismaClient } from "@prisma/client";

// We need to set up the module alias manually for scripts
process.env.DATABASE_URL = process.env.DATABASE_URL || "file:./prisma/dev.db";

async function main() {
    // Dynamic import to avoid module resolution issues
    const prisma = new PrismaClient();

    console.log("[CronTick] Running at", new Date().toISOString());

    const jobs = await prisma.cronJob.findMany({
        where: { enabled: true },
    });

    if (jobs.length === 0) {
        console.log("[CronTick] No enabled jobs found");
        return;
    }

    console.log(`[CronTick] Found ${jobs.length} enabled job(s)`);

    // Call the API endpoint which handles the actual cron logic
    const baseUrl = process.env.NEXT_PUBLIC_URL || "http://localhost:3000";

    try {
        const res = await fetch(`${baseUrl}/api/cron/tick`, { method: "POST" });
        const data = await res.json();
        console.log("[CronTick] Result:", data);
    } catch (error) {
        console.error("[CronTick] Failed to call API:", error);
        // Fallback: run inline
        console.log("[CronTick] Attempting inline execution...");

        for (const job of jobs) {
            console.log(`[CronTick] Would run job: ${job.name} (${job.schedule})`);
        }
    }

    await prisma.$disconnect();
}

main().catch((e) => {
    console.error("[CronTick] Fatal error:", e);
    process.exit(1);
});

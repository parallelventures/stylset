import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    await prisma.cronJob.updateMany({
        where: { actionType: "GENERATE_DAILY_SETS" },
        data: {
            configJson: JSON.stringify({
                setsPerDay: 5,
                slidesPerSet: 6,
                note: "subjectId auto-resolves to first subject. Override here if needed."
            })
        }
    });
    console.log("Reverted Cron config to 5 sets per day with 6 slides.");
}
run();

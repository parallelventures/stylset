import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    await prisma.cronJob.updateMany({
        where: { actionType: "GENERATE_DAILY_SETS" },
        data: {
            configJson: JSON.stringify({
                setsPerDay: 1,
                slidesPerSet: 6,
                note: "subjectId auto-resolves to first subject. Override here if needed."
            })
        }
    });
    console.log("Updated Cron config to 1 set per day with 6 slides.");
}
run();

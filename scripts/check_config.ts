import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function run() {
    const cron = await prisma.cronJob.findFirst({ where: { actionType: "GENERATE_DAILY_SETS" } });
    console.log("Cron config:", cron?.configJson);
}
run();

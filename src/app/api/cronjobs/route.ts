import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CronJobCreateSchema } from "@/lib/validation";

export async function GET() {
    const jobs = await prisma.cronJob.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(jobs);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = CronJobCreateSchema.parse(body);

        // Validate configJson
        try {
            const config = JSON.parse(parsed.configJson);
            if (!config.subjectId) {
                return NextResponse.json(
                    { error: "configJson must include subjectId" },
                    { status: 400 }
                );
            }
        } catch {
            return NextResponse.json(
                { error: "configJson must be valid JSON" },
                { status: 400 }
            );
        }

        const job = await prisma.cronJob.create({
            data: {
                name: parsed.name,
                schedule: parsed.schedule,
                enabled: parsed.enabled,
                actionType: parsed.actionType,
                configJson: parsed.configJson,
            },
        });

        return NextResponse.json(job, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

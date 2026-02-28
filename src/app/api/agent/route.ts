import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { runDailyAgent } from "@/agent/dailyOrchestrator";

/**
 * GET  /api/agent   — agent status & config
 * POST /api/agent   — trigger agent run now
 */
export async function GET() {
    try {
        // Latest runs
        const runs = await prisma.agentRun.findMany({
            orderBy: { startedAt: "desc" },
            take: 10,
        });

        // Active config (from cron or default)
        const cronJob = await prisma.cronJob.findFirst({
            where: { enabled: true, actionType: "GENERATE_DAILY_SETS" },
            orderBy: { createdAt: "desc" },
        });

        // Counts
        const [subjectCount, presetCount, templateCount] = await Promise.all([
            prisma.subject.count(),
            prisma.hairstylePreset.count(),
            prisma.slideRequestTemplate.count(),
        ]);

        // Default subject
        const defaultSubject = await prisma.subject.findFirst({
            orderBy: { createdAt: "asc" },
            select: { id: true, name: true },
        });

        return NextResponse.json({
            runs,
            cronJob: cronJob || null,
            counts: { subjects: subjectCount, presets: presetCount, templates: templateCount },
            defaultSubject,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));

        // Fire off agent (this may take minutes, but we return immediately)
        const configOverride = {
            subjectId: body.subjectId,
            templateId: body.templateId,
            setsPerDay: body.setsPerDay,
            slidesPerSet: body.slidesPerSet,
            pauseBetweenSets: body.pauseBetweenSets,
        };

        // Start agent in background
        const promise = runDailyAgent(configOverride);

        // Wait a moment so we can get the AgentRun ID
        const runId = await Promise.race([
            promise,
            new Promise<string>((resolve) =>
                setTimeout(async () => {
                    // Get the most recent run
                    const latest = await prisma.agentRun.findFirst({
                        orderBy: { startedAt: "desc" },
                    });
                    resolve(latest?.id || "unknown");
                }, 500)
            ),
        ]);

        return NextResponse.json({
            ok: true,
            runId,
            message: "Agent started. Generation running in background.",
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

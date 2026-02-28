import { NextRequest, NextResponse } from "next/server";
import { runDailyAgent } from "@/agent/dailyOrchestrator";
import prisma from "@/lib/prisma";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const run = await prisma.agentRun.findUnique({ where: { id } });
        if (!run) throw new Error("Run not found");
        if (run.status !== "paused") throw new Error("Can only resume a paused run");

        const config = JSON.parse(run.configJson || "{}");
        runDailyAgent(config, id);

        return NextResponse.json({ ok: true, message: "Run resumed" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

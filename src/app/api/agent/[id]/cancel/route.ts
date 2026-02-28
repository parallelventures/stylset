import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const run = await prisma.agentRun.findUnique({ where: { id } });
        if (!run) throw new Error("Run not found");
        if (run.status === "completed" || run.status === "failed") {
            throw new Error("Run is already " + run.status);
        }

        await prisma.agentRun.update({
            where: { id },
            data: { status: "cancelled", completedAt: new Date() }
        });

        return NextResponse.json({ ok: true, message: "Run cancelled" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

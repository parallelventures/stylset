import { NextRequest, NextResponse } from "next/server";
import { runJob } from "@/services/cronRunner";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await runJob(id);
        return NextResponse.json({ ok: true, message: "Job executed successfully" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

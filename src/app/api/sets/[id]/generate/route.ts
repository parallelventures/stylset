import { NextRequest, NextResponse } from "next/server";
import { generateSet } from "@/services/generator";

export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Run generation in the background (non-blocking response)
        // But for MVP, we do it synchronously so the caller knows when it's done
        await generateSet(id);

        return NextResponse.json({ ok: true, message: "Generation complete" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[API sets generate]", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

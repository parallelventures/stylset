import { NextRequest, NextResponse } from "next/server";
import { runCronTick } from "@/services/cronRunner";

// External cron tick endpoint - call via: curl -X POST http://localhost:3000/api/cron/tick
export async function POST(_req: NextRequest) {
    try {
        await runCronTick();
        return NextResponse.json({ ok: true, message: "Cron tick complete" });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

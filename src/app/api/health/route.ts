import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        status: "ok",
        service: "styleset",
        timestamp: new Date().toISOString(),
    });
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { CronJobUpdateSchema } from "@/lib/validation";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const job = await prisma.cronJob.findUnique({ where: { id } });
    if (!job) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(job);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = CronJobUpdateSchema.parse(body);

        if (parsed.configJson) {
            try {
                JSON.parse(parsed.configJson);
            } catch {
                return NextResponse.json(
                    { error: "configJson must be valid JSON" },
                    { status: 400 }
                );
            }
        }

        const job = await prisma.cronJob.update({
            where: { id },
            data: parsed,
        });
        return NextResponse.json(job);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.cronJob.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

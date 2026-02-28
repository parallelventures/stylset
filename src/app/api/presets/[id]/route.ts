import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PresetUpdateSchema } from "@/lib/validation";
import { validatePromptSafety } from "@/lib/validation";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const preset = await prisma.hairstylePreset.findUnique({ where: { id } });
    if (!preset)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(preset);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = PresetUpdateSchema.parse(body);

        if (parsed.hairstylePrompt) {
            validatePromptSafety(parsed.hairstylePrompt, parsed.negativeHairPrompt || undefined);
        }

        const preset = await prisma.hairstylePreset.update({
            where: { id },
            data: parsed,
        });
        return NextResponse.json(preset);
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
        await prisma.hairstylePreset.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

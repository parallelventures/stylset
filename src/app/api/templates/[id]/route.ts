import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TemplateUpdateSchema } from "@/lib/validation";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const template = await prisma.slideRequestTemplate.findUnique({
        where: { id },
    });
    if (!template)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(template);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = TemplateUpdateSchema.parse(body);

        if (parsed.basePromptJson) {
            try {
                JSON.parse(parsed.basePromptJson);
            } catch {
                return NextResponse.json(
                    { error: "basePromptJson must be valid JSON" },
                    { status: 400 }
                );
            }
        }

        const template = await prisma.slideRequestTemplate.update({
            where: { id },
            data: parsed,
        });
        return NextResponse.json(template);
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
        await prisma.slideRequestTemplate.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

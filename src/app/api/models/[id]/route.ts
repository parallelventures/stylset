import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * DELETE /api/models/[id] — delete a model variation
 * PATCH  /api/models/[id] — update a model variation
 */
export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        await prisma.modelVariation.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> },
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const updated = await prisma.modelVariation.update({
            where: { id },
            data: {
                name: body.name,
                description: body.description,
                prompt: body.prompt,
                tags: body.tags,
                enabled: body.enabled,
            },
        });
        return NextResponse.json(updated);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

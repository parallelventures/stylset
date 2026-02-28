import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const set = await prisma.slideshowSet.findUnique({
        where: { id },
        include: {
            subject: true,
            template: true,
            slides: {
                orderBy: { orderIndex: "asc" },
                include: { preset: true },
            },
        },
    });
    if (!set)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(set);
}

export async function DELETE(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        await prisma.slideshowSet.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

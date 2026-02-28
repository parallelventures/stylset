import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SubjectUpdateSchema } from "@/lib/validation";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const subject = await prisma.subject.findUnique({
        where: { id },
        include: {
            slideshowSets: { orderBy: { createdAt: "desc" } },
        },
    });
    if (!subject)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(subject);
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const body = await req.json();
        const parsed = SubjectUpdateSchema.parse(body);

        const subject = await prisma.subject.update({
            where: { id },
            data: {
                ...(parsed.name && { name: parsed.name }),
                ...(parsed.description !== undefined && {
                    description: parsed.description,
                }),
            },
        });

        return NextResponse.json(subject);
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
        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
}

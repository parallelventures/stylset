import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const slide = await prisma.slideGeneration.findUnique({
        where: { id },
        include: { preset: true, template: true, subject: true },
    });
    if (!slide)
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(slide);
}

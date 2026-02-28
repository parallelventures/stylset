import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const setId = searchParams.get("setId");

    const where = setId ? { slideshowSetId: setId } : {};

    const slides = await prisma.slideGeneration.findMany({
        where,
        orderBy: { orderIndex: "asc" },
        include: {
            preset: { select: { id: true, name: true } },
        },
    });

    return NextResponse.json(slides);
}

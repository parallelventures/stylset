import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET  /api/models — list all model variations
 * POST /api/models — create a new model variation
 */
export async function GET() {
    try {
        const models = await prisma.modelVariation.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: { select: { slideshowSets: true } },
            },
        });
        return NextResponse.json(models);
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { name, description, prompt, tags } = body;

        if (!name || !prompt) {
            return NextResponse.json(
                { error: "name and prompt are required" },
                { status: 400 },
            );
        }

        const model = await prisma.modelVariation.create({
            data: { name, description, prompt, tags },
        });

        return NextResponse.json(model, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

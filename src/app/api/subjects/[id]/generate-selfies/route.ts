import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";
import { SELFIE_SCENARIOS } from "@/lib/selfies";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    const subject = await prisma.subject.findUnique({
        where: { id },
    });
    if (!subject) {
        return NextResponse.json({ error: "Subject not found" }, { status: 404 });
    }

    const body = await req.json().catch(() => ({}));
    let scenariosToGenerate = SELFIE_SCENARIOS;

    if (body.selections && Array.isArray(body.selections) && body.selections.length > 0) {
        scenariosToGenerate = body.selections;
    }

    const set = await prisma.slideshowSet.create({
        data: {
            subjectId: id,
            name: `Selfies — ${new Date().toLocaleString()}`,
            status: "idle",
        },
    });

    const slideData = scenariosToGenerate.map((scenario, index) => ({
        slideshowSetId: set.id,
        subjectId: id,
        orderIndex: index,
        status: "queued",
        inputJson: JSON.stringify({
            mode: "selfie",
            location: scenario.location,
            outfit: scenario.outfit,
            hair: scenario.hair,
            name: scenario.name
        }),
    }));

    await prisma.slideGeneration.createMany({ data: slideData });

    // Trigger async generation
    generateSet(set.id).catch((err) => {
        console.error("Selfie set generation failed:", err);
    });

    return NextResponse.json({ setId: set.id });
}

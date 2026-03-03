import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";

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

    const set = await prisma.slideshowSet.create({
        data: {
            subjectId: id,
            name: `Selfies — ${new Date().toLocaleString()}`,
            status: "idle",
        },
    });

    const SELFIE_SCENARIOS = [
        {
            name: "Luxurious bathroom",
            location: "chic luxurious bathroom with bright lighting",
            outfit: "elegant casual black tank top, gold necklace",
            hair: "messy bun",
        },
        {
            name: "Hotel room window",
            location: "high-rise modern luxury hotel room indoors, city skyline in background",
            outfit: "stylish strapless textured dark top",
            hair: "down, elegant blowout",
        },
        {
            name: "Aesthetic bedroom",
            location: "aesthetic dim lit bedroom, cozy ambiance",
            outfit: "oversized cozy sweater off one shoulder",
            hair: "half up half down",
        },
        {
            name: "Luxury lounge",
            location: "luxury lounge interior chic upscale hotel",
            outfit: "elegant dark minimalist slip dress",
            hair: "sleek straight",
        },
        {
            name: "Walk-in closet",
            location: "luxurious walk-in closet dressing room",
            outfit: "casual stylish denim and white crop top",
            hair: "loose waves",
        },
        {
            name: "Modern hallway",
            location: "modern sleek wealthy hallway",
            outfit: "trendy blazer over a chic top",
            hair: "casual ponytail",
        }
    ];

    const slideData = SELFIE_SCENARIOS.map((scenario, index) => ({
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

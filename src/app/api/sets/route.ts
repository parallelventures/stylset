import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { SetCreateSchema } from "@/lib/validation";
import { validatePromptSafety } from "@/lib/validation";
import { v4 as uuid } from "uuid";

export async function GET() {
    const sets = await prisma.slideshowSet.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            subject: { select: { id: true, name: true } },
            _count: { select: { slides: true } },
        },
    });
    return NextResponse.json(sets);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = SetCreateSchema.parse(body);

        // Verify subject exists
        const subject = await prisma.subject.findUnique({
            where: { id: parsed.subjectId },
        });
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // Verify template if provided
        if (parsed.templateId) {
            const template = await prisma.slideRequestTemplate.findUnique({
                where: { id: parsed.templateId },
            });
            if (!template) {
                return NextResponse.json(
                    { error: "Template not found" },
                    { status: 404 }
                );
            }
        }

        // Safety check slide prompts
        for (const slide of parsed.slides) {
            if (slide.hairstylePrompt) {
                validatePromptSafety(slide.hairstylePrompt, slide.negativeHairPrompt);
            }
        }

        const setId = uuid();

        // Create the set
        const set = await prisma.slideshowSet.create({
            data: {
                id: setId,
                subjectId: parsed.subjectId,
                templateId: parsed.templateId || null,
                name: parsed.name,
                description: parsed.description || null,
                status: "idle",
            },
        });

        // Create slide generations
        for (const slide of parsed.slides) {
            // Validate preset exists if provided
            if (slide.presetId) {
                const preset = await prisma.hairstylePreset.findUnique({
                    where: { id: slide.presetId },
                });
                if (!preset) {
                    return NextResponse.json(
                        { error: `Preset not found: ${slide.presetId}` },
                        { status: 404 }
                    );
                }
            }

            await prisma.slideGeneration.create({
                data: {
                    id: uuid(),
                    subjectId: parsed.subjectId,
                    templateId: parsed.templateId || null,
                    presetId: slide.presetId || null,
                    slideshowSetId: setId,
                    orderIndex: slide.orderIndex,
                    inputJson: JSON.stringify({
                        hairstylePrompt: slide.hairstylePrompt || "",
                        negativeHairPrompt: slide.negativeHairPrompt || "",
                    }),
                    status: "queued",
                },
            });
        }

        const fullSet = await prisma.slideshowSet.findUnique({
            where: { id: setId },
            include: { slides: { orderBy: { orderIndex: "asc" } } },
        });

        return NextResponse.json(fullSet, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[API sets POST]", msg);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

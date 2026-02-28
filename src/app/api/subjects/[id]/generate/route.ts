import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";
import { v4 as uuid } from "uuid";

/**
 * POST /api/subjects/:id/generate
 * One-click: creates a set with ALL presets and generates all images automatically.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        // Verify subject
        const subject = await prisma.subject.findUnique({ where: { id } });
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        // Get all presets
        const presets = await prisma.hairstylePreset.findMany({
            orderBy: { createdAt: "asc" },
        });

        if (presets.length === 0) {
            return NextResponse.json(
                { error: "No hairstyle presets found. Run the seed script first." },
                { status: 400 }
            );
        }

        // Get default template
        const template = await prisma.slideRequestTemplate.findFirst({
            orderBy: { createdAt: "asc" },
        });

        // Create set automatically
        const now = new Date();
        const setId = uuid();
        const setName = `${subject.name} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

        await prisma.slideshowSet.create({
            data: {
                id: setId,
                subjectId: id,
                templateId: template?.id || null,
                name: setName,
                status: "idle",
            },
        });

        // Create slide for each preset
        for (let i = 0; i < presets.length; i++) {
            const preset = presets[i];
            await prisma.slideGeneration.create({
                data: {
                    id: uuid(),
                    subjectId: id,
                    templateId: template?.id || null,
                    presetId: preset.id,
                    slideshowSetId: setId,
                    orderIndex: i,
                    inputJson: JSON.stringify({
                        hairstylePrompt: preset.hairstylePrompt,
                        negativeHairPrompt: preset.negativeHairPrompt || "",
                    }),
                    status: "queued",
                },
            });
        }

        // Fire off generation (non-blocking — return set ID immediately)
        // We run it async so the user gets a fast response
        generateSet(setId).catch((err) => {
            console.error(`[QuickGenerate] Background generation failed for set ${setId}:`, err);
        });

        return NextResponse.json({
            ok: true,
            setId,
            setName,
            slideCount: presets.length,
            message: `Generating ${presets.length} hairstyle variations...`,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[API quick-generate]", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

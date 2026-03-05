import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSet } from "@/services/generator";
import { v4 as uuid } from "uuid";

/**
 * POST /api/subjects/:id/generate
 * One-click: creates sets (6 slides each) with ALL presets and generates images automatically.
 */
export async function POST(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    try {
        const body = await _req.json().catch(() => ({}));

        // Verify subject
        const subject = await prisma.subject.findUnique({ where: { id } });
        if (!subject) {
            return NextResponse.json({ error: "Subject not found" }, { status: 404 });
        }

        if (!body.selections || !Array.isArray(body.selections) || body.selections.length === 0) {
            return NextResponse.json(
                { error: "No hairstyles selected." },
                { status: 400 }
            );
        }

        const variations = body.selections; // Array of { presetId?, hairstylePrompt, negativeHairPrompt, name }

        // Get default template
        const template = await prisma.slideRequestTemplate.findFirst({
            orderBy: { createdAt: "asc" },
        });

        // Create sets automatically (6 slides per set)
        const now = new Date();
        const firstSetId = uuid();
        const CHUNK_SIZE = 6;

        for (let chunkIdx = 0; chunkIdx < Math.ceil(variations.length / CHUNK_SIZE); chunkIdx++) {
            const chunkPresets = variations.slice(chunkIdx * CHUNK_SIZE, (chunkIdx + 1) * CHUNK_SIZE);
            const setId = chunkIdx === 0 ? firstSetId : uuid();
            const setName = `${subject.name} — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} (Part ${chunkIdx + 1})`;

            await prisma.slideshowSet.create({
                data: {
                    id: setId,
                    subjectId: id,
                    templateId: template?.id || null,
                    name: setName,
                    status: "idle",
                },
            });

            // Create slide for each preset in this chunk
            for (let i = 0; i < chunkPresets.length; i++) {
                const variation = chunkPresets[i];
                await prisma.slideGeneration.create({
                    data: {
                        id: uuid(),
                        subjectId: id,
                        templateId: template?.id || null,
                        presetId: variation.presetId || null,
                        slideshowSetId: setId,
                        orderIndex: i,
                        inputJson: JSON.stringify({
                            hairstylePrompt: variation.hairstylePrompt,
                            negativeHairPrompt: variation.negativeHairPrompt || "",
                        }),
                        status: "queued",
                    },
                });
            }

            // Fire off generation
            generateSet(setId).catch((err) => {
                console.error(`[QuickGenerate] Background generation failed for set ${setId}:`, err);
            });
        }

        return NextResponse.json({
            ok: true,
            setId: firstSetId,
            message: `Generating ${variations.length} variations across ${Math.ceil(variations.length / CHUNK_SIZE)} sets...`,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error("[API quick-generate]", msg);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

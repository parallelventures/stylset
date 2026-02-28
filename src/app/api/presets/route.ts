import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { PresetCreateSchema } from "@/lib/validation";
import { validatePromptSafety } from "@/lib/validation";

export async function GET() {
    const presets = await prisma.hairstylePreset.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(presets);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = PresetCreateSchema.parse(body);

        validatePromptSafety(parsed.hairstylePrompt, parsed.negativeHairPrompt || undefined);

        const preset = await prisma.hairstylePreset.create({
            data: {
                name: parsed.name,
                description: parsed.description || null,
                hairstylePrompt: parsed.hairstylePrompt,
                negativeHairPrompt: parsed.negativeHairPrompt || null,
                tags: parsed.tags || null,
            },
        });

        return NextResponse.json(preset, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { TemplateCreateSchema } from "@/lib/validation";

export async function GET() {
    const templates = await prisma.slideRequestTemplate.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(templates);
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const parsed = TemplateCreateSchema.parse(body);

        // Validate JSON
        try {
            JSON.parse(parsed.basePromptJson);
        } catch {
            return NextResponse.json(
                { error: "basePromptJson must be valid JSON" },
                { status: 400 }
            );
        }

        const template = await prisma.slideRequestTemplate.create({
            data: {
                name: parsed.name,
                basePromptJson: parsed.basePromptJson,
            },
        });

        return NextResponse.json(template, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 400 });
    }
}

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAndSaveImage } from "@/services/geminiImage";
import { subjectPath, uploadFile } from "@/lib/storage";
import { v4 as uuid } from "uuid";
import path from "path";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        let body: any = {};
        try {
            const formData = await req.formData();
            for (const [key, value] of formData.entries()) {
                body[key] = value;
            }
        } catch {
            body = await req.json().catch(() => ({}));
        }

        const inputAesthetic = body.aesthetic || "trendy casual chic";
        const ethnicity = body.ethnicity || "medium skin tone";
        const age = body.age || "Young";
        const hairColor = body.hairColor || "Dark espresso brown";
        const outfit = body.outfit || "Simple heather grey fitted t-shirt";
        const background = body.background || "Solid high-key PURE WHITE seamless studio backdrop";

        const makeup = body.makeup || "soft makeup";
        const expression = body.expression || "neutral expression";
        const lighting = body.lighting || "Soft shadowless lighting";
        const hairstylePrompt = body.hairstylePrompt || "glossy. Straight to wavy, thick, smooth. Long layered butterfly cut, 90s blowout style. Face-framing curtain bangs. Heavily layered mid-lengths to ends. Voluminous.";

        const AUTO_SUBJECT_PROMPT = `Generate a stunning, high-end editorial fashion photography reference image.

CRITICAL LAYOUT RULE: You MUST generate a VERTICAL DIPTYCH (a single image split into two stacked panels).
- Format: Vertical collage (two stacked panels).
- Divider: The top panel and bottom panel MUST merge perfectly together with NO visual separation. DO NOT draw a line, gap, stripe, border, or whitespace between them.
- Top Panel: FRONT VIEW (front-facing portrait, chest up).
- Bottom Panel: BACK VIEW (rear view, back of head and shoulders).

SUBJECT & STYLE:
- Model: ${age} female, beautifully striking, gorgeous model features, ${ethnicity}, ${expression}, ${makeup}. VERY IMPORTANT: The model MUST have a skinny, beautiful, fit body shape but with prominent, large natural breasts.
- Hair: ${hairColor}, ${hairstylePrompt}
- Attire & Aesthetic: ${outfit} with scoop neckline (identical in both panels, complementing the bust). Overall style aesthetic: ${inputAesthetic}.
- Environment: ${background}. ${lighting}.
- Specs: High-end commercial fashion photography, gorgeous flawless retouching but keeping realistic natural skin texture, masterpiece, 8k resolution, elegant, magazine cover quality.`;

        const AUTO_SUBJECT_NEGATIVE_PROMPT = "AI generated, synthetic, plastic skin, overly smooth, CGI, render, 3d, doll-like, fake, overly perfect, unnatural skin, shiny plastic skin, uncanny valley, cartoon, illustration, drawing, text, watermark, logos, blurry, bad proportions, distorted, asymmetrical face, messy hair covering face, smiling, dramatic lighting, shadows, colorful background, extravagant clothes, white line, visible border, separator line";
        console.log("[Auto-Subject] Generating automatic subject image...");
        const id = uuid();
        const filename = "ref_0.png";
        const storagePath = subjectPath(id, filename);

        const result = await generateAndSaveImage(
            {
                referenceImagePaths: [],
                finalPromptText: AUTO_SUBJECT_PROMPT,
                negativePrompt: AUTO_SUBJECT_NEGATIVE_PROMPT,
                aspectRatio: "3:4"
            },
            storagePath,
        );

        if (!result.success) {
            throw new Error(result.error || "Failed to generate subject image");
        }

        const name = `Auto Subject (${new Date().toLocaleDateString()})`;
        const description = "Automatically generated via Gemini API";

        const lockedAttributesJson = JSON.stringify({
            wardrobe: "current outfit in reference",
            background: "same as reference",
            lighting: "same as reference",
            camera: "same framing as reference"
        });

        const subject = await prisma.subject.create({
            data: {
                id,
                name,
                description,
                referenceImagePaths: JSON.stringify([storagePath]),
                lockedAttributesJson,
            },
        });

        console.log(`[Auto-Subject] Created subject: ${subject.name}`);
        return NextResponse.json(subject, { status: 201 });
    } catch (error: unknown) {
        console.error("[Auto-Subject] Error:", error);
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

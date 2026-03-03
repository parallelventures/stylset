import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAndSaveImage } from "@/services/geminiImage";
import { subjectPath } from "@/lib/storage";
import { v4 as uuid } from "uuid";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));

        const ethnicity = body.ethnicity || "medium skin tone";
        const age = body.age || "Young";
        const hairColor = body.hairColor || "Dark espresso brown";
        const outfit = body.outfit || "Simple heather grey fitted t-shirt";
        const background = body.background || "Solid high-key PURE WHITE seamless studio backdrop";

        const makeup = body.makeup || "soft makeup";
        const expression = body.expression || "neutral expression";
        const lighting = body.lighting || "Soft shadowless lighting";
        const hairstylePrompt = body.hairstylePrompt || "glossy. Straight to wavy, thick, smooth. Long layered butterfly cut, 90s blowout style. Face-framing curtain bangs. Heavily layered mid-lengths to ends. Voluminous.";
        const hairstyleName = body.hairstyleName || "Blowout";

        const AUTO_SUBJECT_PROMPT = `Generate a stunning, photorealistic high-end commercial hair catalog reference image.

CRITICAL LAYOUT RULE: You MUST generate a VERTICAL DIPTYCH (a single image split into two stacked panels).
- Format: Vertical collage (two stacked panels).
- Divider: The top panel and bottom panel MUST merge perfectly together with NO visual separation. DO NOT draw a line, gap, stripe, border, or whitespace between them.
- Top Panel: FRONT VIEW (front-facing portrait, chest up).
- Bottom Panel: BACK VIEW (rear view, back of head and shoulders).

SUBJECT & STYLE:
- Model: ${age} female, ${ethnicity}, ${expression}, ${makeup}. VERY IMPORTANT: The model MUST have prominent, extremely voluminous natural breasts (heavy bust weight, large cleavage, voluptuous figure).
- Hair: ${hairColor}, ${hairstylePrompt}
- Attire: ${outfit} with scoop neckline (identical in both panels, emphasizing the voluminous bust).
- Environment: ${background}. ${lighting}.
- Specs: 8k UHD, ultra-photorealistic.

TEXT OVERLAY RULE:
You MUST precisely render the exact text "${hairstyleName}" directly in the exact middle of the entire image, perfectly overlaying the intersection between the top and bottom panels.
The text must be SMALL, subtle, and elegantly placed.
EXTREMELY IMPORTANT FONT RULE: You MUST use a SMALL, classic, elegant serif font that matches the EXACT SAME TEXT FONT style as seen in previous generations or reference images. Do not make the text large or thick.`;

        const AUTO_SUBJECT_NEGATIVE_PROMPT = "white line, white stripe, white gap, visible border, separator line, separation line, divider line, single image, no split, wrong layout, ugly, basic, distorted, asymmetrical face, bad proportions, unnatural skin, shiny plastic skin, heavily filtered, uncanny valley, cartoon, illustration, drawing, text, watermark, logos, blurry, weird eyes, messy hair covering face, smiling, dramatic lighting, shadows, colorful background, extravagant clothes";
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

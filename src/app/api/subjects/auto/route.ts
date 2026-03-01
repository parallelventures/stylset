import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateAndSaveImage } from "@/services/geminiImage";
import { subjectPath } from "@/lib/storage";
import { v4 as uuid } from "uuid";
import fs from "fs/promises";

export const runtime = "nodejs";

const AUTO_SUBJECT_PROMPT = `Generate a stunning, photorealistic high-end studio portrait with the following exact specifications:

SUBJECT: Young female model, medium skin tone, neutral expression, soft makeup.
HAIR COLOR: Dark espresso brown, glossy finish.
HAIR TEXTURE: Straight to wavy, thick, smooth.
HAIR STYLE: Long layered butterfly cut, 90s blowout style. Face-framing curtain bangs starting at chin level. Heavily layered mid-lengths to ends. Voluminous roots. Center part, layers curving inward and outward framing the face.
ATTIRE: Simple heather grey fitted t-shirt with scoop neckline.
COMPOSITION: Front-facing portrait, chest up.
ENVIRONMENT: Solid high-key white studio backdrop. Soft, even professional studio lighting, shadowless.
TECHNICAL SPECS: Commercial hair photography, catalog aesthetic. 8k resolution, photorealistic, sharp focus on hair texture.`;

const AUTO_SUBJECT_NEGATIVE_PROMPT = "ugly, basic, distorted, asymmetrical face, bad proportions, unnatural skin, shiny plastic skin, heavily filtered, uncanny valley, cartoon, illustration, drawing, text, watermark, logos, blurry, weird eyes, messy hair covering face, smiling, dramatic lighting, shadows, colorful background, extravagant clothes";

export async function POST() {
    try {
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

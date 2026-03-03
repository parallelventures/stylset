import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { uploadFile, subjectPath, ensureBucket } from "@/lib/storage";
import { v4 as uuid } from "uuid";
import path from "path";
import { generateAndSaveImage } from "@/services/geminiImage";

export const runtime = "nodejs";

export async function GET() {
    const subjects = await prisma.subject.findMany({
        orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(subjects);
}

export async function POST(req: NextRequest) {
    try {
        await ensureBucket();

        const formData = await req.formData();
        const name = formData.get("name") as string;
        const description = (formData.get("description") as string) || null;
        const lockedAttributesJson = (formData.get("lockedAttributesJson") as string) || "{}";
        const enhanceQuality = formData.get("enhanceQuality") === "true";

        if (!name) {
            return NextResponse.json({ error: "name is required" }, { status: 400 });
        }

        try {
            JSON.parse(lockedAttributesJson);
        } catch {
            return NextResponse.json({ error: "Invalid lockedAttributesJson" }, { status: 400 });
        }

        const id = uuid();
        const storagePaths: string[] = [];
        const images = formData.getAll("images");

        for (let i = 0; i < images.length; i++) {
            const file = images[i];
            if (file instanceof File && file.size > 0) {
                const buffer = Buffer.from(await file.arrayBuffer());
                const ext = path.extname(file.name) || ".png";
                const filename = `ref_${i}${ext}`;
                const storagePath = subjectPath(id, filename);

                const mimeType = ext === ".png" ? "image/png" : ext === ".webp" ? "image/webp" : "image/jpeg";
                await uploadFile(storagePath, buffer, mimeType);

                if (enhanceQuality) {
                    console.log(`[Subjects API] Enhancing image quality for ${filename}...`);
                    await generateAndSaveImage(
                        {
                            referenceImagePaths: [storagePath],
                            finalPromptText: `CRITICAL INSTRUCTIONS:
You are an expert digital retoucher and high-end magazine photographer.
You have been provided a reference image.

WHAT TO DO:
- Vastly enhance the visual quality, definition, and resolution of the image.
- Enhance the lighting, colors, and sharpness to look like a high-end masterpiece portrait.
- Make the skin texture look extremely realistic, professional, and flawlessly retouched without looking like AI or CGI.

WHAT TO KEEP EXACTLY THE SAME:
- You MUST preserve the EXACT same person, face, identity, hairstyle, and hair color.
- You MUST preserve the EXACT same clothing, posture, and background.
- DO NOT change the subject's identity, clothes, or background. Just enhance the lighting and resolution.`,
                            negativePrompt: "AI generated, synthetic, plastic skin, overly smooth, CGI, render, 3d, doll-like, fake, overly perfect, unnatural skin, shiny plastic skin, uncanny valley, cartoon, illustration, drawing, text, watermark, logos, blurry, bad proportions, distorted, asymmetrical face, new person, different clothes",
                            aspectRatio: "3:4"
                        },
                        storagePath
                    );
                }

                storagePaths.push(storagePath);
            }
        }

        if (storagePaths.length === 0) {
            return NextResponse.json({ error: "At least one reference image is required" }, { status: 400 });
        }

        const subject = await prisma.subject.create({
            data: {
                id,
                name,
                description,
                referenceImagePaths: JSON.stringify(storagePaths),
                lockedAttributesJson,
            },
        });

        return NextResponse.json(subject, { status: 201 });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}

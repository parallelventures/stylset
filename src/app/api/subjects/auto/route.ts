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

        const inputAesthetic = body.aesthetic || "classic";
        const ethnicity = body.ethnicity || "medium skin tone";
        const age = body.age || "Young";
        const hairColor = body.hairColor || "Dark espresso brown";
        const outfit = body.outfit || "structured corset-style top, matte premium crepe, clean lines (white)";
        const pose = body.pose || "standing tall, shoulders relaxed, arms down and fully out of frame";
        const makeup = body.makeup || "soft makeup";
        const expression = body.expression || "neutral expression";
        const hairstylePrompt = body.hairstylePrompt || "glossy. Straight to wavy, thick, smooth. Long layered butterfly cut, 90s blowout style. Face-framing curtain bangs. Heavily layered mid-lengths to ends. Voluminous.";

        const lookMap: Record<string, string> = {
            "classic": "sexy model-off-duty luxe (clean, expensive, ultra photogenic)",
            "clean tiktok girl": "clean girl aesthetic, tiktok trendy soft glam, dewy skin, effortless beauty, relatable but beautiful",
            "y2k": "nostalgic Y2K pop star aesthetic, 2000s fashion model vibe, trendy, striking",
            "goth": "dark alternative goth beauty, edgy, mysterious, striking pale photogenic contrast",
            "old money": "quiet luxury, old money aesthetic, sophisticated, wealthy heir vibe, impeccably groomed",
            "parisian girl": "parisian sexy supermodel vibe (expensive, clean, ultra photogenic)"
        };

        const jsonPrompt = {
            "hairstyle_model_prompt": {
                "id": `women_${inputAesthetic.replace(/\s+/g, "_")}_model`,
                "meta": {
                    "aspect_ratio": "4:5 portrait",
                    "quality": "ultra_photorealistic",
                    "resolution": "8k UHD",
                    "camera": "iPhone 17 Pro Max (rear camera, studio portrait)",
                    "lens": "24mm wide",
                    "style": `premium studio catalog model, pure white background ONLY, hair-focused, ${inputAesthetic} aesthetic, minimal retouch`,
                    "consistency_rule": "NEW WOMAN. Completely different identity. No resemblance to any real person."
                },
                "composition": {
                    "shot_type": "studio portrait (not selfie)",
                    "pose": pose,
                    "framing": "top of head to mid-chest, centered",
                    "head_angle": "front-facing (0–3°), chin level",
                    "eye_contact": "direct eye contact with the camera",
                },
                "subject": {
                    "category": "Women",
                    "age": age,
                    "model_profile": {
                        "type": "agency-grade commercial beauty / fashion model",
                        "look": lookMap[inputAesthetic] || lookMap["classic"],
                        "beauty_traits": [
                            "harmonious facial proportions",
                            "symmetrical features",
                            "high cheekbones",
                            "soft defined jawline",
                            "almond-shaped eyes",
                            "balanced nose",
                            "full but natural lips"
                        ],
                        "ethnicity": ethnicity
                    },
                    "expression": expression,
                    "skin_and_makeup": {
                        "skin": "healthy luxury skin, realistic pores, even tone, soft glow",
                        "makeup": makeup
                    },
                    "hair": {
                        "color": hairColor,
                        "description": hairstylePrompt
                    },
                    "wardrobe": {
                        "outfit": outfit,
                        "logo_rule": "no logos, no prints, no text"
                    }
                },
                "photography": {
                    "lighting": "two large softboxes 45° left/right + gentle frontal fill; subtle hair-light kicker to show crown lift and length shine",
                    "background": "pure white seamless (#FFFFFF) ONLY, evenly lit, absolutely no gradient, no texture, nothing else",
                    "exposure": "bright premium catalog exposure",
                    "focus": "tack-sharp eyes + crisp part + length shine",
                    "white_balance": "neutral studio daylight",
                    "dynamic_range": "high, preserve specular highlights without blowing out whites",
                    "retouch_policy": "minimal editorial retouch only; keep pores and realism"
                }
            }
        };

        const AUTO_SUBJECT_PROMPT = JSON.stringify(jsonPrompt, null, 2);

        const AUTO_SUBJECT_NEGATIVE_PROMPT = [
            "no phone", "no mirror", "no props", "no text overlays", "no watermark",
            "no logos on clothing", "no heavy jewelry", "no distorted face", "no asymmetrical eyes",
            "no extra fingers/limbs", "no colored background", "no background gradient",
            "no background texture", "no background objects", "no studio elements visible",
            "no heavy beauty filter", "no uncanny valley", "no low-resolution artifacts",
            "no harsh shadows", "no frizz", "no flyaways", "no hair covering the eyes"
        ].join(", ");
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

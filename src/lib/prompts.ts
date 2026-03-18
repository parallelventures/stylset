/**
 * Prompt Composition Engine
 *
 * Composes the final prompt sent to Gemini by merging:
 * 1. Hard identity-lock instructions
 * 2. Scene/subject locked attributes
 * 3. Base template prompt (photorealistic, lighting, etc.)
 * 4. Hairstyle-only variation
 */

interface ComposeInput {
    lockedAttributes: Record<string, string>;
    basePrompt: Record<string, string>;
    hairstylePrompt: string;
    negativeHairPrompt?: string;
}

interface ComposeOutput {
    finalPrompt: string;
    finalNegativePrompt: string;
    metadata: Record<string, unknown>;
}

const IDENTITY_LOCK = `CRITICAL RULES — MUST FOLLOW:
You are looking at the SAME PERSON shown in the reference image(s).
Generate a new image of this EXACT SAME PERSON with ONLY the hairstyle and hair color changed.

You MUST preserve ALL of the following EXACTLY as they appear in the reference:
- Face (every facial feature, shape, symmetry)
- Skin tone and texture
- Body type, build, proportions
- Age and expression
- Pose and posture
- Framing, camera angle, and cropping
- Wardrobe / clothing
- Background and environment
- Lighting and color grading
- Camera lens and depth of field

The ONLY things that change are the HAIRSTYLE and HAIR COLOR described below.
Do NOT alter ANYTHING else. The person MUST be recognizably the same individual.`;

const BASE_NEGATIVE = [
    "different person",
    "different identity",
    "face change",
    "altered face",
    "different skin tone",
    "altered body",
    "different age",
    "different expression",
    "different wardrobe",
    "different clothing",
    "background change",
    "different lighting",
    "different pose",
    "different camera angle",
    "different framing",
].join(", ");

export function composePrompt(input: ComposeInput): ComposeOutput {
    const parts: string[] = [];

    // 1. Identity lock
    parts.push(IDENTITY_LOCK);

    // 2. Locked attributes
    const attrLines: string[] = [];
    for (const [key, value] of Object.entries(input.lockedAttributes)) {
        attrLines.push(`- ${key}: ${value}`);
    }
    if (attrLines.length > 0) {
        parts.push(`\nSCENE ATTRIBUTES TO PRESERVE:\n${attrLines.join("\n")}`);
    }

    // 3. Base template prompt
    const templatePrompt = input.basePrompt.prompt || "";
    if (templatePrompt) {
        parts.push(`\nIMAGE STYLE: ${templatePrompt}`);
    }

    // 4. Hairstyle
    parts.push(`\nHAIRSTYLE (the ONLY change): ${input.hairstylePrompt}`);

    // Build negative
    const negParts: string[] = [BASE_NEGATIVE];
    if (input.basePrompt.negative_prompt) {
        negParts.push(input.basePrompt.negative_prompt);
    }
    if (input.negativeHairPrompt) {
        negParts.push(input.negativeHairPrompt);
    }

    return {
        finalPrompt: parts.join("\n"),
        finalNegativePrompt: negParts.join(", "),
        metadata: {
            style: input.basePrompt.style || "photorealistic",
            aspect_ratio: input.basePrompt.aspect_ratio || "3:4",
            lighting: input.basePrompt.lighting || "",
            background: input.basePrompt.background || "",
        },
    };
}

/* ─── Color-Only Variation ─── */

interface ComposeColorInput {
    lockedAttributes: Record<string, string>;
    basePrompt: Record<string, string>;
    hairColorPrompt: string;
}

const COLOR_ONLY_LOCK = `CRITICAL RULES — MUST FOLLOW:
You are looking at the SAME PERSON shown in the reference image(s).
Generate a new image of this EXACT SAME PERSON with ONLY the HAIR COLOR changed.

You MUST preserve ALL of the following EXACTLY as they appear in the reference:
- Face (every facial feature, shape, symmetry)
- Skin tone and texture
- Body type, build, proportions
- Age and expression
- Pose and posture
- Framing, camera angle, and cropping
- Wardrobe / clothing
- Background and environment
- Lighting and color grading
- Camera lens and depth of field
- HAIRSTYLE: Keep the EXACT SAME hairstyle shape, length, texture, volume, parting, and styling as the reference. Do NOT change the haircut or style in ANY way.

The ONLY thing that changes is the HAIR COLOR described below.
Do NOT alter the hairstyle, haircut, hair length, hair texture, or anything else. The person MUST be recognizably the same individual with the same exact hairdo.`;

const COLOR_ONLY_NEGATIVE = [
    "different person",
    "different identity",
    "face change",
    "altered face",
    "different skin tone",
    "altered body",
    "different age",
    "different expression",
    "different wardrobe",
    "different clothing",
    "background change",
    "different lighting",
    "different pose",
    "different camera angle",
    "different framing",
    "different hairstyle",
    "different haircut",
    "different hair length",
    "different hair texture",
    "different hair volume",
].join(", ");

export function composeColorOnlyPrompt(input: ComposeColorInput): ComposeOutput {
    const parts: string[] = [];

    // 1. Color-only identity lock
    parts.push(COLOR_ONLY_LOCK);

    // 2. Locked attributes
    const attrLines: string[] = [];
    for (const [key, value] of Object.entries(input.lockedAttributes)) {
        attrLines.push(`- ${key}: ${value}`);
    }
    if (attrLines.length > 0) {
        parts.push(`\nSCENE ATTRIBUTES TO PRESERVE:\n${attrLines.join("\n")}`);
    }

    // 3. Base template prompt
    const templatePrompt = input.basePrompt.prompt || "";
    if (templatePrompt) {
        parts.push(`\nIMAGE STYLE: ${templatePrompt}`);
    }

    // 4. Hair color only
    parts.push(`\nHAIR COLOR (the ONLY change — keep the EXACT same hairstyle): ${input.hairColorPrompt}`);

    // Build negative
    const negParts: string[] = [COLOR_ONLY_NEGATIVE];
    if (input.basePrompt.negative_prompt) {
        negParts.push(input.basePrompt.negative_prompt);
    }

    return {
        finalPrompt: parts.join("\n"),
        finalNegativePrompt: negParts.join(", "),
        metadata: {
            style: input.basePrompt.style || "photorealistic",
            aspect_ratio: input.basePrompt.aspect_ratio || "3:4",
            lighting: input.basePrompt.lighting || "",
            background: input.basePrompt.background || "",
        },
    };
}

export interface ComposeSelfieInput {
    location: string;
    outfit: string;
    hair: string;
    style?: string;
}

const SELFIE_IDENTITY_LOCK = `CRITICAL RULES — MUST FOLLOW:
You are looking at the SAME PERSON shown in the reference image(s).
Generate a new image of this EXACT SAME PERSON but taking a selfie.

You MUST preserve ALL of the following EXACTLY as they appear in the reference:
- Face (every facial feature, shape, symmetry)
- Skin tone and texture
- Body proportions and bust size
- Age

WHAT WILL CHANGE:
- Hairstyle
- Outfit / Attire
- Environment / Background
- Pose (front-facing selfie, holding camera out of frame)

The person MUST be recognizably the same individual.`;

const SELFIE_NEGATIVE = [
    "different person",
    "different identity",
    "face change",
    "altered face",
    "different skin tone",
    "altered body proportions",
    "different age",
    "professional photoshoot",
    "studio lighting",
    "photographer visible",
    "outside",
    "outdoors",
    "phone visible",
    "holding phone",
    "mirror",
    "mirror selfie",
    "smartphone",
    "camera visible"
].join(", ");

export function composeSelfiePrompt(input: ComposeSelfieInput): ComposeOutput {
    const parts: string[] = [];

    parts.push(SELFIE_IDENTITY_LOCK);

    parts.push(`
IMAGE TO GENERATE:
A beautiful, casual 4:5 aspect ratio selfie taken indoors.

SCENE DETAILS:
- Location / Background: ${input.location} (INDOORS ONLY)
- Outfit: ${input.outfit}
- Hairstyle: ${input.hair}
- Pose: Front-facing point-of-view selfie pose. One arm extended out of frame holding the (invisible) camera. DO NOT show any phone or camera in the image. No mirror selfies.
- Style: ${input.style || "photorealistic, high quality, casual everyday photography"}`);

    return {
        finalPrompt: parts.join("\n"),
        finalNegativePrompt: SELFIE_NEGATIVE,
        metadata: {
            style: "photorealistic selfie",
            aspect_ratio: "4:5", // 4:5 selfie aspect ratio requested
            lighting: "indoor ambient",
            background: input.location,
        }
    };
}

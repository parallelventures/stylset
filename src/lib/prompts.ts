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
Generate a new image of this EXACT SAME PERSON with ONLY the hairstyle changed.

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

The ONLY thing that changes is the HAIRSTYLE described below.
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
- Pose (taking a mirror selfie or front-facing phone selfie)

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
- Pose: Casual selfie pose (front-facing phone selfie or mirror selfie)
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

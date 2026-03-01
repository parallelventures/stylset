/**
 * Model Variation Generator
 *
 * Generates a new model/person for each set using Gemini based on
 * a high-end catalog photography reference prompt.
 */
import { generateAndSaveImage } from "@/services/geminiImage";

const ORIGINS = [
    "France", "Italy", "Spain", "Brazil", "Morocco", "Japan", "South Korea",
    "Sweden", "Nigeria", "Colombia", "Russia", "India", "Lebanon", "Greece",
    "Ethiopia", "Mexico", "Thailand", "Germany", "Argentina", "Vietnam"
];

const HAIR_COLORS = [
    "rich chocolate brunette", "soft honey blonde", "icy platinum blonde",
    "deep espresso black", "warm copper red", "ash brown", "chestnut",
    "golden caramel", "strawberry blonde", "jet black"
];

export async function generateModelImage(
    referenceImagePaths: string[],
    _ignoredPrompt: string | undefined, // Keeping signature for compatibility, but ignoring
    outputStoragePath: string,
): Promise<{ success: boolean; error?: string }> {
    // Generate random traits to ensure a "new woman" every time
    const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
    const hairColor = HAIR_COLORS[Math.floor(Math.random() * HAIR_COLORS.length)];

    const finalPrompt = `CRITICAL RULES — MUST FOLLOW:
You are a world-class fashion photographer and retoucher.
Generate a new image where the EXACT SAME SCENE, POSE, AND WARDROBE are preserved from the reference image, but the PERSON is COMPLETELY DIFFERENT.

You MUST preserve ALL of the following EXACTLY as they appear in the reference:
- Pose and posture
- Framing and camera angle
- Wardrobe / clothing (must be the exact same clothes with the same colors and textures)
- Background and environment (must be the exact same setting)
- Lighting and color grading
- Camera lens and depth of field
- Overall image aesthetic and body type

The ONLY thing that changes is the IDENTITY of the person's face.
NEW IDENTITY: A completely different woman. No resemblance to the original person.
Origin: ${origin}.
Age: 22-28.
Model profile: Agency-grade commercial beauty model, clean casting beauty, very photogenic, healthy luxury skin.
Hair: ${hairColor} (clean and simple).

Do NOT alter the wardrobe, background, or pose. The newly generated woman MUST be wearing the exact same clothes in the exact same setting as the reference image.`;

    const negativePrompt = "no phone, no mirror, no props, no text overlays, no watermark, no logos, no colored background, no gradients, no background texture, no studio elements visible, no heavy beauty filter, no uncanny valley, no distorted face, no extra limbs, no harsh shadows, no frizz, no flyaways, no hair covering eyes";

    return generateAndSaveImage(
        {
            referenceImagePaths,
            finalPromptText: finalPrompt,
            negativePrompt,
            aspectRatio: "3:4"
        },
        outputStoragePath,
    );
}

export function getRandomModelName(): string {
    const origin = ORIGINS[Math.floor(Math.random() * ORIGINS.length)];
    return `Auto-Model (${origin})`;
}

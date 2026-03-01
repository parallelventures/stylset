/**
 * Model Variation Generator
 *
 * Generates a new model/person for each set using Gemini based on
 * a high-end catalog photography reference prompt.
 */
import { generateAndSaveImage } from "@/services/geminiImage";

const ORIGINS = [
    "France", "Italy", "Spain", "Brazil", "Morocco", "Japan", "South Korea",
    "Sweden", "Poland", "Colombia", "Russia", "Netherlands", "Lebanon", "Greece",
    "Turkey", "Mexico", "Denmark", "Germany", "Argentina", "Vietnam"
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

    const finalPrompt = `CRITICAL TASK: DIGITAL FACE REPLACEMENT (FACE SWAP)
You are an expert digital retoucher and fashion photographer.

You MUST recreate the attached reference image EXACTLY as it is, BUT you must completely SWAP the woman's face. 

MANDATORY RULES FOR PRESERVATION (DO NOT CHANGE THESE):
- EXACT same wardrobe, clothing color, and fabric.
- EXACT same background, studio lighting, and shadows.
- EXACT same body posture, framing, and camera angle.

MANDATORY RULES FOR THE NEW FACE:
- Generate a completely NEW, breathtakingly beautiful face.
- Origin: ${origin}.
- Hair Color: ${hairColor}.
- Aesthetics: High-end agency supermodel. Captivating, symmetrical features, glowing, healthy realistic skin (no plastic filters).
- Age: 22-26.
- The new face MUST look absolutely nothing like the person in the reference image. You are replacing her face entirely with a new, gorgeous ${origin} model.

If you change the clothes or background, you fail.
If you simply copy the original face, you fail.`;

    const negativePrompt = "same face as reference, original model face, exact same person, cloning, copied face, lookalike, twin, changed background, changed clothes, altered wardrobe, altered lighting, ugly, basic, asymmetrical face, unnatural skin, shiny plastic skin, cartoon, blurry";

    return generateAndSaveImage(
        {
            referenceImagePaths, // Restore using the subject reference image!
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

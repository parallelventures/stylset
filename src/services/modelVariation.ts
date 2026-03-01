/**
 * Model Variation Generator
 *
 * Generates a new model/person for each set using Gemini based on
 * a high-end catalog photography reference prompt.
 */
import { generateAndSaveImage } from "@/services/geminiImage";

const ORIGINS = [
    "France", "Italy", "Spain", "Brazil", "Morocco", "Japan", "South Korea",
    "Sweden", "Poland", "Colombia", "Russia", "India", "Lebanon", "Greece",
    "Turkey", "Mexico", "Thailand", "Germany", "Argentina", "Vietnam"
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

    const finalPrompt = `You are a world-class fashion photographer and digital retoucher producing imagery for a high-end agency.

Based on the attached reference image, your task is to generate a STUNNING, AGENCY-GRADE BEAUTY MODEL.
Crucially, you must use the reference image ONLY to copy the clothing, the pose, the lighting, and the background.
DO NOT COPY THE FACE FROM THE REFERENCE IMAGE. The face must be a COMPLETELY NEW IDENTITY.

--- NEW MODEL IDENTITY (MANDATORY) ---
- Nationality/Origin: ${origin} (Ensure her facial features prominently and beautifully reflect this ethnicity)
- Hair Color: ${hairColor}
- Aesthetics: Exquisitely beautiful, striking high-fashion agency model. Symmetrical, captivating features with natural, healthy, glowing skin (realistic pores and texture, NOT plastic or heavily filtered).
- Age: 22-26.
- Expression: Very slight, relaxed, confident high-fashion gaze.

--- SCENE CLONING (MANDATORY) ---
- Wardrobe: Keep the EXACT SAME CLOTHING, colors, and textures as the reference.
- Setting: Keep the EXACT SAME BACKGROUND and environment.
- Pose: Keep the EXACT SAME POSE and camera framing.
- Lighting: Maintain the exact same studio lighting and color grading.

IF YOU COPY THE FACE FROM THE REFERENCE IMAGE, YOU HAVE FAILED. You must generate a striking, gorgeous, completely new ${origin} woman wearing the reference's clothes in the reference's environment.`;

    const negativePrompt = "same face as reference, identical person, cloning, copied face, twin, ugly, basic, distorted, asymmetrical face, bad proportions, unnatural skin, shiny plastic skin, heavily filtered, uncanny valley, text, watermark, logos, changed background, changed clothes, weird eyes";

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

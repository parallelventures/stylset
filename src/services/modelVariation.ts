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

    const finalPrompt = `You are a world-class fashion photographer and digital retoucher.
Your task is to recreate the attached reference image EXACTLY in terms of clothing, background, lighting, and pose, BUT YOU MUST REPLACE THE MODEL WITH A COMPLETELY NEW PERSON.

NEW MODEL IDENTITY (MUST USE THESE TRAITS):
- Nationality/Origin: ${origin}
- Hair Color: ${hairColor}
- Unique Features: Distinctive ${origin} facial structure, completely different eye shape, different nose, and different jawline from the reference image.
- Age: 22-28, natural, agency-grade commercial beauty model.

MANDATORY RULES:
1. SCENE PRESERVATION: The new image MUST have the EXACT same clothes, colors, background, lighting, and camera angle as the reference image.
2. IDENTITY SWAP: The woman's face and identity MUST be completely swapped to the new ${origin} identity described above. DO NOT copy the face from the reference image.
3. QUALITY: High-end studio portrait, 8k UHD, ultra-photorealistic, clean casting beauty.

Failure to change the woman's face will result in rejection. The person must look strikingly different while wearing the exact same outfit in the exact same setting.`;

    const negativePrompt = "same face as reference, identical person, cloning, copied face, original model's face, twin, uncanny valley, ugly, distorted, heavily filtered, text, watermark, logos, changed background, changed clothes";

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

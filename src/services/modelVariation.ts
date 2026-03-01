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

    const OUTFITS = [
        "minimalist white silk slip dress",
        "tailored oversized black blazer with a simple tank",
        "casual chic beige trench coat",
        "form-fitting ribbed knit turtleneck in charcoal",
        "effortless denim jacket over a white tee",
        "elegant off-the-shoulder navy gown",
        "sleek leather jacket with a simple top",
        "soft cashmere sweater in camel"
    ];
    const outfit = OUTFITS[Math.floor(Math.random() * OUTFITS.length)];

    const SETTINGS = [
        "bright natural sunlight studio, pure white seamless backdrop",
        "moody editorial studio, dramatic shadows, dark gray background",
        "soft diffused lighting, warm beige backdrop",
        "high-end catalog lighting, crisp white background",
        "warm golden hour studio lighting, soft textured backdrop"
    ];
    const setting = SETTINGS[Math.floor(Math.random() * SETTINGS.length)];

    const finalPrompt = `CRITICAL INSTRUCTIONS:
You are an expert digital retoucher and high-end fashion photographer.
You have been provided a reference image.

WHAT TO KEEP EXACTLY THE SAME:
- You MUST preserve the EXACT same body posture, framing, and camera angle as the reference image. The subject must be positioned in the exact same spot within the frame.

WHAT TO CHANGE COMPLETELY:
1. IDENTITY: Generate a completely NEW, breathtakingly beautiful face. 
   - Origin: ${origin}. 
   - Hair Color: ${hairColor}. 
   - Age: 22-26. 
   - Look: High-end agency supermodel. Symmetrical, glowing, healthy realistic skin. It must look absolutely nothing like the person in the reference image.
2. OUTFIT / WARDROBE: Change her clothing entirely. She is now wearing a ${outfit}.
3. SETTING / STUDIO: Change the environment entirely. The background and lighting are now: ${setting}.

Do not copy the original face, the original clothes, or the original background. Just map the new beautiful ${origin} model wearing a ${outfit} into the exact same pose and framing as the reference.`;

    const negativePrompt = "same face as reference, original model face, exact same person, cloning, copied face, lookalike, twin, original clothes, old clothes, original background, ugly, basic, asymmetrical face, unnatural skin, shiny plastic skin, cartoon, blurry";

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

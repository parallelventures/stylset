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

    const finalPrompt = `You are a world-class fashion photographer producing imagery for a high-end modeling agency.

Your task is to photograph a STUNNING, AGENCY-GRADE BEAUTY MODEL. 
This is a completely original portrait. 

--- MODEL IDENTITY ---
- Nationality/Origin: ${origin} (Her facial features should beautifully reflect this ethnicity)
- Hair Color: ${hairColor}
- Aesthetics: Exquisitely beautiful, striking high-fashion agency model. Symmetrical, captivating features with natural, healthy, glowing skin (realistic pores and texture, NOT plastic or heavily filtered).
- Age: 22-26.
- Expression: Very slight, relaxed, confident high-fashion gaze. Direct eye contact.

--- SCENE & STYLING ---
- Wardrobe: She is wearing a ${outfit}.
- Setting: ${setting}.
- Pose: Front-facing portrait (top of head to mid-chest).
- Photography: Shot on 85mm lens, f/5.6 for sharp focus on the face. 8k UHD, ultra-photorealistic.

Generate the most breathtaking, hyper-realistic fashion portrait possible.`;

    const negativePrompt = "ugly, basic, distorted, asymmetrical face, bad proportions, unnatural skin, shiny plastic skin, heavily filtered, uncanny valley, cartoon, illustration, drawing, text, watermark, logos, blurry, weird eyes, messy hair covering face";

    return generateAndSaveImage(
        {
            referenceImagePaths: [], // No reference image used, pure text-to-image for a 100% new person!
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

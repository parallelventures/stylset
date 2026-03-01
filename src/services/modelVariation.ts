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

    const finalPrompt = `You are a world-class fashion photographer creating a reference portrait.

TASK: Generate a NEW WOMAN. Completely different identity from the reference image. No resemblance to any real person. 
Origin: ${origin}.

STYLE REFERENCE: Use the provided reference ONLY as inspiration for lighting and framing. DO NOT copy the face.

### GENERATION REQUIREMENTS ###

1. QUALITY & RESOLUTION
- ultra_photorealistic, 8k UHD
- Camera: iPhone 17 Pro Max (rear camera, studio portrait) or 24mm wide lens
- Style: Premium hair catalog reference, minimal retouch, hair-focus
- Background: PURE WHITE (#FFFFFF) seamless ONLY, evenly lit

2. COMPOSITION & FRAMING
- Shot type: Studio portrait (not selfie)
- Framing: Top of head to mid-chest, centered, symmetrical
- Head angle: Front-facing (0–2°), chin level
- Eye contact: Direct eye contact
- Hair visibility: Show hairstyle volume clearly, keep hair off eyes

3. SUBJECT (NEW IDENTITY)
- Category: Woman
- Age: Adult (22–28)
- Model profile: Agency-grade commercial beauty model, clean casting beauty, expensive, natural, very photogenic
- Expression: Neutral calm (closed lips), relaxed face
- AVOID: no doll-like face, no oversized eyes, no exaggerated lips, no wax/plastic skin, no warped symmetry

4. SKIN & MAKEUP
- Skin: Healthy luxury skin, realistic pores, even tone, soft glow
- Makeup: Minimal catalog (brushed brows, subtle liner, natural lashes, light blush, satin nude lips)

5. HAIR (BASE LOOK)
- Color: ${hairColor} (single tone with subtle natural dimension)
- Style: Clean, simple, and natural. Keep it off the face so it can be replaced later.

6. WARDROBE
- Top: Minimal fitted scoop-neck tee
- Color: Heather gray or soft neutral
- Material: Thick cotton jersey (not sheer)
- Accessories: NONE (no earrings, no necklace)

7. PHOTOGRAPHY & LIGHTING
- Lighting: Two large softboxes 45° left/right + gentle frontal fill; soft hair-light kicker perfectly even
- Exposure: Bright premium catalog exposure; protect highlights
- Focus: Tack-sharp eyes
- White balance: Neutral studio daylight (color-accurate)
- Retouch: Minimal editorial retouch only; KEEP PORES AND REALISM`;

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

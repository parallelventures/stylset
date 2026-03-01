/**
 * Model Variation Generator
 *
 * Generates a new model/person for each set using Gemini.
 * Takes the original subject's reference images as "style inspiration"
 * and a model variation prompt to create a new person.
 */
import { generateAndSaveImage } from "@/services/geminiImage";
import { downloadFile, setImagePath } from "@/lib/storage";

const MODEL_GENERATION_PROMPT = `You are a professional photographer creating a portrait for a high-end hairstyle lookbook.

TASK: Generate a brand-new, photorealistic portrait of a different person than shown in the reference images.

STYLE REFERENCE: Use the provided reference images ONLY as inspiration for:
- Photography style (lighting, camera angle, framing)
- Image quality and resolution
- Professional studio aesthetic

NEW MODEL REQUIREMENTS:
{MODEL_DESCRIPTION}

CRITICAL RULES:
- This must be a COMPLETELY DIFFERENT PERSON from the reference images
- The result must look like a real photograph, not AI-generated
- Studio quality, sharp focus on the face
- Neutral facial expression or slight smile
- The person should look stunningly beautiful and photogenic
- Clean, uncluttered background (studio backdrop)
- Shot from shoulders up, face clearly visible
- Natural skin texture, no heavy retouching look
- The hairstyle should be simple/natural — it will be changed later`;

export async function generateModelImage(
    referenceImagePaths: string[],
    modelVariationPrompt: string,
    outputStoragePath: string,
): Promise<{ success: boolean; error?: string }> {
    const finalPrompt = MODEL_GENERATION_PROMPT.replace(
        "{MODEL_DESCRIPTION}",
        modelVariationPrompt,
    );

    return generateAndSaveImage(
        {
            referenceImagePaths,
            finalPromptText: finalPrompt,
        },
        outputStoragePath,
    );
}

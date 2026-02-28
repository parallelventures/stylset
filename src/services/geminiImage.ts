/**
 * Gemini Image Generation Service
 *
 * Uses gemini-3-pro-image-preview. Saves output to Supabase Storage.
 */
import { GoogleGenAI } from "@google/genai";
import { uploadFile, downloadFile, bufferHash } from "@/lib/storage";

export const GEMINI_MODEL = "gemini-3-pro-image-preview";

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface GenerateImageInput {
    referenceImagePaths: string[]; // Supabase storage paths (e.g. subjects/{id}/ref_0.png)
    finalPromptText: string;
    negativePrompt?: string;
    aspectRatio?: string;
}

interface GenerateImageResult {
    success: boolean;
    publicUrl?: string;
    hash?: string;
    error?: string;
}

export async function generateAndSaveImage(
    input: GenerateImageInput,
    outputStoragePath: string,
): Promise<GenerateImageResult> {
    try {
        if (!process.env.GEMINI_API_KEY) {
            throw new Error("GEMINI_API_KEY not set");
        }

        // Build multi-part contents
        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];

        // Add reference images (download from Supabase)
        for (const refPath of input.referenceImagePaths) {
            try {
                const buffer = await downloadFile(refPath);
                const ext = refPath.split(".").pop()?.toLowerCase() || "png";
                const mimeType =
                    ext === "png" ? "image/png" :
                        ext === "webp" ? "image/webp" :
                            ext === "gif" ? "image/gif" :
                                "image/jpeg";

                parts.push({
                    inlineData: {
                        mimeType,
                        data: buffer.toString("base64"),
                    },
                });
            } catch (err) {
                console.warn(`[Gemini] Could not download reference: ${refPath}`, err);
            }
        }

        // Build prompt
        let fullPrompt = input.finalPromptText;
        if (input.negativePrompt) {
            fullPrompt += `\n\nIMPORTANT — DO NOT include any of the following: ${input.negativePrompt}`;
        }

        parts.push({ text: fullPrompt });

        // Call Gemini
        const response = await genai.models.generateContent({
            model: GEMINI_MODEL,
            contents: [{ role: "user", parts }],
            config: {
                responseModalities: ["image", "text"],
            },
        });

        // Extract image
        if (!response.candidates?.[0]?.content?.parts) {
            throw new Error("No response parts from Gemini");
        }

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData?.data) {
                const buffer = Buffer.from(part.inlineData.data, "base64");
                const hash = bufferHash(buffer);

                // Upload to Supabase Storage
                const publicUrl = await uploadFile(outputStoragePath, buffer, "image/png");

                console.log(`[Gemini] Image saved: ${outputStoragePath} (${Math.round(buffer.length / 1024)}KB)`);
                return { success: true, publicUrl, hash };
            }
        }

        throw new Error("No image data in Gemini response");
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Gemini] Error:`, msg);
        return { success: false, error: msg };
    }
}

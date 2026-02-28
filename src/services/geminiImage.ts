/**
 * Gemini Image Generation Service
 *
 * Uses gemini-3-pro-image-preview. Saves output to Supabase Storage.
 */
import { GoogleGenAI } from "@google/genai";
import { uploadFile, downloadFile, bufferHash } from "@/lib/storage";

export const GEMINI_MODEL = "gemini-3-pro-image-preview";

let _keys: string[] = [];

function getApiKeys(): string[] {
    if (_keys.length === 0) {
        const raw = process.env.GEMINI_API_KEY || "";
        // Support comma-separated list
        _keys = raw.split(",").map(k => k.trim()).filter(Boolean);
    }
    return _keys;
}

const _genaiInstances: Record<string, GoogleGenAI> = {};
function getGenAI(apiKey: string): GoogleGenAI {
    if (!_genaiInstances[apiKey]) {
        _genaiInstances[apiKey] = new GoogleGenAI({ apiKey });
    }
    return _genaiInstances[apiKey];
}
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
        const keys = getApiKeys();
        if (keys.length === 0) {
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

        // Shuffle keys to distribute load, or fallback on failure
        const shuffledKeys = [...keys].sort(() => Math.random() - 0.5);

        let lastError: unknown;
        for (const apiKey of shuffledKeys) {
            try {
                // Call Gemini
                const response = await getGenAI(apiKey).models.generateContent({
                    model: GEMINI_MODEL,
                    contents: [{ role: "user", parts }],
                    config: {
                        // @ts-ignore
                        responseModalities: ["image"],
                        // @ts-ignore
                        addWatermark: false,
                        outputMimeType: "image/png"
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

                        return { success: true, publicUrl, hash };
                    }
                }

                throw new Error("Empty image response");
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : String(err);
                console.warn(`[Gemini] Key ending in *${apiKey.slice(-4)} failed:`, msg);
                lastError = err;
            }
        }

        throw new Error(lastError instanceof Error ? lastError.message : "All Gemini API keys failed");
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Gemini] Error:`, msg);
        return { success: false, error: msg };
    }
}

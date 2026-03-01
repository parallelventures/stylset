/**
 * Gemini Image Generation Service
 *
 * Uses gemini-3-pro-image-preview. Saves output to Supabase Storage.
 */
import { GoogleGenAI } from "@google/genai";
import { uploadFile, downloadFile, bufferHash } from "@/lib/storage";

export const GEMINI_MODEL = "gemini-3-pro-image-preview";

/* ─── Rate limiter ─── */
const MIN_CALL_INTERVAL_MS = 4000; // minimum 4s between API calls
const RATE_LIMIT_RETRIES = 3; // retries specifically for 429 errors
const RATE_LIMIT_BASE_MS = 8000; // starting backoff for 429
const RATE_LIMIT_MAX_MS = 60000; // max backoff cap

let _lastCallTime = 0;

function getApiKeys(): string[] {
    const raw = process.env.GEMINI_API_KEY || "";
    // Support comma-separated list
    return raw.split(",").map((k) => k.trim()).filter(Boolean);
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
            // Rate-limit retry loop for each key
            for (let rateLimitAttempt = 0; rateLimitAttempt <= RATE_LIMIT_RETRIES; rateLimitAttempt++) {
                try {
                    // Enforce minimum interval between calls
                    const now = Date.now();
                    const elapsed = now - _lastCallTime;
                    if (elapsed < MIN_CALL_INTERVAL_MS) {
                        const waitMs = MIN_CALL_INTERVAL_MS - elapsed;
                        await new Promise((r) => setTimeout(r, waitMs));
                    }
                    _lastCallTime = Date.now();

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

                    // Extract image from response
                    const candidate = response.candidates?.[0];

                    if (!candidate?.content?.parts) {
                        // Log detailed info about why there are no parts
                        const finishReason = candidate?.finishReason || "unknown";
                        const safetyRatings = candidate?.safetyRatings
                            ?.map((r: { category?: string; probability?: string }) => `${r.category}:${r.probability}`)
                            .join(", ") || "none";
                        const blockReason = (response as unknown as Record<string, unknown>).promptFeedback
                            ? JSON.stringify((response as unknown as Record<string, unknown>).promptFeedback)
                            : "none";

                        console.warn(`[Gemini] Empty response — finishReason: ${finishReason}, safety: [${safetyRatings}], blockReason: ${blockReason}`);

                        // Treat as retryable — often transient or safety filter flicker
                        throw new Error(`No image generated (finishReason: ${finishReason})`);
                    }

                    for (const part of candidate.content.parts) {
                        if (part.inlineData?.data) {
                            const buffer = Buffer.from(part.inlineData.data, "base64");
                            const hash = bufferHash(buffer);

                            // Upload to Supabase Storage
                            const publicUrl = await uploadFile(outputStoragePath, buffer, "image/png");

                            return { success: true, publicUrl, hash };
                        }
                    }

                    throw new Error("Response parts present but no image data found");
                } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : String(err);
                    const isRateLimit = msg.includes("429") ||
                        msg.toLowerCase().includes("rate") ||
                        msg.toLowerCase().includes("quota") ||
                        msg.toLowerCase().includes("resource_exhausted") ||
                        msg.toLowerCase().includes("too many requests");

                    const isEmptyResponse = msg.toLowerCase().includes("no image generated") ||
                        msg.toLowerCase().includes("no image data found");

                    const isRetryable = isRateLimit || isEmptyResponse;

                    if (isRetryable && rateLimitAttempt < RATE_LIMIT_RETRIES) {
                        const backoff = Math.min(
                            RATE_LIMIT_BASE_MS * Math.pow(2, rateLimitAttempt),
                            RATE_LIMIT_MAX_MS
                        );
                        console.warn(`[Gemini] Rate limited (attempt ${rateLimitAttempt + 1}/${RATE_LIMIT_RETRIES}), backing off ${backoff}ms`);
                        await new Promise((r) => setTimeout(r, backoff));
                        continue; // retry same key
                    }

                    console.warn(`[Gemini] Key ending in *${apiKey.slice(-4)} failed:`, msg);
                    lastError = err;
                    break; // move to next key
                }
            }
        }

        throw new Error(lastError instanceof Error ? lastError.message : "All Gemini API keys failed");
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`[Gemini] Error:`, msg);
        return { success: false, error: msg };
    }
}

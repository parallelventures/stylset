import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function run() {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await genai.models.generateImages({
            model: "imagen-3.0-generate-001",
            prompt: "A simple photo of a red apple on a desk",
            config: {
                outputMimeType: "image/png",
                addWatermark: false,
                // @ts-ignore
                responseModalities: ["image"]
            }
        });

        const b64 = response.generatedImages?.[0]?.image?.imageBytes;
        if (b64) {
            fs.writeFileSync("test_image.png", Buffer.from(b64, "base64"));
            console.log("Success with addWatermark = false using generateImages()");
        }
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();

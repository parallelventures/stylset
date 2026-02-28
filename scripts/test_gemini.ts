import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config();

async function run() {
    const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    try {
        const response = await genai.models.generateContent({
            model: "gemini-3-pro-image-preview",
            contents: [{ role: "user", parts: [{ text: "a simple green circle" }] }],
            config: {
                // @ts-ignore
                outputMimeType: "image/png",
                // @ts-ignore
                addWatermark: false
            }
        });

        console.log("Response parts:", JSON.stringify(response.candidates?.[0]?.content?.parts, null, 2));

        const part = response.candidates?.[0]?.content?.parts?.[0];
        if (part?.inlineData?.data) {
            const buffer = Buffer.from(part.inlineData.data, "base64");
            fs.writeFileSync("test_image_no_watermark.png", buffer);
            console.log("Saved image output!");
        } else {
            console.log("No image returned by the model in this request!");
        }

    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

run();

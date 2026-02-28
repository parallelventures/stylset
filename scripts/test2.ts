import { GoogleGenAI } from "@google/genai";
import * as dotenv from "dotenv";

dotenv.config();

console.log(process.env.GEMINI_API_KEY ? "Key loaded" : "No key");

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
genai.models.generateContent({
    model: "gemini-3-pro-image-preview",
    contents: [{ role: "user", parts: [{ text: "a simple green circle" }] }],
    config: {
        responseModalities: ["IMAGE"],
        // @ts-ignore
        addWatermark: false
    }
}).then(r => {
    console.log("Request succeeded");
}).catch(e => console.error("Error", e));

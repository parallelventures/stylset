import * as dotenv from "dotenv";

dotenv.config();

async function run() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${process.env.GEMINI_API_KEY}`;
    try {
        const res = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "a simple green circle" }] }],
                generationConfig: {
                    responseModalities: ["IMAGE"],
                    // Let's try inside outputOptions
                    outputOptions: { addWatermark: false }
                }
            })
        });
        const json = await res.json();
        if (json.error) {
            console.log("Error inside outputOptions:", json.error.message);
        } else {
            console.log("Success inside outputOptions!");
            return;
        }

        const res2 = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: "a simple green circle" }] }],
                generationConfig: {
                    responseModalities: ["IMAGE"],
                    addWatermark: false
                }
            })
        });
        const json2 = await res2.json();
        if (json2.error) {
            console.log("Error directly in generationConfig:", json2.error.message);
        } else {
            console.log("Success directly in generationConfig!");
        }
    } catch (e: any) {
        console.error("Fetch Exception:", e);
    }
}

run();

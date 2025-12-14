
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const apiKey = process.env.GEMINI_API_KEY;

async function main() {
    console.log("🔍 Auto-detecting best available Gemini model...");

    if (!apiKey) {
        console.error("❌ Error: GEMINI_API_KEY is missing in .env.local");
        process.exit(1);
    }

    let selectedModelName = "";

    try {
        // 1. List Models
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) {
            throw new Error(`Failed to list models: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const models = (data.models || []) as any[];

        // 2. Filter for generateContent support
        const chatModels = models.filter(m =>
            m.supportedGenerationMethods &&
            m.supportedGenerationMethods.includes("generateContent")
        );

        console.log(`📋 Found ${chatModels.length} text-generation models.`);
        chatModels.forEach(m => console.log(`   - ${m.name} (${m.displayName})`));

        // 3. Select 'lightest' (Flash > 1.5 > Pro)
        const preferredOrder = [
            "gemini-1.5-flash",
            "gemini-1.5-flash-001",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro",
            "gemini-pro"
        ];

        // Try to find a match in our preferred order
        for (const pref of preferredOrder) {
            const match = chatModels.find(m => m.name === `models/${pref}` || m.name === pref);
            if (match) {
                selectedModelName = match.name.replace("models/", ""); // SDK expects just the name usually, or models/name is fine too
                break;
            }
        }

        // Fallback: just pick the first one if no preference match
        if (!selectedModelName && chatModels.length > 0) {
            selectedModelName = chatModels[0].name.replace("models/", "");
        }

        if (!selectedModelName) {
            throw new Error("No suitable models found.");
        }

        console.log(`\n✨ Selected Model: ${selectedModelName}`);

        // 4. Test It
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: selectedModelName });

        console.log("🧪 Testing generation...");
        const result = await model.generateContent("Say 'Hello Savor!'");
        console.log("✅ Response:", result.response.text());

    } catch (error: any) {
        console.error("❌ Test Failed:", error.message);
        process.exit(1);
    }
}

main();


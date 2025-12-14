"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

const SYSTEM_PROMPT = `
You are a helpful, friendly, and knowledgeable AI Waiter for a food court app called Savor.
Your goal is to help customers choose what to eat from the available menu items.
- Be concise and appetizing in your descriptions.
- Use emojis occasionally 🌮 🥗.
- If you recommend an item, mention its restaurant.
- Do NOT make up items that are not in the context.
- If you don't know the answer, politely say you don't know.
`;

export async function chatWithAI(userMessage: string, menuContext: string) {
    if (!genAI) {
        return {
            success: false,
            reply: "I'm currently offline (API Key missing). Please tell the developer to check the kitchen!"
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            systemInstruction: SYSTEM_PROMPT
        });

        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: `Here is the menu context:\n${menuContext}` }],
                },
                {
                    role: "model",
                    parts: [{ text: "Understood. I have the menu. How can I help you today?" }],
                },
            ],
        });

        const result = await chat.sendMessage(userMessage);
        const response = result.response;
        return { success: true, reply: response.text() };
    } catch (error: any) {
        console.error("AI Chat Error:", error);
        return {
            success: false,
            reply: "Oops, I dropped my notepad. Can you say that again?"
        };
    }
}

import { GoogleGenAI, Chat, GenerateContentResponse, Part } from "@google/genai";
import type { LocationGuess, ContinueChatResponse } from '../types';

if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const systemInstruction = `You are an expert geolocator.
Your first task is to analyze an image and guess its location. You MUST respond with ONLY a single, valid JSON object in the following format: { "country": "string", "countryCode": "string (ISO 3166-1 alpha-2)", "state": "string", "city": "string", "direction": "string (e.g., 'Northeast', 'Southwestern')", "nearestCity": "string", "reasoning": "string", "confidence": "string ('High', 'Medium', or 'Low')", "accuracyRadiusKm": number }.
- 'direction' should describe which part of the country the location is in.
- 'nearestCity' should be the closest popular or well-known major city.
- 'confidence': Based on the visual evidence, assess your confidence in the guess. It must be one of three values: 'High', 'Medium', or 'Low'.
- 'accuracyRadiusKm': Estimate a radius in kilometers from the guessed city within which the actual location is likely to be. Provide a single number.
- If a field cannot be determined, use 'N/A' for strings and 0 for numbers. For the countryCode, provide the two-letter code.
- Do not add any extra text or markdown formatting around the JSON.
After this initial JSON response, your role changes. You will engage in a helpful, conversational chat with the user.
IMPORTANT: If new clues (from text or images) allow you to make a significantly more accurate guess, you MUST respond ONLY with a new, updated JSON object in the exact same format as your initial guess. This will replace your previous guess. Do not add any conversational text before or after this JSON update.
If the user informs you that your guess was incorrect and provides the correct location, you MUST acknowledge their correction gracefully (e.g., "Thank you for the correction! I'll remember the location is [Corrected Location].") and use this corrected information as context for the rest of the conversation. Do not respond with a new JSON guess in this case.
For all other interactions, such as when the user asks a question or provides a clue not sufficient for a guess update, respond with a normal, friendly, conversational text message.`;

export const startLocationChat = async (base64Image: string): Promise<{ chat: Chat; initialGuess: LocationGuess }> => {
    const chat = ai.chats.create({
        model: 'gemini-2.5-flash-preview-04-17',
        config: {
            systemInstruction,
            temperature: 0.3,
        },
    });

    const imagePart: Part = { inlineData: { mimeType: 'image/jpeg', data: base64Image } };
    const textPart: Part = { text: "Analyze this image and provide the location guess in the specified JSON format." };
    
    try {
        const response = await chat.sendMessage({ message: [textPart, imagePart] });
        if (!response.text) {
            throw new Error("No response text from Gemini API");
        }
        let jsonStr = response.text.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        try {
            const parsedData: LocationGuess = JSON.parse(jsonStr);
            if (
              parsedData &&
              typeof parsedData.country === 'string' &&
              typeof parsedData.countryCode === 'string' &&
              typeof parsedData.confidence === 'string' &&
              typeof parsedData.accuracyRadiusKm === 'number'
            ) {
              return { chat, initialGuess: parsedData };
            }
            throw new Error("Parsed data is not in the expected format.");
        } catch (e) {
            console.error("Failed to parse JSON response:", e);
            console.error("Original string from API:", jsonStr);
            throw new Error("The AI returned an invalid response. Please try again.");
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to get a response from the AI. The service might be busy.");
    }
};

export const continueChat = async (chat: Chat, message: string, newBase64Image: string | null): Promise<ContinueChatResponse> => {
    const parts: Part[] = [];

    if (message.trim()) {
        parts.push({ text: message });
    }

    if (newBase64Image) {
        parts.push({
            inlineData: {
                mimeType: 'image/jpeg',
                data: newBase64Image,
            }
        });
    }

    if(parts.length === 0) {
        // This case should ideally not be hit due to frontend checks, but as a fallback:
        return { responseText: "Please type a message or attach an image.", updatedGuess: null };
    }
    
    try {
        const response = await chat.sendMessage({ message: parts });
        if (!response.text) {
            return { responseText: "No response from Gemini API.", updatedGuess: null };
        }
        const originalResponseText = response.text;
        
        let jsonStr = originalResponseText.trim();
        
        // Always check for markdown fences first
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        // Now, try to parse what we have. It might be a JSON object.
        try {
            // Check if it looks like a JSON object before trying to parse.
            if (jsonStr.startsWith('{') && jsonStr.endsWith('}')) {
                const parsedData: LocationGuess = JSON.parse(jsonStr);
                // Validate the structure to ensure it's a LocationGuess
                if (
                  parsedData &&
                  typeof parsedData.country === 'string' &&
                  typeof parsedData.countryCode === 'string' &&
                  typeof parsedData.confidence === 'string' &&
                  typeof parsedData.accuracyRadiusKm === 'number'
                ) {
                  // It's an updated guess!
                  return { responseText: '', updatedGuess: parsedData };
                }
            }
        } catch (e) {
            // Not a valid JSON or not the right structure, so we treat it as plain text.
            // We will fall through and return the original text.
        }
        
        // If we reach here, it was not a valid LocationGuess JSON, so it's a normal text response
        return { responseText: originalResponseText, updatedGuess: null };

    } catch (error) {
        console.error("Error calling Gemini API in continueChat:", error);
        throw new Error("Failed to get a response from the AI. The service might be busy.");
    }
};
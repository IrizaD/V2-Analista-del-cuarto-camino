import { GoogleGenAI, Chat } from "@google/genai";
import { GURDJIEFF_SYSTEM_PROMPT, MODEL_NAME } from '../constants';

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// We store the chat session in memory for the duration of the app lifecycle
let chatSession: Chat | null = null;

/**
 * Initializes or retrieves the existing chat session.
 */
export const getChatSession = (): Chat => {
  if (!chatSession) {
    chatSession = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: GURDJIEFF_SYSTEM_PROMPT,
        temperature: 0.7, // Balanced for analysis but creative enough for psychological profiling
      },
    });
  }
  return chatSession;
};

/**
 * Sends a message to the Gemini model and returns the text response.
 */
export const sendMessageToGemini = async (message: string): Promise<string> => {
  try {
    const chat = getChatSession();
    const result = await chat.sendMessage({ message });
    return result.text || "No se recibió respuesta del análisis.";
  } catch (error) {
    console.error("Error communicating with Gemini:", error);
    throw new Error("Error de conexión con el Analista.");
  }
};

/**
 * Resets the chat session.
 */
export const resetSession = () => {
  chatSession = null;
};

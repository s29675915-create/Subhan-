import { GoogleGenAI } from "@google/genai";
import { Message, Role, ModelId } from '../types';

// Ensure API Key is available
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API_KEY is not set in environment variables.");
}

const ai = new GoogleGenAI({ apiKey: apiKey || 'dummy-key-for-build' });

const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64Data,
          mimeType: file.type,
        },
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const geminiService = {
  /**
   * Generates a streaming chat response.
   */
  async streamChatResponse(
    history: Message[],
    systemInstruction: string,
    modelId: string,
    files: File[],
    onChunk: (chunk: string) => void
  ) {
    // 1. Prepare history for the API
    // The last message in 'history' is the user's latest input, but it might contain attachments handled by UI.
    // For the API call, we construct the 'contents' array.
    
    // We need to convert our internal Message format to Gemini's format.
    // However, Gemini's ChatSession (sendMessageStream) maintains its own history.
    // For a stateless-like experience or to sync with our local state, 
    // we can either rebuild the history every time (using generateContentStream) or use a ChatSession.
    // Given the requirement for "Model Selection" per chat, using `generateContentStream` with full history context 
    // is often more robust for switching models mid-conversation, though `chat.sendMessageStream` is easier.
    // We will use `chat.sendMessageStream` but we need to hydrate the history first.

    // Filter out the very last message as that is the "new" message we are sending.
    const pastMessages = history.slice(0, -1);
    const lastMessage = history[history.length - 1];

    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction: systemInstruction,
      },
      history: pastMessages.map(msg => ({
        role: msg.role === Role.USER ? 'user' : 'model',
        parts: [{ text: msg.content }], // Note: This simplified history doesn't replay old images to save tokens/bandwidth
      }))
    });

    // Prepare the new message content
    let messageParts: any[] = [];
    
    // Add text
    if (lastMessage.content) {
      messageParts.push({ text: lastMessage.content });
    }

    // Add images if any (from the current upload)
    if (files && files.length > 0) {
      const fileParts = await Promise.all(files.map(fileToPart));
      messageParts = [...messageParts, ...fileParts];
    }

    // If we have just text, send simple string to avoid object complexity if not needed, 
    // but multimodal requires array.
    const messagePayload = messageParts.length === 1 && messageParts[0].text 
      ? messageParts[0].text 
      : messageParts;

    const result = await chat.sendMessageStream({ message: messagePayload });

    for await (const chunk of result) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
  },

  /**
   * Generates an image using the dedicated image model.
   * Returns a base64 data URL.
   */
  async generateImage(prompt: string): Promise<string> {
    try {
      // Using gemini-2.5-flash-image (Nano Banana) or configured image model
      // The instruction says: Call `generateContent` to generate images with nano banana series models
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
           // Provide basic config if needed, usually defaults work for flash-image
        }
      });

      // Iterate to find the image part
      if (response.candidates && response.candidates[0].content && response.candidates[0].content.parts) {
         for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
               return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
         }
      }
      
      throw new Error("No image data returned from API");
    } catch (e) {
      console.error("Image generation error", e);
      throw e;
    }
  }
};
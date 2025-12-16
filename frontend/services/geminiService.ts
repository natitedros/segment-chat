// import { GoogleGenAI, GenerateContentResponse, Part } from "@google/genai";
import { Attachment } from "../types";

// Initialize the client. API Key is injected by the environment.
// const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a base64 string (without the data URL prefix) to a clean string
 * if it includes the prefix, or returns as is.
 */
const cleanBase64 = (base64Data: string): string => {
  if (base64Data.includes(',')) {
    return base64Data.split(',')[1];
  }
  return base64Data;
};

/**
 * Sends a message to Gemini.
 * If an image is provided, it uses the multimodal capabilities (gemini-2.5-flash-image).
 * If no image is provided, it falls back to text-only (gemini-2.5-flash).
 */
export const sendMessageToGemini = async (
  prompt: string,
  attachment?: Attachment
): Promise<{ text: string; imageAttachment?: Attachment }> => {
  // try {
  //   let modelName = 'gemini-2.5-flash';
  //   const parts: Part[] = [];

  //   // If we have an image, we use the vision/image capable model
  //   if (attachment && attachment.base64Data) {
  //     modelName = 'gemini-2.5-flash-image';
      
  //     parts.push({
  //       inlineData: {
  //         mimeType: attachment.mimeType,
  //         data: cleanBase64(attachment.base64Data),
  //       },
  //     });
  //   }

  //   // Add the text prompt
  //   if (prompt) {
  //     parts.push({ text: prompt });
  //   } else if (parts.length === 0) {
  //     throw new Error("No content to send.");
  //   }

  //   // Call the API
  //   const response: GenerateContentResponse = await ai.models.generateContent({
  //     model: modelName,
  //     contents: { parts },
  //   });

  //   // Process Response
  //   let responseText = "";
  //   let responseImage: Attachment | undefined = undefined;

  //   const candidateContent = response.candidates?.[0]?.content;

  //   if (candidateContent && candidateContent.parts) {
  //     for (const part of candidateContent.parts) {
  //       if (part.text) {
  //         responseText += part.text;
  //       }
        
  //       // Check for generated/edited image in the response
  //       if (part.inlineData) {
  //         const mimeType = part.inlineData.mimeType || 'image/png';
  //         const base64Data = part.inlineData.data;
  //         responseImage = {
  //           mimeType,
  //           previewUrl: `data:${mimeType};base64,${base64Data}`,
  //           base64Data,
  //         };
  //       }
  //     }
  //   }

  //   return {
  //     text: responseText,
  //     imageAttachment: responseImage
  //   };

  // } catch (error) {
  //   console.error("Gemini API Error:", error);
  //   throw error;
  // }
  return {text: "Segmenting"}
};

/**
 * Helper to convert File to Base64
 */
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
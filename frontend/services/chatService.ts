import { Attachment } from "../types";

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

export const sendMessage = async (
  prompt: string,
  attachment?: Attachment
): Promise<{ text: string; imageAttachment?: Attachment }> => {
  try {
    
    const formData = new FormData();
    formData.append("prompt", prompt);

    if (attachment) {
      if (attachment.file) {
        formData.append("image", attachment.file);
      } else if (attachment.base64Data) {
        formData.append("imageBase64", attachment.base64Data);
        formData.append("mimeType", attachment.mimeType);
      }
    }

    const response = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const blob = await response.blob();
    
    const file = new File([blob], "hed-result.png", {
      type: blob.type || "image/png",
    });

    const response_image: Attachment = {
      file,
      previewUrl: URL.createObjectURL(blob),
      mimeType: file.type,
    };

    return {
      text: "Here is the segmented image based on your prompt.",
      imageAttachment: response_image,
    };

  } catch (error) {
    console.error("Server Error:", error);
    throw error;
  }
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
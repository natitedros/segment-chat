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
  prompt?: string,
  attachment?: Attachment
): Promise<{ text: string; imageAttachment?: Attachment }> => {
  try {
    
    const formData = new FormData();

    if (!prompt) prompt = "";
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

    const data = await response.json();
    if (data.imageAttachment === undefined) {
      return { text: data.text };
    }
    const response_image: Attachment = {
      file: base64ToFile(
        data.imageAttachment,
        "segmented_image.png",
        data.mime_type
      ),
      base64Data: data.imageAttachment,
      previewUrl: `data:${data.mime_type};base64,${data.imageAttachment}`,
      mimeType: data.mime_type,
    };

    return {
      text: data.text,
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

function base64ToFile(
  base64: string,
  filename: string,
  mimeType: string
): File {
  const byteString = atob(base64);
  const byteArray = new Uint8Array(byteString.length);

  for (let i = 0; i < byteString.length; i++) {
    byteArray[i] = byteString.charCodeAt(i);
  }

  return new File([byteArray], filename, { type: mimeType });
}
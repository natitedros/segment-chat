export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Attachment {
  file?: File;
  previewUrl: string;
  mimeType: string;
  base64Data?: string; // Stored for API sending
}

export interface Message {
  id: string;
  role: Role;
  text?: string;
  attachment?: Attachment; // Image sent by user or returned by model
  timestamp: Date;
  isError?: boolean;
}

export interface ChatState {
  messages: Message[];
  isLoading: boolean;
}
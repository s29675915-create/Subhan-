export enum Role {
  USER = 'user',
  AI = 'model'
}

export enum ModelId {
  GEMINI_FLASH = 'gemini-2.5-flash',
  GEMINI_PRO = 'gemini-3-pro-preview',
  GEMINI_FLASH_IMAGE = 'gemini-2.5-flash-image'
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: string[]; // base64 strings
  timestamp: number;
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  modelId: string;
}

export interface Persona {
  name: string;
  systemPrompt: string;
}

export interface Model {
  id: ModelId;
  name: string;
  description: string;
}

export interface AppSettings {
  defaultModel: string;
  activePersona: Persona;
  savedPersonas: Persona[];
}
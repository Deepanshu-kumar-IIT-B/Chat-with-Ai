
export interface MessageAttachment {
  mimeType: string;
  data: string; // base64
  fileName?: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: Date;
  attachment?: MessageAttachment;
  reactions?: string[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastInteraction: Date;
  aiCharacter?: AICharacter;
}

export type ConversationPurpose = 'Casual Chat' | 'Emotional Support' | 'Study' | 'Motivation' | 'Deep Talk';

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  purpose: ConversationPurpose;
}

export interface AICharacter {
  name: string;
  age: number;
  gender: string;
  traits: string[];
}

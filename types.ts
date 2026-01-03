
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
  status?: 'sending' | 'sent' | 'read';
  replyToId?: string;
  isForwarded?: boolean;
  isEdited?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  lastInteraction: Date;
  aiCharacter: AICharacter;
  isPinned?: boolean;
}

export type ConversationPurpose = 'Casual Chat' | 'Emotional Support' | 'Study' | 'Motivation' | 'Deep Talk';

export interface UserProfile {
  name: string;
  age: string;
  gender: string;
  purpose: ConversationPurpose;
}

export interface AICharacter {
  id: string;
  name: string;
  age: number;
  gender: string;
  traits: string[];
}

export interface AppDataExport {
  sessions: ChatSession[];
  savedPersonas: AICharacter[];
  userProfile: UserProfile | null;
}

export type EffectType = 'weather' | 'energy' | 'magic' | 'festive' | 'cinematic' | 'nature' | 'none';

export interface VisualEffect {
  id: string;
  name: string;
  type: EffectType;
  category: string;
  className: string;
  emoji: string;
}

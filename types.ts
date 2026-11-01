export interface Persona {
  id: string;
  name: string;
  age: number;
  gender: string;
  personality: string;
  avatarId: string;
  tags: string[];
  iconPath?: string;
  photoUrl?: string;
}

export interface UserProfile {
  name: string;
  age: number | string;
  gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  nature: string;
  natureTags?: string[];
  photoUrl?: string;
  purpose?: string;
}

export interface AICharacter {
  name: string;
  age: number | string;
  gender: string;
  traits: string[];
}

export type Message = ChatMessage;
export type MessageAttachment = ChatAttachment;

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'video' | 'audio' | 'document';
  url: string; // Base64 data URL or Object URL
  size?: number;
  mimeType?: string;
  data?: string;
  fileName?: string;
}

export interface VoiceMessageData {
  audioUrl: string;
  duration: number; // in seconds
}

export interface ReplyInfo {
  id: string;
  role: 'user' | 'model';
  senderName: string;
  content: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  userReacted?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: string;
  attachments?: ChatAttachment[];
  attachment?: ChatAttachment;
  voiceMessage?: VoiceMessageData;
  replyTo?: ReplyInfo;
  isEdited?: boolean;
  reactions?: MessageReaction[];
  isStreaming?: boolean;
  failed?: boolean;
  status?: string;
}

export type MoodId = 'happy' | 'calm' | 'excited' | 'tired' | 'stressed' | 'sad' | 'curious';

export interface UserSessionMood {
  id: MoodId;
  label: string;
  emoji: string;
  subtitle: string;
  toneGuide: string;
  colorClass: string;
  activeBgClass: string;
  badgeBorderClass: string;
}

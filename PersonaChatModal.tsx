import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  MoreVertical, 
  Plus,
  X,
  Paperclip,
  Smile,
  Mic,
  Trash2,
  Check,
  Play,
  Pause,
  AlertCircle,
  FileText,
  Film,
  Music,
  File as FileIcon,
  CornerUpLeft,
  Edit3,
  Copy,
  RotateCcw,
  Download,
  Globe,
  Search,
  ShieldCheck,
  BookOpen
} from 'lucide-react';
import { Persona, ChatAttachment, VoiceMessageData, ChatMessage, ReplyInfo, UserSessionMood } from './types';
import { getAvatarConfig, renderAvatarIcon } from './avatarHelpers';
import { getPersonalityVibe } from './vibeHelpers';
import { getMoodById, getMoodAdaptiveGreeting } from './moodHelpers';
import { useUserProfile } from './UserProfileContext';
import { usePersonas } from './PersonaContext';
import { UserProfileMenu } from './UserProfileMenu';
import { ThemeToggle } from './ThemeContext';
import { PersonaProfileDetailsModal } from './PersonaProfileDetailsModal';
import { PersonaModal } from './PersonaModal';
import { EmojiPickerPopup } from './EmojiPickerPopup';
import { VoiceMessageBubble } from './VoiceMessageBubble';
import { ChatAttachmentPreview, formatFileSize } from './ChatAttachmentPreview';
import { ChatMessageContextMenu } from './ChatMessageContextMenu';
import { MessageReactionBar } from './MessageReactionBar';
import { encryptForStorage, decryptFromStorage } from './clientCrypto';
import { apiClient } from './apiClient';

type Message = ChatMessage;

const getSvgFallbackImage = (label?: string) => {
  const safeLabel = (label || 'AI Art').replace(/[<>&"]/g, '');
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
      <defs>
        <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#4f46e5"/>
          <stop offset="50%" stop-color="#7c3aed"/>
          <stop offset="100%" stop-color="#db2777"/>
        </linearGradient>
      </defs>
      <rect width="600" height="600" fill="url(#g)"/>
      <circle cx="300" cy="240" r="80" fill="white" opacity="0.15"/>
      <polygon points="300,180 340,260 260,260" fill="white" opacity="0.25"/>
      <text x="50%" y="380" font-family="system-ui, sans-serif" font-size="22" font-weight="bold" fill="white" text-anchor="middle" opacity="0.95">${safeLabel}</text>
      <text x="50%" y="420" font-family="system-ui, sans-serif" font-size="14" fill="white" text-anchor="middle" opacity="0.75">AI Generated Art</text>
    </svg>`
  )}`;
};

interface PersonaChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  persona: Persona | null;
  onSelectPersona?: (persona: Persona) => void;
  onOpenCreatePersona?: () => void;
  onOpenTermsPolicy?: (tab?: 'terms' | 'privacy-e2ee' | 'ai-responsibility' | 'liability') => void;
  onOpenHowItWorks?: () => void;
}

export const PersonaChatModal: React.FC<PersonaChatModalProps> = ({
  isOpen,
  onClose,
  persona: initialPersona,
  onSelectPersona,
  onOpenCreatePersona,
  onOpenTermsPolicy,
  onOpenHowItWorks
}) => {
  const { userProfile } = useUserProfile();
  const { personas } = usePersonas();

  // Current active persona in chat
  const [activePersona, setActivePersona] = useState<Persona | null>(initialPersona);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [activeRequestsCount, setActiveRequestsCount] = useState(0);
  const isLoading = activeRequestsCount > 0;

  // Sidebar toggle state (closed by default on mobile, open by default on desktop)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileDetailsOpen, setIsProfileDetailsOpen] = useState(false);
  const [editingPersona, setEditingPersona] = useState<Persona | null>(null);
  const [, setChatTick] = useState(0);

  // Session Mood State (influences persona's initial conversational tone)
  const [currentMood, setCurrentMood] = useState<UserSessionMood | null>(null);
  const [isMoodCheckinDismissed, setIsMoodCheckinDismissed] = useState(false);

  // Staggered fade-in animation tracking for historical chat messages
  const [historicalMessageIds, setHistoricalMessageIds] = useState<Set<string>>(new Set());
  const [conversationMountId, setConversationMountId] = useState(0);

  // Telegram-style Input & Attachments & Voice Message states
  const [stagedAttachments, setStagedAttachments] = useState<ChatAttachment[]>([]);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [recordingState, setRecordingState] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordedAudioDuration, setRecordedAudioDuration] = useState(0);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Telegram-style Message Context Menu, Reply, Edit, Delete, Copy states
  const [contextMenuState, setContextMenuState] = useState<{
    isOpen: boolean;
    position: { x: number; y: number } | null;
    message: Message | null;
  }>({
    isOpen: false,
    position: null,
    message: null
  });

  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [toastText, setToastText] = useState<string | null>(null);
  const [activeQuickPickerId, setActiveQuickPickerId] = useState<string | null>(null);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Language mode state (Auto, Hindi, Hinglish, English)
  const [preferredLanguage, setPreferredLanguage] = useState<'auto' | 'hi' | 'hinglish' | 'en'>(() => {
    try {
      return (localStorage.getItem('aura_preferred_lang') as any) || 'auto';
    } catch {
      return 'auto';
    }
  });
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement>(null);

  // Search and message filter state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter messages based on search query
  const trimmedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredMessages = useMemo(() => {
    if (!trimmedSearchQuery) return messages;
    return messages.filter((m) => {
      // 1. Match message content
      if (m.content && m.content.toLowerCase().includes(trimmedSearchQuery)) {
        return true;
      }
      // 2. Match sender name
      const sender = m.role === 'user' ? (userProfile?.name || 'You') : activePersona?.name;
      if (sender && sender.toLowerCase().includes(trimmedSearchQuery)) {
        return true;
      }
      // 3. Match attachments name
      if (m.attachments && m.attachments.some((a) => a.name.toLowerCase().includes(trimmedSearchQuery))) {
        return true;
      }
      // 4. Match replyTo content
      if (m.replyTo && m.replyTo.content.toLowerCase().includes(trimmedSearchQuery)) {
        return true;
      }
      return false;
    });
  }, [messages, trimmedSearchQuery, userProfile, activePersona]);

  // Helper to highlight matching text in message bubbles
  const renderHighlightedText = (text: string, query: string) => {
    if (!query || !text) return text;
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark
          key={i}
          className="bg-amber-300 dark:bg-amber-400 text-neutral-950 font-bold px-1 py-0.5 rounded shadow-2xs"
        >
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Keyboard shortcut (Ctrl+F / Cmd+F) to toggle and focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsSearchOpen(true);
        setTimeout(() => {
          searchInputRef.current?.focus();
          searchInputRef.current?.select();
        }, 60);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const toastTimerRef = useRef<number | null>(null);
  const longPressTimerRef = useRef<number | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const didLongPressRef = useRef(false);

  const showToast = (text: string) => {
    setToastText(text);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = window.setTimeout(() => {
      setToastText(null);
    }, 2000);
  };

  // Close export and language menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    if (isExportMenuOpen || isLangMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isExportMenuOpen, isLangMenuOpen]);

  // Export current conversation history as TXT, JSON, or HTML
  const handleExportChat = (format: 'txt' | 'json' | 'html') => {
    if (!activePersona || messages.length === 0) {
      showToast('No messages to export');
      return;
    }

    const dateStr = new Date().toISOString().split('T')[0];
    const safePersonaName = activePersona.name.toLowerCase().replace(/[^a-z0-9]/gi, '_');

    if (format === 'json') {
      const exportData = {
        persona: {
          id: activePersona.id,
          name: activePersona.name,
          age: activePersona.age,
          gender: activePersona.gender,
          personality: activePersona.personality,
          tags: activePersona.tags
        },
        user: userProfile ? {
          name: userProfile.name,
          gender: userProfile.gender
        } : undefined,
        exportedAt: new Date().toISOString(),
        messagesCount: messages.length,
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          sender: m.role === 'user' ? (userProfile?.name || 'User') : activePersona.name,
          content: m.content,
          timestamp: m.timestamp,
          replyTo: m.replyTo ? {
            senderName: m.replyTo.senderName,
            content: m.replyTo.content
          } : undefined,
          reactions: m.reactions,
          attachments: m.attachments?.map((a) => ({
            name: a.name,
            type: a.type,
            size: a.size
          })),
          voiceMessage: m.voiceMessage ? {
            duration: m.voiceMessage.duration
          } : undefined
        }))
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${safePersonaName}_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Chat exported as JSON');
    } else if (format === 'html') {
      const escapeHtml = (str: string) =>
        (str || '')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');

      const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat with ${escapeHtml(activePersona.name)} - Aura Transcript</title>
  <style>
    :root {
      --bg: #0b0f19;
      --card-bg: #111827;
      --text: #f9fafb;
      --text-muted: #9ca3af;
      --accent: #ec4899;
      --user-bubble: #4f46e5;
      --model-bubble: #1f2937;
      --border: #374151;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      margin: 0;
      padding: 24px 16px;
      line-height: 1.5;
    }
    .container {
      max-width: 760px;
      margin: 0 auto;
      background: var(--card-bg);
      border-radius: 24px;
      border: 1px solid var(--border);
      padding: 28px;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .header {
      border-bottom: 1px solid var(--border);
      padding-bottom: 20px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .avatar {
      width: 52px;
      height: 52px;
      border-radius: 18px;
      overflow: hidden;
      background: var(--accent);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      font-weight: bold;
      color: white;
      flex-shrink: 0;
    }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .info h1 {
      margin: 0 0 4px 0;
      font-size: 20px;
      color: var(--text);
    }
    .info p {
      margin: 0;
      color: var(--text-muted);
      font-size: 13px;
    }
    .meta-badge {
      display: inline-block;
      margin-top: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      background: rgba(236, 72, 153, 0.15);
      color: var(--accent);
      font-size: 11px;
      font-weight: 600;
    }
    .chat-flow {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .msg-row {
      display: flex;
      flex-direction: column;
      max-width: 82%;
    }
    .msg-row.user {
      align-self: flex-end;
      align-items: flex-end;
    }
    .msg-row.model {
      align-self: flex-start;
      align-items: flex-start;
    }
    .sender-name {
      font-size: 11px;
      font-weight: 700;
      color: var(--text-muted);
      margin-bottom: 4px;
      padding: 0 6px;
    }
    .bubble {
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      word-break: break-word;
      white-space: pre-wrap;
    }
    .msg-row.user .bubble {
      background: var(--user-bubble);
      color: #ffffff;
      border-bottom-right-radius: 4px;
    }
    .msg-row.model .bubble {
      background: var(--model-bubble);
      color: #f3f4f6;
      border-bottom-left-radius: 4px;
      border: 1px solid var(--border);
    }
    .reply-preview {
      font-size: 11px;
      padding: 4px 8px;
      border-left: 3px solid rgba(255, 255, 255, 0.4);
      background: rgba(0, 0, 0, 0.2);
      margin-bottom: 6px;
      border-radius: 4px;
    }
    .attachment-box {
      margin-top: 8px;
      font-size: 12px;
      padding: 6px 10px;
      background: rgba(0, 0, 0, 0.25);
      border-radius: 8px;
      display: inline-block;
    }
    .reactions-box {
      margin-top: 4px;
      font-size: 12px;
    }
    .msg-time {
      font-size: 10px;
      color: var(--text-muted);
      margin-top: 4px;
      padding: 0 4px;
    }
    .footer {
      border-top: 1px solid var(--border);
      margin-top: 32px;
      padding-top: 16px;
      text-align: center;
      font-size: 12px;
      color: var(--text-muted);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="avatar">
        ${activePersona.iconPath ? `<img src="${escapeHtml(activePersona.iconPath)}" alt="${escapeHtml(activePersona.name)}" />` : escapeHtml(activePersona.name.charAt(0))}
      </div>
      <div class="info">
        <h1>${escapeHtml(activePersona.name)}</h1>
        <p>${escapeHtml(activePersona.personality)}</p>
        <div class="meta-badge">${activePersona.age} yrs • ${escapeHtml(activePersona.gender)} • ${messages.length} messages</div>
      </div>
    </div>
    <div class="chat-flow">
      ${messages.map((m) => {
        const isUser = m.role === 'user';
        const sender = isUser ? (userProfile?.name || 'You') : activePersona.name;
        const replyHtml = m.replyTo ? `<div class="reply-preview">Replying to ${escapeHtml(m.replyTo.senderName)}: "${escapeHtml(m.replyTo.content.slice(0, 50))}"</div>` : '';
        const attHtml = m.attachments && m.attachments.length > 0 ? `<div class="attachment-box">📎 ${m.attachments.map(a => escapeHtml(a.name)).join(', ')}</div>` : '';
        const voiceHtml = m.voiceMessage ? `<div class="attachment-box">🎙️ Voice message (${m.voiceMessage.duration}s)</div>` : '';
        const reactionsHtml = m.reactions && m.reactions.length > 0 ? `<div class="reactions-box">${m.reactions.map(r => `${r.emoji} ${r.count}`).join(' ')}</div>` : '';
        return `
          <div class="msg-row ${isUser ? 'user' : 'model'}">
            <span class="sender-name">${escapeHtml(sender)}</span>
            <div class="bubble">
              ${replyHtml}
              ${escapeHtml(m.content)}
              ${attHtml}
              ${voiceHtml}
            </div>
            ${reactionsHtml}
            <span class="msg-time">${escapeHtml(m.timestamp || '')}</span>
          </div>
        `;
      }).join('')}
    </div>
    <div class="footer">
      Exported from Aura on ${new Date().toLocaleString()} • Zero-Plaintext Encrypted Chat
    </div>
  </div>
</body>
</html>`;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${safePersonaName}_${dateStr}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Chat exported as HTML');
    } else {
      // Format as clean text transcript
      const lines: string[] = [];
      lines.push(`=================================================`);
      lines.push(`CONVERSATION WITH ${activePersona.name.toUpperCase()}`);
      lines.push(`Persona: ${activePersona.name} (${activePersona.age}, ${activePersona.gender})`);
      lines.push(`Personality: ${activePersona.personality}`);
      lines.push(`Exported on: ${new Date().toLocaleString()}`);
      lines.push(`Total messages: ${messages.length}`);
      lines.push(`=================================================\n`);

      for (const m of messages) {
        const sender = m.role === 'user' ? (userProfile?.name || 'You') : activePersona.name;
        const time = m.timestamp ? `[${m.timestamp}] ` : '';

        let replyPrefix = '';
        if (m.replyTo) {
          replyPrefix = `(Replying to ${m.replyTo.senderName}: "${m.replyTo.content.slice(0, 40)}...")\n`;
        }

        let attachmentInfo = '';
        if (m.attachments && m.attachments.length > 0) {
          const attNames = m.attachments.map((a) => `[Attachment (${a.type}): ${a.name}]`).join(', ');
          attachmentInfo = `\n${attNames}`;
        }

        if (m.voiceMessage) {
          attachmentInfo += `\n[Voice Message: ${m.voiceMessage.duration}s]`;
        }

        let reactionInfo = '';
        if (m.reactions && m.reactions.length > 0) {
          reactionInfo = ` (Reactions: ${m.reactions.map((r) => `${r.emoji} ${r.count}`).join(' ')})`;
        }

        lines.push(`${time}${sender}:${reactionInfo}\n${replyPrefix}${m.content}${attachmentInfo}\n`);
      }

      const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `chat_${safePersonaName}_${dateStr}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Chat exported as TXT');
    }
  };

  const closeContextMenu = () => {
    setContextMenuState({ isOpen: false, position: null, message: null });
  };

  // Right-click context menu (Desktop)
  const handleContextMenu = (msg: Message, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuState({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      message: msg
    });
  };

  // Touch Long-press (Mobile)
  const handleTouchStart = (msg: Message, e: React.TouchEvent) => {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
    didLongPressRef.current = false;

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
    }

    longPressTimerRef.current = window.setTimeout(() => {
      didLongPressRef.current = true;
      try {
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate(40);
        }
      } catch (_) {}
      setContextMenuState({
        isOpen: true,
        position: { x: touchStartPosRef.current.x, y: touchStartPosRef.current.y },
        message: msg
      });
    }, 480);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!longPressTimerRef.current) return;
    if (e.touches.length !== 1) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      return;
    }
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (didLongPressRef.current) {
      setTimeout(() => {
        didLongPressRef.current = false;
      }, 150);
    }
  };

  // Context Menu Actions
  const handleReplyAction = (msg: Message) => {
    setEditingMessage(null);
    setReplyingToMessage(msg);
    focusInput();
  };

  const handleEditAction = (msg: Message) => {
    if (msg.role !== 'user') return;
    setReplyingToMessage(null);
    setEditingMessage(msg);
    setInputText(msg.content);
    focusInput();
  };

  const handleDeleteAction = (msg: Message) => {
    setMessageToDelete(msg);
  };

  const handleCopyAction = async (msg: Message) => {
    const textToCopy = msg.content || (msg.voiceMessage ? '🎙️ Voice message' : msg.attachments?.[0]?.name || '');
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast('Copied');
    } catch {
      showToast('Copied');
    }
  };

  const confirmDeleteMessage = () => {
    if (!messageToDelete) return;
    const targetId = messageToDelete.id;
    const filtered = messagesRef.current.filter((m) => m.id !== targetId);
    messagesRef.current = filtered;
    setMessages(filtered);

    if (replyingToMessage?.id === targetId) {
      setReplyingToMessage(null);
    }
    if (editingMessage?.id === targetId) {
      setEditingMessage(null);
      setInputText('');
    }
    setMessageToDelete(null);
    showToast('Message deleted');
    focusInput();
  };

  const scrollToMessage = (id: string) => {
    const el = document.getElementById(`msg-${id}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[var(--accent)]', 'rounded-2xl', 'transition-all');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[var(--accent)]', 'rounded-2xl');
      }, 1500);
    }
  };

  // Quick Emoji Reaction handler
  const handleToggleReaction = (messageId: string, emoji: string) => {
    const updated = messagesRef.current.map((m) => {
      if (m.id !== messageId) return m;

      const currentReactions = m.reactions ? [...m.reactions] : [];
      const existingIdx = currentReactions.findIndex((r) => r.emoji === emoji);

      if (existingIdx >= 0) {
        const existing = currentReactions[existingIdx];
        if (existing.userReacted) {
          // User removes reaction
          const newCount = existing.count - 1;
          if (newCount <= 0) {
            currentReactions.splice(existingIdx, 1);
          } else {
            currentReactions[existingIdx] = {
              ...existing,
              count: newCount,
              userReacted: false
            };
          }
        } else {
          // User adds reaction
          currentReactions[existingIdx] = {
            ...existing,
            count: existing.count + 1,
            userReacted: true
          };
        }
      } else {
        // First reaction for this emoji on this message
        currentReactions.push({
          emoji,
          count: 1,
          userReacted: true
        });
      }

      return {
        ...m,
        reactions: currentReactions
      };
    });

    messagesRef.current = updated;
    setMessages(updated);
    if (activePersona) {
      encryptForStorage(updated).then((enc) => {
        sessionStorage.setItem(`aura_chat_sec_${activePersona.id}`, enc);
        sessionStorage.removeItem(`aura_chat_${activePersona.id}`);
      });
      apiClient.saveConversation(activePersona.id, updated).catch(() => {});
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);
  const currentPersonaIdRef = useRef<string | null>(initialPersona?.id || null);
  const messagesRef = useRef<Message[]>(messages);
  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollThrottleRef = useRef<number | null>(null);

  // Dedicated Chat Box Scrolling & Side Scrollbar Tracker
  const chatContainerRef = useRef<HTMLElement | null>(null);
  const scrollbarTrackRef = useRef<HTMLDivElement>(null);
  const isInteractingScrollbarRef = useRef(false);
  const [scrollMetrics, setScrollMetrics] = useState({
    canScroll: false,
    ratio: 1, // 0 to 1
    thumbHeightPercent: 20
  });
  const [isDraggingThumb, setIsDraggingThumb] = useState(false);

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Measure and update scroll position for the custom side scrollbar
  const updateScrollMetrics = useCallback(() => {
    const el = chatContainerRef.current;
    if (!el) return;
    const maxScroll = el.scrollHeight - el.clientHeight;
    const canScroll = maxScroll > 12;

    if (canScroll) {
      const ratio = Math.max(0, Math.min(1, el.scrollTop / maxScroll));
      // Calculate thumb height proportion (between 12% and 35% of track height)
      const heightRatio = Math.max(0.12, Math.min(0.35, el.clientHeight / el.scrollHeight));
      setScrollMetrics({
        canScroll: true,
        ratio,
        thumbHeightPercent: heightRatio * 100
      });
    } else {
      setScrollMetrics({
        canScroll: false,
        ratio: 1,
        thumbHeightPercent: 100
      });
    }
  }, []);

  // Sync scrollbar metrics when messages or filtered results change
  useEffect(() => {
    updateScrollMetrics();
    const timer = setTimeout(updateScrollMetrics, 100);
    return () => clearTimeout(timer);
  }, [messages, filteredMessages, updateScrollMetrics, isLoading]);

  // Sync scrollbar metrics on viewport / container resize
  useEffect(() => {
    const el = chatContainerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      updateScrollMetrics();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateScrollMetrics]);

  // Jump or drag to specific scroll position
  const handleTrackClickOrDrag = useCallback((clientY: number) => {
    const track = scrollbarTrackRef.current;
    const container = chatContainerRef.current;
    if (!track || !container) return;
    const rect = track.getBoundingClientRect();
    const clickY = clientY - rect.top;
    const ratio = Math.max(0, Math.min(1, clickY / rect.height));
    const maxScroll = container.scrollHeight - container.clientHeight;
    container.scrollTop = ratio * maxScroll;
    updateScrollMetrics();
  }, [updateScrollMetrics]);

  const handleScrollbarTouchStart = (e: React.TouchEvent) => {
    e.stopPropagation();
    isInteractingScrollbarRef.current = true;
    setIsDraggingThumb(true);
    handleTrackClickOrDrag(e.touches[0].clientY);
  };

  const handleScrollbarTouchMove = (e: React.TouchEvent) => {
    e.stopPropagation();
    if (isInteractingScrollbarRef.current) {
      handleTrackClickOrDrag(e.touches[0].clientY);
    }
  };

  const handleScrollbarTouchEnd = (e: React.TouchEvent) => {
    e.stopPropagation();
    isInteractingScrollbarRef.current = false;
    setIsDraggingThumb(false);
  };

  const handleScrollbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingThumb(true);
    handleTrackClickOrDrag(e.clientY);

    const handleMouseMove = (moveEvt: MouseEvent) => {
      moveEvt.preventDefault();
      handleTrackClickOrDrag(moveEvt.clientY);
    };
    const handleMouseUp = () => {
      setIsDraggingThumb(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Smooth, high-performance streaming auto-scroll (avoids CPU thrashing and queuing)
  const smoothScrollStream = () => {
    if (scrollThrottleRef.current) return;
    scrollThrottleRef.current = requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
      updateScrollMetrics();
      scrollThrottleRef.current = null;
    });
  };

  // Stable helper to immediately ensure the message input is focused without disruptive scrolling
  const focusInput = () => {
    if (inputRef.current) {
      inputRef.current.focus({ preventScroll: true });
    }
  };

  // Clean up audio recording and abort any in-flight request on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (scrollThrottleRef.current) {
        cancelAnimationFrame(scrollThrottleRef.current);
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
        mediaRecorderRef.current.stop();
      }
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Sync active persona when initialPersona prop changes or updated in personas context
  useEffect(() => {
    if (initialPersona) {
      setActivePersona(initialPersona);
      currentPersonaIdRef.current = initialPersona.id;
    }
  }, [initialPersona?.id]);

  useEffect(() => {
    if (activePersona) {
      const updated = personas.find((p) => p.id === activePersona.id);
      if (updated && updated !== activePersona) {
        setActivePersona(updated);
      }
    }
  }, [personas, activePersona?.id]);

  // Set default sidebar open state based on screen width
  useEffect(() => {
    if (isOpen) {
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    }
  }, [isOpen]);

  // Handle mobile virtual keyboard appearance and dynamic viewport resizing
  useEffect(() => {
    if (!isOpen) return;
    const handleViewportChange = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
    };
    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
    }
    return () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
      }
    };
  }, [isOpen]);

  // Prevent background window from scrolling when full-screen chat is open
  useEffect(() => {
    if (!isOpen) return;

    const originalBodyOverflow = document.body.style.overflow;
    const originalBodyPosition = document.body.style.position;
    const originalBodyWidth = document.body.style.width;
    const originalBodyHeight = document.body.style.height;
    const originalBodyOverscroll = document.body.style.overscrollBehavior;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlOverscroll = document.documentElement.style.overscrollBehavior;

    // Strict lock on body and document root to completely remove background window scrolling
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.overscrollBehavior = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow = originalBodyOverflow;
      document.body.style.position = originalBodyPosition;
      document.body.style.width = originalBodyWidth;
      document.body.style.height = originalBodyHeight;
      document.body.style.overscrollBehavior = originalBodyOverscroll;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.overscrollBehavior = originalHtmlOverscroll;
    };
  }, [isOpen]);

  const createWelcomeMessage = (p: Persona): Message[] => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const welcomeText = userProfile?.name
      ? `Hey ${userProfile.name}! I'm ${p.name} 😊 How's your day going?`
      : `Hey! I'm ${p.name} 😊 How's your day going?`;

    return [
      {
        id: `msg-welcome-${p.id}`,
        role: 'model',
        content: welcomeText,
        timestamp: timeStr
      }
    ];
  };

  const initWelcomeMessage = (p: Persona) => {
    const initialMessages = createWelcomeMessage(p);
    setMessages(initialMessages);
    messagesRef.current = initialMessages;
    setHistoricalMessageIds(new Set(initialMessages.map((m) => m.id)));
    setConversationMountId((prev) => prev + 1);
    encryptForStorage(initialMessages).then((enc) => {
      sessionStorage.setItem(`aura_chat_sec_${p.id}`, enc);
      sessionStorage.removeItem(`aura_chat_${p.id}`);
    });
    apiClient.saveConversation(p.id, initialMessages).catch(() => {});
    setChatTick((t) => t + 1);
  };

  const restoreConversationForPersona = async (p: Persona) => {
    currentPersonaIdRef.current = p.id;
    let found = false;

    // 1. Check encrypted client storage
    try {
      const storedSecKey = `aura_chat_sec_${p.id}`;
      const savedSec = sessionStorage.getItem(storedSecKey);
      if (savedSec) {
        const decrypted = await decryptFromStorage<Message[]>(savedSec);
        if (decrypted && Array.isArray(decrypted) && decrypted.length > 0) {
          if (currentPersonaIdRef.current === p.id) {
            setMessages(decrypted);
            messagesRef.current = decrypted;
            setHistoricalMessageIds(new Set(decrypted.map((m: Message) => m.id)));
            setConversationMountId((prev) => prev + 1);
            found = true;
          }
        }
      } else {
        const legacySaved = sessionStorage.getItem(`aura_chat_${p.id}`);
        if (legacySaved) {
          try {
            const parsed = JSON.parse(legacySaved);
            if (Array.isArray(parsed) && parsed.length > 0) {
              if (currentPersonaIdRef.current === p.id) {
                setMessages(parsed);
                messagesRef.current = parsed;
                setHistoricalMessageIds(new Set(parsed.map((m: Message) => m.id)));
                setConversationMountId((prev) => prev + 1);
                found = true;
              }
              const enc = await encryptForStorage(parsed);
              sessionStorage.setItem(`aura_chat_sec_${p.id}`, enc);
              sessionStorage.removeItem(`aura_chat_${p.id}`);
            }
          } catch (_) {}
        }
      }
    } catch (_) {}

    // 2. Fetch authenticated and decrypted from server vault
    try {
      const remote = await apiClient.getConversation(p.id);
      if (remote && Array.isArray(remote) && remote.length > 0) {
        if (currentPersonaIdRef.current === p.id) {
          setMessages(remote);
          messagesRef.current = remote;
          setHistoricalMessageIds(new Set(remote.map((m: Message) => m.id)));
          setConversationMountId((prev) => prev + 1);
          const enc = await encryptForStorage(remote);
          sessionStorage.setItem(`aura_chat_sec_${p.id}`, enc);
          sessionStorage.removeItem(`aura_chat_${p.id}`);
          found = true;
        }
      }
    } catch (_) {}

    if (!found && currentPersonaIdRef.current === p.id) {
      initWelcomeMessage(p);
    }
  };

  // Initialize or restore chat when active persona changes or screen opens
  useEffect(() => {
    if (isOpen && activePersona) {
      restoreConversationForPersona(activePersona);
      focusInput();
      requestAnimationFrame(focusInput);
    }
  }, [isOpen, activePersona?.id]);

  // Persist conversation to encrypted storage & server vault
  useEffect(() => {
    if (activePersona && messages.length > 0 && currentPersonaIdRef.current === activePersona.id) {
      encryptForStorage(messages).then((enc) => {
        sessionStorage.setItem(`aura_chat_sec_${activePersona.id}`, enc);
        sessionStorage.removeItem(`aura_chat_${activePersona.id}`);
      });
      apiClient.saveConversation(activePersona.id, messages).catch(() => {});
      setChatTick((t) => t + 1);
    }
  }, [messages, activePersona?.id]);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Start a fresh new chat session with the currently active persona
  const handleNewChat = () => {
    if (!activePersona) return;
    sessionStorage.removeItem(`aura_chat_sec_${activePersona.id}`);
    sessionStorage.removeItem(`aura_chat_${activePersona.id}`);
    sessionStorage.removeItem(`aura_mood_sec_${activePersona.id}`);
    sessionStorage.removeItem(`aura_mood_${activePersona.id}`);
    apiClient.clearConversation(activePersona.id).catch(() => {});
    setCurrentMood(null);
    setIsMoodCheckinDismissed(false);
    initWelcomeMessage(activePersona);
    setInputText('');
    setReplyingToMessage(null);
    setEditingMessage(null);
    setMessageToDelete(null);
    focusInput();
    requestAnimationFrame(focusInput);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  // Restore session mood when active persona changes
  useEffect(() => {
    if (activePersona) {
      const savedMood = sessionStorage.getItem(`aura_mood_${activePersona.id}`);
      if (savedMood) {
        try {
          const parsed = JSON.parse(savedMood);
          const resolved = getMoodById(parsed.id);
          setCurrentMood(resolved || null);
        } catch {
          setCurrentMood(null);
        }
      } else {
        setCurrentMood(null);
      }
      setIsMoodCheckinDismissed(false);
    }
  }, [activePersona?.id]);

  const handleSelectMood = (mood: UserSessionMood) => {
    setCurrentMood(mood);
    if (activePersona) {
      sessionStorage.setItem(`aura_mood_${activePersona.id}`, JSON.stringify(mood));

      // If at the start of conversation (only initial welcome message or empty),
      // adapt the initial persona greeting to immediately reflect the selected mood!
      if (messages.length <= 1) {
        const adaptiveGreeting = getMoodAdaptiveGreeting(mood, activePersona.name, userProfile?.name);
        const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const updatedWelcome: Message = {
          id: `msg-welcome-${activePersona.id}`,
          role: 'model',
          content: adaptiveGreeting,
          timestamp: timeStr
        };
        setMessages([updatedWelcome]);
        sessionStorage.setItem(`aura_chat_${activePersona.id}`, JSON.stringify([updatedWelcome]));
      }
    }
    showToast(`Mood set to ${mood.emoji} ${mood.label}. Tone adapted!`);
    focusInput();
  };

  const handleClearMood = () => {
    setCurrentMood(null);
    if (activePersona) {
      sessionStorage.removeItem(`aura_mood_${activePersona.id}`);
    }
    showToast('Session mood cleared');
    focusInput();
  };

  const handleSelectPersona = (targetPersona: Persona) => {
    if (targetPersona.id === activePersona?.id) {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
      focusInput();
      return;
    }

    currentPersonaIdRef.current = targetPersona.id;
    setActivePersona(targetPersona);
    setReplyingToMessage(null);
    setEditingMessage(null);
    setMessageToDelete(null);
    if (onSelectPersona) {
      onSelectPersona(targetPersona);
    }

    restoreConversationForPersona(targetPersona);

    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
    focusInput();
    requestAnimationFrame(focusInput);
  };

  // --- File & Attachment Handlers ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let type: 'image' | 'video' | 'audio' | 'document' = 'document';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type.startsWith('video/')) type = 'video';
      else if (file.type.startsWith('audio/')) type = 'audio';

      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        const newAtt: ChatAttachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          type,
          url,
          size: file.size,
          mimeType: file.type
        };
        setStagedAttachments((prev) => [...prev, newAtt]);
        focusInput();
      };
      reader.readAsDataURL(file);
    }

    e.target.value = '';
    focusInput();
  };

  const handleRemoveAttachment = (id: string) => {
    setStagedAttachments((prev) => prev.filter((att) => att.id !== id));
    focusInput();
  };

  // --- Emoji Picker Handler (Inserts at cursor) ---
  const handleSelectEmoji = (emoji: string) => {
    if (!inputRef.current) {
      setInputText((prev) => prev + emoji);
      return;
    }
    const input = inputRef.current;
    const start = input.selectionStart ?? inputText.length;
    const end = input.selectionEnd ?? inputText.length;
    const newText = inputText.substring(0, start) + emoji + inputText.substring(end);
    setInputText(newText);

    requestAnimationFrame(() => {
      input.focus();
      const newPos = start + emoji.length;
      input.setSelectionRange(newPos, newPos);
    });
  };

  // --- Voice Message Recording Handlers ---
  const formatRecordingTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];

      let options: MediaRecorderOptions = {};
      if (typeof MediaRecorder !== 'undefined') {
        if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
          options = { mimeType: 'audio/webm;codecs=opus' };
        } else if (MediaRecorder.isTypeSupported('audio/webm')) {
          options = { mimeType: 'audio/webm' };
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          options = { mimeType: 'audio/mp4' };
        }
      }

      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const mime = recorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: mime });

        const reader = new FileReader();
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
          setRecordingState('preview');
        };
        reader.readAsDataURL(audioBlob);
      };

      recorder.start(100);
      setRecordingSeconds(0);
      setRecordingState('recording');

      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.error('Microphone access denied:', err);
      setMicError('Microphone permission was denied or unavailable. Please enable microphone permissions in your browser.');
      setRecordingState('idle');
    }
  };

  const stopRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    setRecordedAudioDuration(Math.max(1, recordingSeconds));
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stream?.getTracks().forEach((t) => t.stop());
      mediaRecorderRef.current.stop();
    }
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setRecordingState('idle');
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setIsPreviewPlaying(false);
    focusInput();
    requestAnimationFrame(focusInput);
  };

  const togglePreviewAudio = () => {
    if (!recordedAudioUrl) return;
    if (!previewAudioRef.current) {
      const audio = new Audio(recordedAudioUrl);
      previewAudioRef.current = audio;
      audio.onended = () => setIsPreviewPlaying(false);
    }

    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play().then(() => {
        setIsPreviewPlaying(true);
      }).catch(() => setIsPreviewPlaying(false));
    }
  };

  // Unified, high-performance streaming AI response handler
  const sendChatStream = async (historyToSend: Message[], currentP: Persona) => {
    // 1. Cancel any prior in-flight generation to prevent duplicate requests & race conditions
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setActiveRequestsCount((c) => c + 1);

    const modelMsgId = `model-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    let accumulatedText = '';
    let modelAttachments: ChatAttachment[] | undefined = undefined;

    // Immediately insert the model message bubble in streaming state with typing indicator dots
    const placeholderMsg: Message = {
      id: modelMsgId,
      role: 'model',
      content: '',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isStreaming: true
    };
    messagesRef.current = [...messagesRef.current, placeholderMsg];
    setMessages([...messagesRef.current]);
    smoothScrollStream();

    // Send the last 20 messages for context (the server will compact older ones)
    const trimmedForPayload = historyToSend.slice(-20).map((m) => ({
      role: m.role,
      content: m.replyTo
        ? `[In reply to ${m.replyTo.senderName}: "${m.replyTo.content.slice(0, 100)}"]\n${m.content}`
        : m.content,
      attachments: m.attachments?.map((att) => ({
        type: att.type,
        url: att.url,
        name: att.name,
        mimeType: att.mimeType
      })),
      voiceMessage: m.voiceMessage ? {
        audioUrl: m.voiceMessage.audioUrl,
        duration: m.voiceMessage.duration
      } : undefined
    }));

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'text/event-stream'
    };
    const sessionToken = apiClient.getSessionToken();
    if (sessionToken) {
      requestHeaders['Authorization'] = `Bearer ${sessionToken}`;
    }

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify({
          persona: currentP,
          messages: trimmedForPayload,
          stream: true,
          userProfile: userProfile
            ? {
                name: userProfile.name,
                age: userProfile.age,
                gender: userProfile.gender,
                nature: userProfile.nature
              }
            : undefined,
          userMood: currentMood
            ? {
                id: currentMood.id,
                label: currentMood.label,
                emoji: currentMood.emoji,
                toneGuide: currentMood.toneGuide
              }
            : undefined
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const isSSE = response.headers.get('content-type')?.includes('text/event-stream');

      if (isSSE && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;
            const dataStr = trimmedLine.slice(6).trim();

            if (dataStr === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(dataStr);

              // Detect if response contains a generated image
              if (parsed.image && parsed.image.url) {
                modelAttachments = [
                  {
                    id: `att-img-${Date.now()}`,
                    name: parsed.image.prompt || 'Generated image',
                    type: 'image',
                    url: parsed.image.url
                  }
                ];
              }

              if (parsed.text) {
                accumulatedText += parsed.text;
              }

              if (parsed.text || parsed.image) {
                if (currentPersonaIdRef.current === currentP.id) {
                  messagesRef.current = messagesRef.current.map((m) =>
                    m.id === modelMsgId
                      ? {
                          ...m,
                          content: accumulatedText,
                          attachments: modelAttachments || m.attachments,
                          isStreaming: true
                        }
                      : m
                  );
                  setMessages([...messagesRef.current]);
                  smoothScrollStream();
                }
              }
            } catch (_) {}
          }
        }
      } else {
        // Fallback to non-streaming JSON
        const data = await response.json();
        accumulatedText = data.reply ? data.reply.trim() : `Hey! What's on your mind?`;
        const replyAttachments: ChatAttachment[] | undefined = data.image?.url
          ? [
              {
                id: `att-img-${Date.now()}`,
                name: data.image.prompt || 'Generated image',
                type: 'image',
                url: data.image.url
              }
            ]
          : undefined;

        if (currentPersonaIdRef.current === currentP.id) {
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === modelMsgId
              ? {
                  ...m,
                  content: accumulatedText,
                  attachments: replyAttachments,
                  isStreaming: false
                }
              : m
          );
          setMessages([...messagesRef.current]);
        }
      }

      // Finalize streaming
      if (currentPersonaIdRef.current === currentP.id) {
        messagesRef.current = messagesRef.current.map((m) =>
          m.id === modelMsgId
            ? { ...m, isStreaming: false, attachments: modelAttachments || m.attachments }
            : m
        );
        setMessages([...messagesRef.current]);
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        if (!accumulatedText) {
          messagesRef.current = messagesRef.current.filter((m) => m.id !== modelMsgId);
          setMessages([...messagesRef.current]);
        }
        return;
      }
      console.error('Chat error:', err);

      if (currentPersonaIdRef.current === currentP.id) {
        if (accumulatedText.trim().length > 0) {
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === modelMsgId ? { ...m, isStreaming: false } : m
          );
          setMessages([...messagesRef.current]);
        } else {
          messagesRef.current = messagesRef.current.map((m) =>
            m.id === modelMsgId
              ? {
                  ...m,
                  content: `Couldn't reach ${currentP.name}. Tap below to retry.`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  failed: true,
                  isStreaming: false
                }
              : m
          );
          setMessages([...messagesRef.current]);
        }
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setActiveRequestsCount((c) => Math.max(0, c - 1));
      focusInput();
      requestAnimationFrame(focusInput);
    }
  };

  const handleRetry = (failedMsgId: string) => {
    if (!activePersona) return;
    const filtered = messagesRef.current.filter((m) => m.id !== failedMsgId);
    messagesRef.current = filtered;
    setMessages(filtered);
    sendChatStream(filtered, activePersona);
  };

  // --- Voice Message Send Handler ---
  const handleSendVoiceMessage = async () => {
    if (!recordedAudioUrl || !activePersona) return;

    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setIsPreviewPlaying(false);

    const currentP = activePersona;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const voiceMsg: Message = {
      id: `user-voice-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: `🎙️ Voice message (${recordedAudioDuration}s)`,
      timestamp: timeStr,
      voiceMessage: {
        audioUrl: recordedAudioUrl,
        duration: recordedAudioDuration
      }
    };

    const newHistory = [...messagesRef.current, voiceMsg];
    messagesRef.current = newHistory;
    setMessages(newHistory);
    setRecordedAudioUrl(null);
    setRecordingSeconds(0);
    setRecordingState('idle');
    focusInput();
    requestAnimationFrame(focusInput);

    await sendChatStream(newHistory, currentP);
  };

  // --- General Message Send Handler (supports text + attachments, editing, and replying) ---
  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText;
    const hasText = Boolean(textToSend.trim());
    const hasAttachments = stagedAttachments.length > 0;

    if ((!hasText && !hasAttachments) || !activePersona) return;

    // 1. If in edit mode, update the original message directly
    if (editingMessage) {
      const trimmed = textToSend.trim();
      if (!trimmed && stagedAttachments.length === 0) return;

      const updated = messagesRef.current.map((m) =>
        m.id === editingMessage.id
          ? {
              ...m,
              content: trimmed,
              isEdited: true
            }
          : m
      );
      messagesRef.current = updated;
      setMessages(updated);
      setEditingMessage(null);
      setInputText('');
      showToast('Message edited');
      focusInput();
      return;
    }

    const currentP = activePersona;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalContent = textToSend.trim();
    if (!finalContent && hasAttachments) {
      finalContent = stagedAttachments.map((a) => `📎 Shared ${a.name}`).join(', ');
    } else if (finalContent && hasAttachments) {
      finalContent = `${finalContent}\n${stagedAttachments.map((a) => `📎 [${a.name}]`).join('\n')}`;
    }

    const currentAttachments = [...stagedAttachments];

    // Capture replyTo if active
    let replyData: ReplyInfo | undefined = undefined;
    if (replyingToMessage) {
      replyData = {
        id: replyingToMessage.id,
        role: replyingToMessage.role,
        senderName: replyingToMessage.role === 'user' ? (userProfile?.name || 'You') : currentP.name,
        content: replyingToMessage.content || (replyingToMessage.voiceMessage ? '🎙️ Voice message' : '📎 Attachment')
      };
      setReplyingToMessage(null);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      role: 'user',
      content: finalContent,
      timestamp: timeStr,
      attachments: currentAttachments.length > 0 ? currentAttachments : undefined,
      replyTo: replyData
    };

    // 1. Immediately clear input and staged attachments
    setInputText('');
    setStagedAttachments([]);

    // 2. Keep the message input automatically focused right away
    focusInput();

    // 3. Update messages history
    const newHistory = [...messagesRef.current, userMsg];
    messagesRef.current = newHistory;
    setMessages(newHistory);

    // 4. Ensure cursor remains inside the input across render cycles
    requestAnimationFrame(focusInput);

    // 5. Stream response with debounced abort protection
    await sendChatStream(newHistory, currentP);
  };

  if (!isOpen || !activePersona) return null;

  const avatar = getAvatarConfig(activePersona.avatarId);
  const vibe = getPersonalityVibe(activePersona.personality);
  const VibeIcon = vibe.icon;

  // Retrieve chat previews for all personas
  const allPersonaChats = personas.map((p) => {
    const isCurrent = p.id === activePersona.id;
    let lastMsg = '';
    let lastTime = '';
    let hasChat = false;

    if (isCurrent && messages.length > 0) {
      const last = messages[messages.length - 1];
      lastMsg = last.content;
      lastTime = last.timestamp;
      hasChat = true;
    } else {
      const storedKey = `aura_chat_${p.id}`;
      const saved = sessionStorage.getItem(storedKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const last = parsed[parsed.length - 1];
            lastMsg = last.content;
            lastTime = last.timestamp;
            hasChat = true;
          }
        } catch {}
      }
    }

    return {
      persona: p,
      lastMessage: lastMsg,
      lastTimestamp: lastTime,
      hasChat
    };
  });

  // Extended Sidebar Content Component (Glass Blush)
  const renderSidebarContent = () => (
    <div className="flex flex-col h-full w-full bg-[var(--surface)] backdrop-blur-2xl select-none border-r border-[var(--border)] overflow-hidden text-[var(--text-primary)] transition-colors">
      {/* 1. TOP HEADER: BACK BUTTON + CLOSE BUTTON */}
      <div className="p-3 sm:p-4 border-b border-[var(--border)] flex items-center justify-between shrink-0 bg-[var(--surface-secondary)]">
        {/* Back Button */}
        <button
          onClick={onClose}
          className="btn-glass-blush-subtle flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs group"
          title="Back to Persona Dashboard"
          aria-label="Back to Persona Dashboard"
        >
          <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back</span>
        </button>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] rounded-xl transition-colors cursor-pointer"
          title="Close sidebar"
          aria-label="Close sidebar"
        >
          <X size={16} />
        </button>
      </div>

      {/* 2. ACTIONS: NEW CHAT, EXPORT CHAT & CREATE PERSONA */}
      <div className="p-3 space-y-2 shrink-0 border-b border-[var(--border)] bg-[var(--surface-secondary)]/50">
        {/* New Chat Button */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNewChat}
          className="btn-glass-blush w-full py-2.5 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer"
          title="Start fresh conversation with companion"
        >
          <Plus size={16} />
          <span>New Chat</span>
        </motion.button>

        {/* Export Chat Button in Sidebar */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsExportMenuOpen(true);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
          }}
          className="btn-glass-blush-subtle w-full py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
          title="Export conversation history"
        >
          <Download size={14} className="text-[var(--accent)] group-hover:-translate-y-0.5 transition-transform" />
          <span>Export Chat</span>
        </motion.button>

        {/* Search Messages in Sidebar */}
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => {
            setIsSearchOpen(true);
            if (window.innerWidth < 768) {
              setIsSidebarOpen(false);
            }
            setTimeout(() => {
              searchInputRef.current?.focus();
              searchInputRef.current?.select();
            }, 80);
          }}
          className="btn-glass-blush-subtle w-full py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
          title="Search in current conversation (Ctrl+F)"
        >
          <Search size={14} className="text-[var(--accent)] group-hover:scale-110 transition-transform" />
          <span>Search in Chat</span>
        </motion.button>

        {/* Create Persona Option */}
        {onOpenCreatePersona && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={onOpenCreatePersona}
            className="btn-glass-blush-subtle w-full py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
            title="Create a new custom persona"
          >
            <Sparkles size={13} className="text-[var(--accent)] group-hover:rotate-12 transition-transform" />
            <span>Create New Persona</span>
          </motion.button>
        )}

        {/* App Guide / How This Works Option */}
        {onOpenHowItWorks && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
              onOpenHowItWorks();
            }}
            className="btn-glass-blush-subtle w-full py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
            title="App Architecture, Features & How This Works Guide"
          >
            <BookOpen size={13} className="text-purple-400 group-hover:scale-110 transition-transform" />
            <span>App Guide & Architecture</span>
          </motion.button>
        )}

        {/* Terms & Privacy Policy Option */}
        {onOpenTermsPolicy && (
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (window.innerWidth < 768) {
                setIsSidebarOpen(false);
              }
              onOpenTermsPolicy('terms');
            }}
            className="btn-glass-blush-subtle w-full py-2 px-3.5 rounded-2xl text-xs font-bold transition-all shadow-2xs flex items-center justify-center gap-1.5 cursor-pointer group"
            title="View End-to-End Encryption & AI Responsibility Terms"
          >
            <ShieldCheck size={13} className="text-emerald-500 group-hover:scale-110 transition-transform" />
            <span>Terms & Policy</span>
          </motion.button>
        )}
      </div>

      {/* 3. ALL PERSONA CHATS LIST */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5">
        <div className="px-2.5 py-1 text-[11px] font-black text-[var(--text-muted)] uppercase tracking-wider flex items-center justify-between">
          <span>All Persona Chats</span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border-subtle)] text-[10px] font-bold">
            {allPersonaChats.length}
          </span>
        </div>

        {allPersonaChats.map((item) => {
          const isActive = item.persona.id === activePersona.id;
          const pAvatar = getAvatarConfig(item.persona.avatarId);
          const pVibe = getPersonalityVibe(item.persona.personality);

          return (
            <motion.button
              key={item.persona.id}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => handleSelectPersona(item.persona)}
              className={`w-full text-left p-2.5 sm:p-3 rounded-2xl transition-all cursor-pointer flex items-center gap-3 relative group ${
                isActive
                  ? 'bg-[var(--surface-secondary)] border border-[var(--accent)] text-[var(--text-primary)] shadow-xs ring-1 ring-[var(--accent)]/30'
                  : 'hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border border-transparent'
              }`}
            >
              {/* Persona Avatar with Online Dot */}
              <div className="relative shrink-0">
                <div
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-2xl flex items-center justify-center overflow-hidden shadow-2xs ${
                    item.persona.iconPath ? 'bg-[var(--surface-secondary)] p-0.5 border border-[var(--border)]' : pAvatar.colorClass
                  }`}
                >
                  {item.persona.iconPath ? (
                    <img
                      src={item.persona.iconPath}
                      alt={item.persona.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    renderAvatarIcon(pAvatar.iconId, 18)
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--surface)] shadow-2xs" />
              </div>

              {/* Persona Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs sm:text-sm font-black truncate text-[var(--text-primary)]">
                    {item.persona.name}
                  </span>
                  {item.lastTimestamp ? (
                    <span className="text-[10px] font-semibold text-[var(--text-muted)] shrink-0">
                      {item.lastTimestamp}
                    </span>
                  ) : (
                    <span className="text-[9px] font-bold text-[var(--accent)] bg-[var(--surface-secondary)] px-1.5 py-0.5 rounded-full shrink-0 border border-[var(--border-subtle)]">
                      {pVibe.trait}
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs truncate leading-relaxed ${
                    isActive ? 'text-[var(--text-secondary)] font-medium' : 'text-[var(--text-muted)]'
                  }`}
                >
                  {item.lastMessage || item.persona.personality}
                </p>
              </div>

              {/* Active Indicator Bar */}
              {isActive && (
                <span className="w-1.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500 absolute right-2" />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* 4. MOBILE-FRIENDLY QUICK FOOTER: THEME TOGGLE, PROFILE & ACTIONS */}
      <div className="p-3 border-t border-[var(--border)] bg-[var(--surface-secondary)]/80 flex items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-2">
          <ThemeToggle compact />
          <span className="text-[11px] font-bold text-[var(--text-secondary)]">Theme</span>
        </div>
        <UserProfileMenu compactMode={true} onProfileDeleted={onClose} />
      </div>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed inset-0 z-50 w-full h-full h-[100dvh] bg-[var(--bg)] flex flex-col overflow-hidden text-[var(--text-primary)] transition-colors duration-300 overscroll-none"
      >
        {/* Subtle Atmospheric Blobs */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
          <div className="ambient-blob w-[450px] h-[450px] -top-20 -left-10 bg-gradient-to-br from-pink-300/35 via-purple-300/25 to-transparent dark:from-purple-900/25 dark:via-pink-900/15" />
          <div className="ambient-blob w-[500px] h-[500px] bottom-0 right-0 bg-gradient-to-tl from-purple-300/30 via-blue-200/20 to-transparent dark:from-violet-900/20 dark:via-blue-950/15" />
        </div>

        {/* ==================== TOP CHAT HEADER ==================== */}
        <header className="w-full bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border)] px-2.5 sm:px-6 py-2 sm:py-3 flex items-center justify-between z-20 shrink-0 shadow-xs transition-colors pt-safe">
          {/* Left Controls: Back button & Active Persona Identity */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Direct Back / Exit to Dashboard Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 sm:p-2.5 rounded-xl sm:rounded-2xl bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border border-[var(--border)] shadow-2xs transition-all cursor-pointer shrink-0"
              title="Back to all personas"
              aria-label="Back to all personas"
            >
              <ArrowLeft size={18} />
            </motion.button>

            {/* Clickable Persona Profile Trigger (WhatsApp/Telegram contact info style) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsProfileDetailsOpen(true)}
              id="persona-chat-header-profile-btn"
              className="flex items-center gap-2 sm:gap-3 min-w-0 p-1 sm:px-2.5 sm:py-1 rounded-xl sm:rounded-2xl hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer text-left group shadow-none hover:shadow-2xs flex-1"
              title={`View ${activePersona.name}'s contact details`}
              aria-label={`View ${activePersona.name}'s contact details`}
              aria-haspopup="dialog"
              aria-expanded={isProfileDetailsOpen}
            >
              {/* Active Persona Avatar with Live Indicator */}
              <div className="relative shrink-0">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xs overflow-hidden group-hover:ring-2 group-hover:ring-[var(--accent)]/40 transition-all ${
                    activePersona.iconPath ? 'bg-[var(--surface-secondary)] p-0.5 border border-[var(--border)]' : avatar.colorClass
                  }`}
                >
                  {activePersona.iconPath ? (
                    <img
                      src={activePersona.iconPath}
                      alt={activePersona.name}
                      className="w-full h-full object-cover rounded-lg sm:rounded-xl"
                    />
                  ) : (
                    renderAvatarIcon(avatar.iconId, 16)
                  )}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-emerald-500 border-2 border-[var(--surface)]" />
                </span>
              </div>

              {/* Active Persona Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-xs sm:text-base font-black text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors tracking-tight truncate">
                    {activePersona.name}
                  </h2>
                  <div
                    className={`hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${vibe.colorClass}`}
                  >
                    <VibeIcon size={10} />
                    <span>{vibe.trait}</span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--text-muted)] font-medium truncate">
                  {isLoading ? (
                    <span className="text-[var(--accent)] font-semibold inline-flex items-center gap-1 animate-pulse">
                      thinking & typing...
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 flex-wrap">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">Active</span>
                      <span className="hidden sm:inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--surface-secondary)] text-[var(--accent)] border border-[var(--border-subtle)] font-bold">
                        <Sparkles size={9} className="shrink-0" />
                        <span>Accurate & Context-Aware</span>
                      </span>
                      {onOpenTermsPolicy && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenTermsPolicy('privacy-e2ee');
                          }}
                          className="hidden md:inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/20 font-bold transition-colors cursor-pointer"
                          title="End-to-End Encrypted (AES-256-GCM) • View Security Policy"
                        >
                          <ShieldCheck size={9} className="shrink-0" />
                          <span>E2EE Protected</span>
                        </button>
                      )}
                    </span>
                  )}
                </p>
              </div>
            </motion.button>
          </div>

          {/* Top-Right Area: Search + Export Chat + Mood Badge + Theme Switcher + User Profile Identity */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Search Messages Toggle Button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const nextState = !isSearchOpen;
                setIsSearchOpen(nextState);
                if (nextState) {
                  setTimeout(() => {
                    searchInputRef.current?.focus();
                    searchInputRef.current?.select();
                  }, 80);
                } else {
                  setSearchQuery('');
                }
              }}
              className={`p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                isSearchOpen || trimmedSearchQuery
                  ? 'bg-[var(--surface-secondary)] text-[var(--accent)] border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border)]'
              }`}
              title="Search conversation messages (Ctrl+F)"
              aria-label="Search conversation messages"
            >
              <Search size={15} className="text-[var(--accent)]" />
              <span className="hidden sm:inline">Search</span>
            </motion.button>

            {/* Export Chat Dropdown Button (Desktop) */}
            <div className="relative hidden sm:block" ref={exportMenuRef}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                className={`p-2 sm:px-3 sm:py-1.5 rounded-xl sm:rounded-2xl border text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${
                  isExportMenuOpen
                    ? 'bg-[var(--surface-secondary)] text-[var(--accent)] border-[var(--accent)] ring-1 ring-[var(--accent)]/30'
                    : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border)]'
                }`}
                title="Export conversation history"
                aria-label="Export conversation history"
                aria-expanded={isExportMenuOpen}
              >
                <Download size={15} className="text-[var(--accent)]" />
                <span className="hidden sm:inline">Export</span>
              </motion.button>

              <AnimatePresence>
                {isExportMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-52 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl p-2 z-50 backdrop-blur-xl"
                  >
                    <div className="px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--text-muted)] border-b border-[var(--border-subtle)] mb-1 flex items-center justify-between">
                      <span>Export Chat</span>
                      <Download size={11} className="text-[var(--accent)]" />
                    </div>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportChat('txt');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-[var(--surface-secondary)] text-[var(--accent)] group-hover:scale-105 transition-transform shrink-0">
                        <FileText size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12px]">Text File (.txt)</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">Readable transcript</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportChat('html');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-[var(--surface-secondary)] text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
                        <Globe size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12px]">HTML File (.html)</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">Formatted transcript</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setIsExportMenuOpen(false);
                        handleExportChat('json');
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-left rounded-xl hover:bg-[var(--surface-hover)] text-xs font-semibold text-[var(--text-primary)] transition-colors cursor-pointer group"
                    >
                      <div className="p-1.5 rounded-lg bg-[var(--surface-secondary)] text-purple-600 dark:text-purple-400 group-hover:scale-105 transition-transform shrink-0">
                        <FileIcon size={14} />
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-[12px]">JSON Data (.json)</div>
                        <div className="text-[10px] text-[var(--text-muted)] truncate">Structured backup</div>
                      </div>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Desktop Theme Toggle & User Profile */}
            <div className="hidden sm:flex items-center gap-1.5">
              <ThemeToggle compact />
              <UserProfileMenu 
                compactMode={true}
                onProfileDeleted={onClose}
                onEditPersona={activePersona ? () => setEditingPersona(activePersona) : undefined}
              />
            </div>

            {/* 3-Dot Options Button (Always accessible on right side like WhatsApp/Telegram) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer shrink-0 ${
                isSidebarOpen
                  ? 'bg-[var(--surface-secondary)] text-[var(--accent)] border-[var(--accent)] shadow-2xs'
                  : 'bg-[var(--surface)] hover:bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border)] shadow-2xs'
              }`}
              title={isSidebarOpen ? 'Close options' : 'More options & chats'}
              aria-label={isSidebarOpen ? 'Close options' : 'More options & chats'}
            >
              <MoreVertical size={18} />
            </motion.button>
          </div>
        </header>

        {/* ==================== EXPANDABLE SEARCH & FILTER BAR ==================== */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="w-full bg-[var(--surface-glass)] backdrop-blur-xl border-b border-[var(--border)] px-3 sm:px-6 py-2.5 z-20 shrink-0 shadow-xs"
            >
              <div className="max-w-3xl mx-auto flex items-center gap-2">
                <div className="relative flex-1 flex items-center min-w-0">
                  <Search size={16} className="absolute left-3 text-[var(--text-muted)] pointer-events-none shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        if (searchQuery) {
                          setSearchQuery('');
                        } else {
                          setIsSearchOpen(false);
                        }
                      }
                    }}
                    placeholder={`Filter messages in chat with ${activePersona?.name || 'companion'}...`}
                    className="w-full bg-[var(--surface-secondary)] border border-[var(--border)] focus:border-[var(--accent)] text-[var(--text-primary)] pl-9 pr-8 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-[var(--text-muted)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="absolute right-2 p-1 rounded-full hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                      title="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Matches counter badge */}
                {trimmedSearchQuery && (
                  <span className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border shrink-0 ${
                    filteredMessages.length > 0
                      ? 'bg-[var(--surface-secondary)] text-[var(--accent)] border-[var(--accent)]/30'
                      : 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  }`}>
                    {filteredMessages.length} {filteredMessages.length === 1 ? 'match' : 'matches'}
                  </span>
                )}

                {/* Close search button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="p-1.5 sm:p-2 rounded-xl hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                  title="Close search (Esc)"
                  aria-label="Close search"
                >
                  <X size={17} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ==================== MAIN BODY: EXTENDED SIDEBAR + CHAT ==================== */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Desktop Left Collapsible Extended Sidebar (Smooth Slide Open/Closed) */}
          <AnimatePresence initial={false}>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 300, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="hidden md:flex flex-col shrink-0 h-full overflow-hidden z-10"
              >
                <div className="w-[300px] h-full">
                  {renderSidebarContent()}
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Mobile Slide-Out Drawer Sidebar */}
          <AnimatePresence>
            {isSidebarOpen && (
              <div className="md:hidden fixed inset-0 z-40">
                {/* Backdrop Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-xs"
                />

                {/* Drawer */}
                <motion.aside
                  initial={{ x: -300, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -300, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed inset-y-0 left-0 w-[290px] sm:w-[320px] bg-[var(--surface)] shadow-2xl z-50 flex flex-col h-full overflow-hidden"
                >
                  {renderSidebarContent()}
                </motion.aside>
              </div>
            )}
          </AnimatePresence>

          {/* Main Chat Conversation Area */}
          <section className="flex-1 flex flex-col overflow-hidden min-w-0 bg-transparent">
            {/* Active Filter Notification Bar */}
            {trimmedSearchQuery && (
              <div className="bg-[var(--surface-secondary)]/90 backdrop-blur-md border-b border-[var(--border)] px-3 sm:px-6 py-1.5 text-xs text-[var(--text-muted)] flex items-center justify-between z-10 shrink-0 shadow-2xs">
                <div className="flex items-center gap-2 truncate min-w-0">
                  <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-pulse shrink-0" />
                  <span className="truncate">
                    Showing <span className="font-bold text-[var(--text-primary)]">{filteredMessages.length}</span> {filteredMessages.length === 1 ? 'message' : 'messages'} matching <span className="font-bold text-[var(--text-primary)]">"{searchQuery}"</span>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-[11px] font-bold text-[var(--accent)] hover:underline cursor-pointer shrink-0 ml-2"
                >
                  Show all ({messages.length})
                </button>
              </div>
            )}

            {/* Message Stream Area - Only container that scrolls during chat */}
            <div className="flex-1 relative overflow-hidden flex min-w-0">
              <main
                ref={chatContainerRef as any}
                onScroll={updateScrollMetrics}
                className="flex-1 chat-messages-scroll w-full pl-2 pr-4 sm:px-6 py-2 sm:py-4 min-w-0 overscroll-contain"
                id="chat-messages-container"
              >
              <div className="max-w-3xl mx-auto w-full space-y-2.5 sm:space-y-4 min-w-0">
                {/* No matching messages empty state when search filter is active */}
                {filteredMessages.length === 0 && trimmedSearchQuery ? (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-center text-[var(--text-muted)] mb-3 shadow-inner">
                      <Search size={22} className="text-[var(--accent)]" />
                    </div>
                    <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">No matching messages</h3>
                    <p className="text-xs text-[var(--text-muted)] max-w-xs mb-4">
                      No messages in this chat with {activePersona?.name || 'companion'} match "{searchQuery}".
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        searchInputRef.current?.focus();
                      }}
                      className="btn-glass-blush py-1.5 px-3.5 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Clear Search
                    </button>
                  </div>
                ) : (
                  filteredMessages.map((msg, idx) => {
                  const isUser = msg.role === 'user';
                  const isHistorical = historicalMessageIds.has(msg.id);

                  // If this model message is currently streaming but hasn't received content yet,
                  // let the live typing indicator show instead of rendering an empty bubble
                  if (msg.role === 'model' && msg.isStreaming && !msg.content) {
                    return null;
                  }

                  // Optimize Framer Motion transitions in long conversations:
                  // Only stagger recent historical messages to prevent UI lag on large chat logs
                  const isFarOlder = isHistorical && idx < messages.length - 20;
                  const staggerDelay = isFarOlder ? 0 : (isHistorical ? Math.min(idx * 0.035, 0.35) : 0);
                  const animDuration = isFarOlder ? 0.1 : (isHistorical ? 0.28 : 0.18);

                  return (
                    <motion.div
                      key={`${conversationMountId}-${msg.id || idx}`}
                      initial={{
                        opacity: 0,
                        y: isHistorical ? 12 : 8,
                        scale: isHistorical ? 0.98 : 1
                      }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        duration: animDuration,
                        delay: staggerDelay,
                        ease: [0.22, 1, 0.36, 1]
                      }}
                      className={`group relative flex gap-2 sm:gap-3 items-end w-full max-w-full min-w-0 ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                      {/* Persona Avatar on Model Messages */}
                      {!isUser && (
                        <div
                          className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0 mb-1 shadow-2xs ${
                            activePersona.iconPath ? 'bg-[var(--surface-secondary)] p-0.5 border border-[var(--border)]' : avatar.colorClass
                          }`}
                        >
                          {activePersona.iconPath ? (
                            <img
                              src={activePersona.iconPath}
                              alt={activePersona.name}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            renderAvatarIcon(avatar.iconId, 15)
                          )}
                        </div>
                      )}

                      {/* Desktop Hover Quick React Button (for Model Messages) */}
                      {isUser && (
                        <button
                          type="button"
                          onClick={() => setActiveQuickPickerId(activeQuickPickerId === msg.id ? null : msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer mb-5 shrink-0 hidden sm:flex"
                          title="Add reaction"
                          aria-label="Add reaction"
                        >
                          <Smile size={15} />
                        </button>
                      )}

                      {/* Bubble Container */}
                      {msg.voiceMessage ? (
                        <div
                          id={`msg-${msg.id}`}
                          onContextMenu={(e) => handleContextMenu(msg, e)}
                          onTouchStart={(e) => handleTouchStart(msg, e)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchEnd}
                          className={`select-none transition-shadow flex flex-col max-w-[85%] sm:max-w-[75%] min-w-0 ${isUser ? 'items-end' : 'items-start'}`}
                        >
                          <VoiceMessageBubble
                            audioUrl={msg.voiceMessage.audioUrl}
                            duration={msg.voiceMessage.duration}
                            isUser={isUser}
                            timestamp={msg.timestamp}
                          />

                          {/* Quick Emoji Reactions Bar */}
                          <MessageReactionBar
                            messageId={msg.id}
                            reactions={msg.reactions}
                            onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                            isUser={isUser}
                            isPickerOpen={activeQuickPickerId === msg.id}
                            onTogglePicker={() => setActiveQuickPickerId(activeQuickPickerId === msg.id ? null : msg.id)}
                            onClosePicker={() => setActiveQuickPickerId(null)}
                          />
                        </div>
                      ) : (
                        <div 
                          id={`msg-${msg.id}`}
                          onContextMenu={(e) => handleContextMenu(msg, e)}
                          onTouchStart={(e) => handleTouchStart(msg, e)}
                          onTouchMove={handleTouchMove}
                          onTouchEnd={handleTouchEnd}
                          onTouchCancel={handleTouchEnd}
                          className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%] min-w-0 transition-shadow`}
                        >
                          <div
                            className={`w-full max-w-full min-w-0 box-border px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap break-words [overflow-wrap:anywhere] [word-break:break-word] ${
                              isUser
                                ? 'btn-glass-blush text-white font-medium rounded-br-xs shadow-md shadow-purple-500/15'
                                : 'bg-[var(--surface-glass)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--border)] rounded-bl-xs shadow-xs'
                            }`}
                          >
                            {/* Reply Quote Banner if present */}
                            {msg.replyTo && (
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  scrollToMessage(msg.replyTo!.id);
                                }}
                                className={`mb-2 p-2 rounded-xl text-xs border-l-2 cursor-pointer transition-opacity hover:opacity-85 select-none text-left w-full max-w-full min-w-0 overflow-hidden box-border ${
                                  isUser
                                    ? 'bg-black/25 border-white/80 text-white/90'
                                    : 'bg-[var(--surface-secondary)] border-[var(--accent)] text-[var(--text-secondary)]'
                                }`}
                                title="Jump to quoted message"
                              >
                                <div className={`font-bold text-[11px] truncate flex items-center gap-1 min-w-0 max-w-full ${
                                  isUser ? 'text-white' : 'text-[var(--accent)]'
                                }`}>
                                  <CornerUpLeft size={11} className="shrink-0" />
                                  <span className="truncate min-w-0">{msg.replyTo.senderName}</span>
                                </div>
                                <div className="text-[11px] opacity-80 mt-0.5 line-clamp-2 break-words [overflow-wrap:anywhere] [word-break:break-word] min-w-0 max-w-full overflow-hidden">
                                  {trimmedSearchQuery ? renderHighlightedText(msg.replyTo.content, trimmedSearchQuery) : msg.replyTo.content}
                                </div>
                              </div>
                            )}

                            {/* In-chat Attachments */}
                            {msg.attachments && msg.attachments.length > 0 && (
                              <div className="space-y-2 mb-2 w-full max-w-full overflow-hidden min-w-0">
                                {msg.attachments.map((att) => (
                                  <div key={att.id} className="w-full max-w-full min-w-0">
                                    {att.type === 'image' ? (
                                      <div
                                        onClick={() => {
                                          if (didLongPressRef.current) return;
                                          setPreviewImage(att.url);
                                        }}
                                        className="rounded-xl overflow-hidden border border-white/20 shadow-xs cursor-pointer group relative max-w-full sm:max-w-xs"
                                        title="Click to view full image"
                                      >
                                        <img
                                          src={att.url}
                                          alt={att.name}
                                          referrerPolicy="no-referrer"
                                          onError={(e) => {
                                            e.currentTarget.onerror = null;
                                            e.currentTarget.src = getSvgFallbackImage(att.name);
                                          }}
                                          className="w-full max-h-64 object-cover group-hover:scale-105 transition-transform duration-200"
                                        />
                                      </div>
                                    ) : att.type === 'video' ? (
                                      <video
                                        src={att.url}
                                        controls
                                        className="rounded-xl max-w-full sm:max-w-xs max-h-64 border border-white/20 shadow-xs"
                                      />
                                    ) : (
                                      <div className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs max-w-full min-w-0 ${
                                        isUser ? 'bg-black/15 border-white/20' : 'bg-[var(--surface-secondary)] border-[var(--border)]'
                                      }`}>
                                        {att.type === 'audio' ? (
                                          <Music size={17} className="shrink-0" />
                                        ) : att.name.endsWith('.pdf') ? (
                                          <FileText size={17} className="text-rose-400 shrink-0" />
                                        ) : (
                                          <FileIcon size={17} className="shrink-0" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                          <p className="font-bold truncate">{att.name}</p>
                                          {att.size && (
                                            <span className="text-[10px] opacity-75">
                                              {formatFileSize(att.size)}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Message Text */}
                            {msg.failed ? (
                              <div className="flex flex-col gap-2 py-0.5 min-w-0 max-w-full">
                                <div className="text-sm font-medium text-rose-500 dark:text-rose-400 flex items-center gap-1.5">
                                  <AlertCircle size={15} className="shrink-0" />
                                  <span>{msg.content || `Couldn't reach ${activePersona.name}`}</span>
                                </div>
                                <div className="flex items-center gap-2 pt-1 border-t border-rose-500/20">
                                  <button
                                    type="button"
                                    onClick={() => handleRetry(msg.id)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 dark:text-rose-300 font-bold text-xs transition-colors cursor-pointer"
                                    title="Retry sending message"
                                  >
                                    <RotateCcw size={12} />
                                    <span>Retry</span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="break-words [overflow-wrap:anywhere] [word-break:break-word] min-w-0 max-w-full whitespace-pre-wrap">
                                {!msg.content && msg.isStreaming ? (
                                  <span className="inline-flex items-center gap-1.5 py-1 px-0.5 select-none" aria-label="AI is typing...">
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.32s] [animation-duration:0.85s] opacity-90 inline-block" />
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.16s] [animation-duration:0.85s] opacity-90 inline-block" />
                                    <span className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0s] [animation-duration:0.85s] opacity-90 inline-block" />
                                  </span>
                                ) : (
                                  <>
                                    {trimmedSearchQuery ? renderHighlightedText(msg.content, trimmedSearchQuery) : msg.content}
                                    {msg.isStreaming && (
                                      <span
                                        className="inline-flex items-center gap-1 ml-1.5 align-middle select-none py-0.5"
                                        aria-label="AI is typing..."
                                      >
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.32s] [animation-duration:0.85s] opacity-90 inline-block" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.16s] [animation-duration:0.85s] opacity-90 inline-block" />
                                        <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:0s] [animation-duration:0.85s] opacity-90 inline-block" />
                                      </span>
                                    )}
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Quick Emoji Reactions Bar */}
                          <MessageReactionBar
                            messageId={msg.id}
                            reactions={msg.reactions}
                            onToggleReaction={(emoji) => handleToggleReaction(msg.id, emoji)}
                            isUser={isUser}
                            isPickerOpen={activeQuickPickerId === msg.id}
                            onTogglePicker={() => setActiveQuickPickerId(activeQuickPickerId === msg.id ? null : msg.id)}
                            onClosePicker={() => setActiveQuickPickerId(null)}
                          />

                          <span className="text-[10px] text-[var(--text-muted)] mt-1 px-1 font-semibold flex items-center gap-1.5 flex-wrap min-w-0">
                            {msg.isEdited && <span className="opacity-75 italic font-normal">edited</span>}
                            <span>{msg.timestamp}</span>
                            {trimmedSearchQuery && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const targetId = msg.id;
                                  setSearchQuery('');
                                  setTimeout(() => scrollToMessage(targetId), 120);
                                }}
                                className="text-[10px] text-[var(--accent)] hover:underline ml-1 font-bold cursor-pointer"
                                title="Jump to this message in full conversation"
                              >
                                • View in context
                              </button>
                            )}
                          </span>
                        </div>
                      )}

                      {/* Desktop Hover Quick React Button (for Model Messages) */}
                      {!isUser && (
                        <button
                          type="button"
                          onClick={() => setActiveQuickPickerId(activeQuickPickerId === msg.id ? null : msg.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-full hover:bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer mb-5 shrink-0 hidden sm:flex"
                          title="Add reaction"
                          aria-label="Add reaction"
                        >
                          <Smile size={15} />
                        </button>
                      )}

                      {/* User Avatar on User Messages */}
                      {isUser && (
                        <div className="w-8 h-8 rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] overflow-hidden flex items-center justify-center text-[var(--accent)] font-bold shrink-0 mb-1 shadow-2xs">
                          {userProfile?.photoUrl ? (
                            <img
                              src={userProfile.photoUrl}
                              alt={userProfile.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs">
                              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
                            </span>
                          )}
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}

                {/* Live Typing Indicator (shown immediately while waiting for stream start) */}
                {isLoading && !messages.some((m) => m.role === 'model' && m.isStreaming && Boolean(m.content)) && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.98 }}
                    transition={{ duration: 0.2 }}
                    className="flex gap-2.5 items-end justify-start"
                  >
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0 mb-1 shadow-2xs ${
                        activePersona.iconPath ? 'bg-[var(--surface-secondary)] p-0.5 border border-[var(--border)]' : avatar.colorClass
                      }`}
                    >
                      {activePersona.iconPath ? (
                        <img
                          src={activePersona.iconPath}
                          alt={activePersona.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        renderAvatarIcon(avatar.iconId, 15)
                      )}
                    </div>
                    <div className="flex flex-col items-start max-w-[85%] sm:max-w-[75%] min-w-0">
                      <div className="bg-[var(--surface-glass)] backdrop-blur-xl border border-[var(--border)] rounded-2xl rounded-bl-xs px-4 py-2.5 shadow-2xs flex items-center gap-2 text-xs text-[var(--text-secondary)] font-medium max-w-full min-w-0">
                        <span className="truncate min-w-0">
                          <strong className="text-[var(--text-primary)] font-semibold">{activePersona.name}</strong> is typing
                        </span>
                        <div className="flex items-center gap-1 shrink-0 pt-0.5" aria-label="Typing...">
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-duration:0.9s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-duration:0.9s] [animation-delay:0.18s]" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-duration:0.9s] [animation-delay:0.36s]" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>
            </main>

            {/* Dedicated High-Contrast Side Scrollbar Indicator (Visible on Mobile & Desktop) */}
            {scrollMetrics.canScroll && (
              <aside
                aria-label="Chat side scrollbar"
                className="absolute right-1 top-2 bottom-2 w-3 z-30 flex items-center justify-center pointer-events-auto select-none touch-none"
              >
                <div
                  ref={scrollbarTrackRef}
                  onMouseDown={handleScrollbarMouseDown}
                  onTouchStart={handleScrollbarTouchStart}
                  onTouchMove={handleScrollbarTouchMove}
                  onTouchEnd={handleScrollbarTouchEnd}
                  className={`w-2 h-full rounded-full bg-purple-950/20 dark:bg-white/10 border border-purple-400/25 dark:border-white/10 relative cursor-pointer backdrop-blur-sm transition-all duration-150 ${
                    isDraggingThumb ? 'w-2.5 bg-purple-950/30 dark:bg-white/20' : 'hover:w-2.5'
                  }`}
                  title="Drag or tap to scroll chat messages"
                >
                  {/* Glowing Gradient Thumb */}
                  <div
                    style={{
                      height: `${scrollMetrics.thumbHeightPercent}%`,
                      top: `${scrollMetrics.ratio * (100 - scrollMetrics.thumbHeightPercent)}%`,
                    }}
                    className={`absolute left-0 right-0 rounded-full bg-gradient-to-b from-purple-500 via-fuchsia-500 to-pink-500 shadow-sm border border-white/70 dark:border-white/40 transition-transform ${
                      isDraggingThumb ? 'scale-110 shadow-md ring-2 ring-pink-400' : ''
                    }`}
                  />
                </div>
              </aside>
            )}
          </div>

            {/* Telegram-Style Chat Input Section (Quick Prompts permanently removed) */}
            <footer className="p-1.5 sm:p-3 bg-[var(--surface-glass)] backdrop-blur-xl border-t border-[var(--border)] shrink-0 transition-colors z-20 pb-safe">
              <div className="max-w-3xl mx-auto relative">
                {/* Modern Emoji Picker Popup */}
                <EmojiPickerPopup
                  isOpen={isEmojiPickerOpen}
                  onClose={() => {
                    setIsEmojiPickerOpen(false);
                    focusInput();
                    requestAnimationFrame(focusInput);
                  }}
                  onSelectEmoji={handleSelectEmoji}
                />

                {/* Microphone Permission Warning Banner */}
                <AnimatePresence>
                  {micError && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      className="mb-2.5 p-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs font-semibold flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AlertCircle size={15} className="text-amber-500 shrink-0" />
                        <span>{micError}</span>
                      </div>
                      <button
                        onClick={() => setMicError(null)}
                        className="p-1 rounded-lg hover:bg-amber-500/20 text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                        aria-label="Dismiss error"
                      >
                        <X size={13} />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Telegram-style Reply Preview Bar */}
                <AnimatePresence>
                  {replyingToMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 6 }}
                      className="overflow-hidden mb-2"
                    >
                      <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-1 self-stretch rounded-full bg-[var(--accent)] shrink-0" />
                          <CornerUpLeft size={16} className="text-[var(--accent)] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--accent)] truncate">
                              Replying to {replyingToMessage.role === 'user' ? (userProfile?.name || 'You') : activePersona.name}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {replyingToMessage.content || (replyingToMessage.voiceMessage ? '🎙️ Voice message' : '📎 Attachment')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingToMessage(null);
                            focusInput();
                          }}
                          className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                          title="Cancel reply"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Telegram-style Edit Message Bar */}
                <AnimatePresence>
                  {editingMessage && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: 6 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: 6 }}
                      className="overflow-hidden mb-2"
                    >
                      <div className="flex items-center justify-between gap-3 px-3.5 py-2 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xs">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-1 self-stretch rounded-full bg-[var(--accent)] shrink-0" />
                          <Edit3 size={16} className="text-[var(--accent)] shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[var(--accent)] truncate">
                              Edit message
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] truncate">
                              {editingMessage.content}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMessage(null);
                            setInputText('');
                            focusInput();
                          }}
                          className="p-1 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shrink-0"
                          title="Cancel edit"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pre-send Staged Attachments Preview */}
                <ChatAttachmentPreview
                  attachments={stagedAttachments}
                  onRemove={handleRemoveAttachment}
                />

                {/* Hidden File Input supporting Images, Videos, Documents, and Common Files */}
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip"
                  onChange={handleFileSelect}
                  className="hidden"
                />

                {/* Telegram-Style Input Bar / Voice Recorder Bar */}
                {recordingState === 'recording' ? (
                  /* Active Recording State with Timer and Soundwaves */
                  <div className="flex items-center justify-between gap-2.5 px-3.5 sm:px-4 py-2.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="relative flex h-3 w-3 shrink-0">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500" />
                      </span>
                      <span className="text-xs font-bold text-rose-600 dark:text-rose-400 tracking-wider uppercase shrink-0">
                        Recording
                      </span>
                      <span className="text-xs sm:text-sm font-mono font-black text-[var(--text-primary)] shrink-0">
                        {formatRecordingTimer(recordingSeconds)}
                      </span>
                      {/* Telegram animated sound wave bars */}
                      <div className="hidden sm:flex items-center gap-0.5 h-4 px-2">
                        {[40, 85, 55, 95, 60, 90, 45, 75].map((h, i) => (
                          <span
                            key={i}
                            className="w-1 bg-[var(--accent)] rounded-full animate-pulse"
                            style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Cancel Recording */}
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 sm:px-3 sm:py-1.5 rounded-xl hover:bg-rose-500/15 text-rose-500 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                        title="Cancel recording"
                      >
                        <Trash2 size={16} />
                        <span className="hidden sm:inline">Cancel</span>
                      </motion.button>

                      {/* Finish Recording */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={stopRecording}
                        className="btn-glass-blush p-2 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Finish recording"
                      >
                        <Check size={16} />
                        <span className="hidden sm:inline">Done</span>
                      </motion.button>
                    </div>
                  </div>
                ) : recordingState === 'preview' ? (
                  /* Audio Preview State before sending */
                  <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xs">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={togglePreviewAudio}
                        className="w-9 h-9 rounded-full bg-[var(--accent)] text-white flex items-center justify-center shrink-0 shadow-xs cursor-pointer active:scale-95 transition-transform"
                        title={isPreviewPlaying ? 'Pause' : 'Play preview'}
                      >
                        {isPreviewPlaying ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" className="ml-0.5" />}
                      </button>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                          Voice Message Preview
                        </p>
                        <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                          {formatRecordingTimer(recordedAudioDuration)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {/* Discard Voice Message */}
                      <motion.button
                        whileHover={{ scale: 1.08 }}
                        whileTap={{ scale: 0.92 }}
                        type="button"
                        onClick={cancelRecording}
                        className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="Delete recording"
                      >
                        <Trash2 size={17} />
                      </motion.button>

                      {/* Send Voice Message */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        type="button"
                        onClick={handleSendVoiceMessage}
                        className="btn-glass-blush p-2.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                        title="Send voice message"
                      >
                        <Send size={15} />
                        <span className="hidden sm:inline">Send</span>
                      </motion.button>
                    </div>
                  </div>
                ) : (
                  /* Standard Telegram-Style Input Bar: [ 📎 ] [ Write a message... ] [ 😊 ] [ 🎤 / ➤ ] */
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                      focusInput();
                    }}
                    className="flex items-center gap-1.5 sm:gap-2"
                  >
                    {/* [ 📎 ] File / Attachment button */}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="p-2 sm:p-2.5 rounded-2xl text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)] transition-all cursor-pointer shrink-0"
                      title="Attach file or photo"
                      aria-label="Attach file or photo"
                    >
                      <Paperclip size={19} className="sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* [ Large Flexible Message Input Field ] */}
                    <div className="flex-1 min-w-0 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onFocus={() => {
                          setTimeout(() => {
                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                          }, 120);
                        }}
                        placeholder={
                          editingMessage
                            ? 'Edit message...'
                            : replyingToMessage
                              ? `Reply to ${replyingToMessage.role === 'user' ? (userProfile?.name || 'You') : activePersona.name}...`
                              : `Write a message to ${activePersona.name}...`
                        }
                        className="w-full bg-[var(--surface-secondary)] text-[var(--text-primary)] placeholder-[var(--text-muted)] border border-[var(--border-subtle)] focus:border-[var(--accent)] focus:bg-[var(--surface)] px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs sm:text-sm font-medium outline-none transition-all shadow-inner"
                      />
                    </div>

                    {/* [ 😊 ] Emoji Picker button */}
                    <motion.button
                      whileHover={{ scale: 1.06 }}
                      whileTap={{ scale: 0.94 }}
                      type="button"
                      onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                      className={`p-2 sm:p-2.5 rounded-2xl transition-all cursor-pointer shrink-0 ${
                        isEmojiPickerOpen
                          ? 'text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--accent)]/30'
                          : 'text-[var(--text-muted)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] border border-transparent hover:border-[var(--border-subtle)]'
                      }`}
                      title="Choose emoji"
                      aria-label="Choose emoji"
                    >
                      <Smile size={19} className="sm:w-5 sm:h-5" />
                    </motion.button>

                    {/* Dynamic Action Button: [ ✓ ] Save Edit OR [ ➤ ] Send OR [ 🎤 ] Voice Message */}
                    {editingMessage ? (
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="submit"
                        onMouseDown={(e) => {
                          e.preventDefault();
                        }}
                        className="btn-glass-blush p-2 sm:p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer shrink-0"
                        title="Save changes"
                        aria-label="Save changes"
                      >
                        <Check size={18} className="sm:w-[19px] sm:h-[19px]" />
                      </motion.button>
                    ) : inputText.trim() || stagedAttachments.length > 0 ? (
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="submit"
                        onMouseDown={(e) => {
                          // Prevent button click from stealing focus from the text input
                          e.preventDefault();
                        }}
                        className="btn-glass-blush p-2 sm:p-2.5 rounded-2xl transition-all shadow-sm cursor-pointer shrink-0"
                        title="Send message"
                        aria-label="Send message"
                      >
                        <Send size={18} className="sm:w-[19px] sm:h-[19px]" />
                      </motion.button>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.94 }}
                        type="button"
                        onClick={startRecording}
                        className="p-2 sm:p-2.5 rounded-2xl text-[var(--accent)] bg-[var(--surface-secondary)] border border-[var(--border-subtle)] hover:bg-[var(--surface-hover)] transition-all cursor-pointer shrink-0"
                        title="Record voice message"
                        aria-label="Record voice message"
                      >
                        <Mic size={19} className="sm:w-5 sm:h-5" />
                      </motion.button>
                    )}
                  </form>
                )}

                {/* Trust, E2EE & Personal Chat Responsibility Notice (Desktop only to maximize mobile chat height) */}
                <div className="hidden sm:flex items-center justify-between text-[10px] text-[var(--text-muted)] mt-1.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={11} className="text-emerald-500 shrink-0" />
                    <span>End-to-End Encrypted (AES-256-GCM)</span>
                  </div>
                  {onOpenTermsPolicy && (
                    <button
                      type="button"
                      onClick={() => onOpenTermsPolicy('ai-responsibility')}
                      className="hover:text-[var(--accent)] underline decoration-dotted underline-offset-2 transition-colors cursor-pointer"
                    >
                      Chat Responsibility & Terms
                    </button>
                  )}
                </div>
              </div>
            </footer>
          </section>
        </div>

        {/* Dynamic Persona Profile Details Modal (WhatsApp/Telegram contact info style) */}
        <PersonaProfileDetailsModal
          isOpen={isProfileDetailsOpen}
          onClose={() => {
            setIsProfileDetailsOpen(false);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          persona={activePersona}
          onEditPersona={(persona) => setEditingPersona(persona)}
        />

        {/* Edit Persona Modal */}
        <PersonaModal
          isOpen={!!editingPersona}
          onClose={() => {
            setEditingPersona(null);
            setTimeout(() => inputRef.current?.focus(), 100);
          }}
          personaToEdit={editingPersona}
        />

        {/* In-Chat Image Lightbox Modal */}
        <AnimatePresence>
          {previewImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPreviewImage(null)}
              className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
            >
              <div
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20 bg-black"
              >
                <img
                  src={previewImage}
                  alt="Full preview"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getSvgFallbackImage('Full Preview');
                  }}
                  className="w-full h-full max-h-[85vh] object-contain"
                />
                <button
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                  aria-label="Close image preview"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Telegram-style Message Context Menu */}
        <ChatMessageContextMenu
          isOpen={contextMenuState.isOpen}
          position={contextMenuState.position}
          message={contextMenuState.message}
          onClose={closeContextMenu}
          onReply={handleReplyAction}
          onEdit={handleEditAction}
          onDelete={handleDeleteAction}
          onCopy={handleCopyAction}
          onReact={(msg, emoji) => handleToggleReaction(msg.id, emoji)}
        />

        {/* Delete Message Confirmation Dialog */}
        <AnimatePresence>
          {messageToDelete && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMessageToDelete(null)}
                className="fixed inset-0 bg-[var(--overlay)] backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: 10 }}
                transition={{ type: 'spring', duration: 0.3, bounce: 0.2 }}
                className="relative w-full max-w-sm bg-[var(--surface)] backdrop-blur-2xl rounded-3xl p-6 overflow-hidden shadow-2xl border border-[var(--border)] z-10 text-[var(--text-primary)]"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2.5 bg-rose-500/15 border border-rose-500/25 rounded-2xl text-rose-500 shrink-0">
                    <Trash2 size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-[var(--text-primary)]">Delete message?</h3>
                    <p className="text-xs text-[var(--text-muted)]">This message will be removed from chat.</p>
                  </div>
                </div>

                <p className="text-xs text-[var(--text-secondary)] bg-[var(--surface-secondary)] p-3 rounded-xl border border-[var(--border-subtle)] truncate mb-4 italic">
                  "{messageToDelete.content || (messageToDelete.voiceMessage ? '🎙️ Voice message' : '📎 Attachment')}"
                </p>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageToDelete(null)}
                    className="flex-1 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--surface-secondary)] hover:bg-[var(--surface-hover)] text-xs font-bold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDeleteMessage}
                    className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/25 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Floating Toast Notification */}
        <AnimatePresence>
          {toastText && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.92 }}
              transition={{ duration: 0.15 }}
              className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full bg-[var(--surface-secondary)] border border-[var(--border)] shadow-xl text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 pointer-events-none backdrop-blur-md"
            >
              <Check size={14} className="text-emerald-500" />
              <span>{toastText}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
};

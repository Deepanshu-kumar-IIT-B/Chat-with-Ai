
import React, { useState, useEffect, useRef, useCallback, memo, useMemo } from 'react';
import { Message, ChatSession, UserProfile, AICharacter, MessageAttachment, AppDataExport, VisualEffect, ConversationPurpose } from './types';
import { geminiService } from './services/geminiService';
import { Button } from './components/Button';
import { 
  Send, 
  Plus, 
  Trash2, 
  Menu, 
  X, 
  User, 
  Sparkles, 
  Smile, 
  BrainCircuit, 
  Paperclip, 
  ArrowRight, 
  Mic, 
  Edit2, 
  Save, 
  PlusCircle, 
  MoreVertical, 
  Reply, 
  Copy, 
  Zap, 
  FileText, 
  Loader2,
  Heart,
  BookOpen,
  Rocket,
  MessageCircle,
  AlertCircle,
  Stars
} from 'lucide-react';

const DEFAULT_PERSONAS: AICharacter[] = [
  { id: 'p-1', name: 'Aura', age: 22, gender: 'Female', traits: ['Empathetic', 'Witty', 'Calm'] },
  { id: 'p-2', name: 'Leo', age: 26, gender: 'Male', traits: ['Adventurous', 'Direct', 'Knowledgeable'] },
  { id: 'p-3', name: 'Maya', age: 24, gender: 'Non-binary', traits: ['Creative', 'Deep-thinker', 'Playful'] }
];

const REACTION_OPTIONS = ['❤️', '👍', '🙌', '😂', '😮', '😢', '🔥', '🙏', '💯', '✨', '🤩', '🎉', '🤔', '👀', '✅'];

const PURPOSES: { value: ConversationPurpose; label: string; icon: React.ReactNode }[] = [
  { value: 'Casual Chat', label: 'Casual', icon: <MessageCircle size={18} /> },
  { value: 'Emotional Support', label: 'Support', icon: <Heart size={18} /> },
  { value: 'Study', label: 'Study', icon: <BookOpen size={18} /> },
  { value: 'Motivation', label: 'Growth', icon: <Rocket size={18} /> },
  { value: 'Deep Talk', label: 'Deep', icon: <Sparkles size={18} /> },
];

const EFFECT_GROUPS = [
  {
    name: 'Moods',
    effects: [
      { id: 'eff-1', name: 'Rain', type: 'weather', category: 'Atmosphere', className: 'effect-rain', emoji: '🌧️' },
      { id: 'eff-2', name: 'Sparkles', type: 'magic', category: 'Atmosphere', className: 'effect-sparkles', emoji: '✨' },
      { id: 'eff-3', name: 'Nature', type: 'nature', category: 'Atmosphere', className: 'effect-nature', emoji: '🌿' },
      { id: 'eff-4', name: 'Energy', type: 'energy', category: 'Atmosphere', className: 'effect-energy', emoji: '⚡' },
      { id: 'eff-5', name: 'Snow', type: 'weather', category: 'Atmosphere', className: 'effect-snow', emoji: '❄️' },
      { id: 'eff-6', name: 'Fire', type: 'energy', category: 'Atmosphere', className: 'effect-fire', emoji: '🔥' },
      { id: 'eff-7', name: 'Cosmic', type: 'magic', category: 'Atmosphere', className: 'effect-cosmic', emoji: '🌌' },
      { id: 'eff-8', name: 'Love', type: 'magic', category: 'Atmosphere', className: 'effect-love', emoji: '💖' },
    ]
  }
];

const PERSONA_GRADIENTS = [
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
  'from-emerald-400 to-teal-600',
  'from-blue-400 to-blue-600',
  'from-amber-400 to-amber-600',
  'from-violet-400 to-fuchsia-600',
];

const generateId = () => {
  try { return crypto.randomUUID(); } catch(e) { return Math.random().toString(36).substring(2, 15); }
};

const compressAndResize = (file: File): Promise<MessageAttachment> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 1024; 
        let width = img.width;
        let height = img.height;
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve({
          mimeType: 'image/jpeg',
          data: dataUrl.split(',')[1],
          fileName: file.name
        });
      };
      img.onerror = reject;
    };
    reader.onerror = reject;
  });
};

const AttachmentRenderer: React.FC<{ attachment: MessageAttachment, onMediaLoad?: () => void }> = memo(({ attachment, onMediaLoad }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const src = useMemo(() => attachment.data ? `data:${attachment.mimeType};base64,${attachment.data}` : null, [attachment.data, attachment.mimeType]);
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onMediaLoad?.();
  }, [onMediaLoad]);
  
  if (attachment.mimeType.startsWith('image/')) {
    return (
      <div className="relative media-container bg-slate-100 rounded-[2.5rem] overflow-hidden min-h-[200px] w-full max-w-[400px]">
        {(!isLoaded || !src) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        )}
        {src && (
          <img 
            src={src} 
            alt="Chat attachment" 
            loading="lazy"
            onLoad={handleLoad}
            className={`w-full h-auto object-cover transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'}`} 
          />
        )}
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-5 bg-indigo-50 rounded-[2.5rem] text-indigo-700 font-bold text-xs">
      <FileText size={20} /> 
      <span className="truncate">{attachment.fileName || 'File'}</span>
    </div>
  );
});

const MessageItem = memo(({ msg, isOwn, onContextMenu, onReact, replyToContent, onMediaLoad }: any) => {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  
  const handleReactionClick = (emoji: string) => {
    onReact(msg.id, emoji);
    setShowReactionPicker(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    onContextMenu(e, msg);
  };

  return (
    <div className={`flex flex-col animate-message-pop ${isOwn ? 'items-end' : 'items-start'} w-full group/msg`}>
      <div className="relative max-w-[85%] lg:max-w-[70%]" onContextMenu={handleContextMenu}>
        {replyToContent && (
          <div className="mb-2 text-[10px] flex items-center gap-2 text-slate-400 bg-slate-50/90 p-4 rounded-[2rem] border border-slate-100 max-w-full truncate backdrop-blur-sm">
            <Reply size={12} className="shrink-0" /> {replyToContent}
          </div>
        )}

        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`flex gap-1 mb-[-14px] relative z-20 ${isOwn ? 'justify-end pr-5' : 'justify-start pl-5'}`}>
            <div className="flex -space-x-1.5 bg-white/90 backdrop-blur-md border border-slate-100 shadow-xl rounded-full p-1.5 ring-4 ring-white">
              {msg.reactions.map((r: string, idx: number) => (
                <button 
                  key={idx} 
                  onClick={() => onReact(msg.id, r)}
                  className="w-7 h-7 flex items-center justify-center text-sm animate-message-pop hover:scale-125 transition-transform"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <div className={`absolute top-1/2 -translate-y-1/2 ${isOwn ? '-left-12' : '-right-12'} opacity-0 group-hover/msg:opacity-100 transition-all duration-300 z-10`}>
          <button 
            onClick={() => setShowReactionPicker(!showReactionPicker)}
            className="p-2.5 rounded-full bg-slate-50 border border-slate-100 text-slate-400 hover:text-indigo-600 hover:bg-white shadow-sm transition-all active:scale-90"
          >
            <Smile size={18} />
          </button>
          
          {showReactionPicker && (
            <div className={`absolute bottom-full mb-3 ${isOwn ? 'left-0' : 'right-0'} bg-white border border-slate-100 rounded-[2rem] shadow-4xl p-2 grid grid-cols-5 gap-1.5 animate-slide-up z-50 ring-1 ring-slate-200/50 w-[240px]`}>
              {REACTION_OPTIONS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReactionClick(emoji)}
                  className={`w-10 h-10 flex items-center justify-center hover:bg-indigo-50 rounded-2xl transition-all text-xl active:scale-125 ${msg.reactions?.includes(emoji) ? 'bg-indigo-50 ring-1 ring-indigo-100' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`px-7 py-5 rounded-[4rem] text-sm lg:text-base font-medium shadow-sm ring-1 ring-inset ${isOwn ? 'bg-indigo-600 text-white rounded-tr-[1.2rem] ring-indigo-500/10' : 'bg-slate-50 text-slate-800 border border-slate-100/50 rounded-tl-[1.2rem] ring-slate-100'}`}>
          {msg.attachment && <div className="mb-3"><AttachmentRenderer attachment={msg.attachment} onMediaLoad={onMediaLoad} /></div>}
          
          {msg.content ? (
            <p className="whitespace-pre-wrap break-words leading-relaxed animate-fade-in">{msg.content}</p>
          ) : (
            msg.status === 'sending' && !msg.attachment && (
              <div className="flex items-center gap-1.5 py-1 px-2">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot"></div>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 typing-dot"></div>
              </div>
            )
          )}
        </div>

        <span className={`text-[9px] mt-2 font-black uppercase tracking-wider text-slate-300 block px-4 ${isOwn ? 'text-right' : 'text-left'}`}>
          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </div>
  );
});

const PersonaCard = memo(({ persona, onStart, onEdit, onDelete, index }: { persona: AICharacter, onStart: (p: AICharacter) => void, onEdit: (p: AICharacter) => void, onDelete: (id: string) => void, index: number }) => {
  const gradient = PERSONA_GRADIENTS[index % PERSONA_GRADIENTS.length];
  
  return (
    <div 
      onClick={() => onStart(persona)}
      className="group relative bg-white border border-slate-100 rounded-[3rem] p-7 hover-lift cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden flex flex-col h-full min-h-[320px]"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.05] rounded-bl-[8rem] group-hover:scale-125 transition-transform duration-700`} />
      
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white group-hover:scale-110 transition-transform duration-500`}>
          {persona.name[0]}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(persona); }} 
            className="w-10 h-10 bg-slate-50/80 backdrop-blur-sm text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 transition-all active:scale-90 border border-slate-100"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(persona.id); }} 
            className="w-10 h-10 bg-slate-50/80 backdrop-blur-sm text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 border border-slate-100"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-3xl font-black text-slate-900 mb-0.5 tracking-tight group-hover:text-indigo-600 transition-colors">{persona.name}</h3>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
          {persona.gender} <span className="w-1 h-1 bg-slate-200 rounded-full" /> AGE {persona.age}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {persona.traits.map((trait, i) => (
            <span 
              key={i} 
              className="px-4 py-1.5 bg-slate-50 text-[9px] font-black text-slate-500 rounded-full uppercase tracking-wider border border-slate-100 group-hover:border-indigo-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all shadow-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-50 flex items-center justify-between text-indigo-600 font-black text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 relative z-10">
        <span>Start Chatting</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const [isAwaitingStart, setIsAwaitingStart] = useState(true);
  const [isPersonaGalleryOpen, setIsPersonaGalleryOpen] = useState(false);
  const [isAISetupOpen, setIsAISetupOpen] = useState(false);
  const [isEffectsGalleryOpen, setIsEffectsGalleryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [savedPersonas, setSavedPersonas] = useState<AICharacter[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [activeEffect, setActiveEffect] = useState<VisualEffect | null>(null);
  const [messageContextMenu, setMessageContextMenu] = useState<{ x: number, y: number, message: Message } | null>(null);
  const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [profileForm, setProfileForm] = useState<UserProfile>({ name: 'Guest', age: '25', gender: 'Secret', purpose: 'Casual Chat' });
  const [aiSetupForm, setAiSetupForm] = useState({ id: '', name: '', age: '22', gender: 'Female', traits: '' });
  
  const isHydrated = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
  const activeAICharacter = useMemo(() => currentSession?.aiCharacter || savedPersonas[0] || DEFAULT_PERSONAS[0], [currentSession, savedPersonas]);

  useEffect(() => {
    const savedSessions = localStorage.getItem('aura_sessions');
    const savedProfile = localStorage.getItem('aura_profile');
    const savedPersonasData = localStorage.getItem('aura_personas');
    const hasStarted = localStorage.getItem('aura_started');
    
    if (hasStarted === 'true') setIsAwaitingStart(false);
    
    if (savedPersonasData) {
      try { 
        const parsed = JSON.parse(savedPersonasData);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) setSavedPersonas(parsed);
        else setSavedPersonas(DEFAULT_PERSONAS);
      } catch (e) { setSavedPersonas(DEFAULT_PERSONAS); }
    } else setSavedPersonas(DEFAULT_PERSONAS);

    if (savedSessions) {
      try {
        const revived = JSON.parse(savedSessions).map((s: any) => ({ 
          ...s, 
          lastInteraction: new Date(s.lastInteraction), 
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) 
        }));
        setSessions(revived);
        if (revived.length > 0) setCurrentSessionId(revived[revived.length - 1].id);
      } catch (e) {}
    }

    if (savedProfile) { 
      try { 
        const parsed = JSON.parse(savedProfile); 
        setUserProfile(parsed); 
        setProfileForm(parsed); 
      } catch (e) {} 
    }

    isHydrated.current = true;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.onresult = (event: any) => { 
        let transcript = ''; 
        for (let i = event.resultIndex; i < event.results.length; i++) transcript += event.results[i][0].transcript; 
        setInputValue(prev => prev + transcript); 
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setIsEmojiPickerOpen(false);
      }
      if (messageContextMenu && contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setMessageContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [messageContextMenu]);

  useEffect(() => { if (isHydrated.current) localStorage.setItem('aura_sessions', JSON.stringify(sessions)); }, [sessions]);
  useEffect(() => { if (isHydrated.current) localStorage.setItem('aura_personas', JSON.stringify(savedPersonas)); }, [savedPersonas]);
  useEffect(() => { if (isHydrated.current && userProfile) localStorage.setItem('aura_profile', JSON.stringify(userProfile)); }, [userProfile]);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollContainerRef.current) {
      const { scrollHeight, clientHeight } = scrollContainerRef.current;
      scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior });
    }
  }, []);

  useEffect(() => {
    if (!scrollContainerRef.current) return;
    const observer = new ResizeObserver(() => {
        scrollToBottom('auto');
    });
    observer.observe(scrollContainerRef.current);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  useEffect(() => {
    if (currentSession?.messages.length) {
      scrollToBottom();
    }
  }, [currentSession?.messages.length, scrollToBottom]);

  const handleSendMessage = async (textOverride?: string, attachmentOverride?: MessageAttachment) => {
    const text = textOverride || inputValue; 
    const attachment = attachmentOverride || selectedAttachment;
    if ((!text.trim() && !attachment) || isLoading || !currentSessionId) return;
    
    const sessionId = currentSessionId;
    const userMsg: Message = { 
      id: generateId(), 
      role: 'user', 
      content: text, 
      timestamp: new Date(), 
      attachment: attachment || undefined, 
      status: 'sent',
      replyToId: replyingToMessage?.id,
      reactions: []
    };

    const aiMsgId = generateId();
    const aiPlaceholder: Message = {
      id: aiMsgId,
      role: 'model',
      content: '',
      timestamp: new Date(),
      status: 'sending',
      reactions: []
    };

    setSessions(prev => prev.map(s => s.id === sessionId ? { 
      ...s, 
      messages: [...s.messages, userMsg, aiPlaceholder], 
      lastInteraction: new Date() 
    } : s));

    setInputValue(''); 
    setSelectedAttachment(null); 
    setReplyingToMessage(null); 
    setIsEmojiPickerOpen(false);
    setIsLoading(true); 

    try {
      const historyForAI = [...(currentSession?.messages || []), userMsg];
      await geminiService.streamMessage(
        historyForAI, "", userProfile, activeAICharacter, null, 
        (chunk) => {
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m)
          } : s));
        },
        async (generatedFile) => { 
          setSessions(prev => prev.map(s => s.id === sessionId ? {
            ...s,
            messages: s.messages.map(m => m.id === aiMsgId ? { ...m, attachment: generatedFile } : m)
          } : s));
        }
      );
      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, status: 'read' } : m)
      } : s));
    } catch (error: any) {
      const errStr = String(error).toLowerCase();
      const isQuota = errStr.includes("429") || errStr.includes("quota") || errStr.includes("exhausted");
      
      const errorMessage = isQuota 
        ? "Yaar, main thoda thak gayi hoon, bohot log baat kar rahe hain. 1-2 minute baad try karo please? ❤️" 
        : "Network error! Phir se try karo please.";

      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: errorMessage, status: 'sent' } : m)
      } : s));
    } finally { 
      setIsLoading(false); 
      setTimeout(scrollToBottom, 100);
    }
  };

  const handleReactToMessage = useCallback((messageId: string, emoji: string) => {
    setSessions(prev => prev.map(s => s.id === currentSessionId ? {
      ...s,
      messages: s.messages.map(m => {
        if (m.id === messageId) {
          const currentReactions = m.reactions || [];
          return { ...m, reactions: currentReactions.includes(emoji) ? currentReactions.filter(r => r !== emoji) : [...currentReactions, emoji] };
        }
        return m;
      })
    } : s));
  }, [currentSessionId]);

  const handleActionReply = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (messageContextMenu) {
      setReplyingToMessage(messageContextMenu.message);
      setMessageContextMenu(null);
      textareaRef.current?.focus();
    }
  };

  const handleActionCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (messageContextMenu) {
      navigator.clipboard.writeText(messageContextMenu.message.content);
      setMessageContextMenu(null);
    }
  };

  const handleActionDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (messageContextMenu && currentSessionId) {
      const targetId = messageContextMenu.message.id;
      setSessions(prev => prev.map(s => 
        s.id === currentSessionId 
          ? { ...s, messages: s.messages.filter(m => m.id !== targetId) } 
          : s
      ));
      setMessageContextMenu(null);
    }
  };

  const startNewChatFromPersona = async (persona: AICharacter) => {
    const newSession: ChatSession = { id: generateId(), title: persona.name + ' Session', messages: [], lastInteraction: new Date(), aiCharacter: persona, isPinned: false };
    setSessions(prev => [...prev, newSession]); 
    setCurrentSessionId(newSession.id); 
    setIsPersonaGalleryOpen(false); 
    setIsAwaitingStart(false); 
    localStorage.setItem('aura_started', 'true');
  };

  const openPersonaEdit = (p: AICharacter) => {
    setAiSetupForm({ id: p.id, name: p.name, age: p.age.toString(), gender: p.gender, traits: p.traits.join(', ') });
    setIsPersonaGalleryOpen(false);
    setIsAISetupOpen(true);
  };

  const deletePersona = (id: string) => {
    if (confirm(`Are you sure you want to delete this persona?`)) {
      setSavedPersonas(prev => prev.filter(x => x.id !== id));
    }
  };

  const handleSavePersona = (e: React.FormEvent) => {
    e.preventDefault();
    const traitsArr = aiSetupForm.traits.split(',').map(t => t.trim()).filter(t => t !== '');
    const newPersona: AICharacter = {
      id: aiSetupForm.id || generateId(),
      name: aiSetupForm.name,
      age: parseInt(aiSetupForm.age) || 22,
      gender: aiSetupForm.gender,
      traits: traitsArr
    };

    if (aiSetupForm.id) {
      setSavedPersonas(prev => prev.map(p => p.id === aiSetupForm.id ? newPersona : p));
      setSessions(prev => prev.map(s => s.aiCharacter.id === aiSetupForm.id ? { ...s, aiCharacter: newPersona } : s));
    } else {
      setSavedPersonas(prev => [...prev, newPersona]);
    }

    setIsAISetupOpen(false);
    setIsPersonaGalleryOpen(true);
  };

  return (
    <div className={`flex h-full w-full bg-white text-slate-900 overflow-hidden relative ${activeEffect?.className || ''}`}>
      {activeEffect && <div className="fixed inset-0 pointer-events-none z-[40]"><div className={`effect-overlay effect-overlay-${activeEffect.id}`}></div></div>}

      {isAwaitingStart ? (
        <div className="h-full w-full flex flex-col items-center justify-center bg-white px-6 text-center animate-fade-in relative">
          <div className="absolute inset-0 opacity-10 flex items-center justify-center overflow-hidden pointer-events-none"><Sparkles size={400} className="text-indigo-600 animate-pulse" /></div>
          <div className="p-10 bg-indigo-50 rounded-[4rem] mb-12 shadow-2xl shadow-indigo-100/50 relative z-10"><BrainCircuit size={80} className="text-indigo-600" /></div>
          <h1 className="text-5xl md:text-6xl font-black text-slate-900 mb-6 tracking-tighter relative z-10">Aura Companion</h1>
          <p className="text-slate-500 text-xl mb-12 max-w-sm font-medium relative z-10">Emotional AI friend jo aapko bilkul humans ki tarah samajhti hai.</p>
          <Button onClick={() => setIsPersonaGalleryOpen(true)} className="h-20 px-12 rounded-[2.5rem] bg-slate-900 text-white font-black text-2xl flex items-center gap-6 hover-glow active:scale-95 shadow-2xl relative z-10"><Sparkles size={28} /><span>Talk to Aura</span><ArrowRight size={28} /></Button>
        </div>
      ) : (
        <>
          <aside className={`fixed lg:static z-[100] inset-y-0 left-0 w-[280px] sm:w-80 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 transform-gpu pt-safe ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-8 flex items-center justify-between">
              <div className="flex items-center gap-3 font-black text-3xl text-indigo-600 tracking-tighter"><Sparkles size={28} fill="currentColor" className="animate-float" /><span>Aura</span></div>
              <button className="lg:hidden p-3 text-slate-400 hover:bg-slate-50 rounded-2xl" onClick={() => setIsSidebarOpen(false)}><X size={28} /></button>
            </div>
            <div className="px-6 mb-8"><Button className="w-full h-16 rounded-[1.5rem] bg-slate-900 text-white font-black text-xs tracking-widest gap-4 shadow-xl" onClick={() => setIsPersonaGalleryOpen(true)}><Plus size={20} /> NEW CHAT</Button></div>
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-2">
              {sessions.map(s => (
                <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }} className={`group px-5 py-5 rounded-[2rem] cursor-pointer flex items-center gap-5 transition-all ${currentSessionId === s.id ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}>
                  <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center font-black text-sm ${currentSessionId === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100'}`}>{s.aiCharacter.name[0]}</div>
                  <div className="flex-1 min-w-0 text-sm font-black truncate uppercase tracking-[0.05em]">{s.title}</div>
                  <button onClick={(e) => { e.stopPropagation(); setSessions(prev => prev.filter(x => x.id !== s.id)); if (currentSessionId === s.id) setCurrentSessionId(null); }} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <div onClick={() => setIsProfileModalOpen(true)} className="m-6 p-5 rounded-[2.2rem] bg-slate-50/80 border border-slate-100 flex items-center gap-5 cursor-pointer hover:bg-indigo-50 transition-all active:scale-95 group">
              <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm group-hover:scale-110 transition-transform"><User size={24} /></div>
              <div className="flex-1 min-w-0 font-black text-base text-slate-900 truncate">{userProfile?.name || "Profile"}</div>
            </div>
          </aside>

          <main className="flex-1 flex flex-col relative bg-white min-w-0 pt-safe">
            <header className="h-20 shrink-0 border-b border-slate-50 flex items-center px-6 justify-between bg-white/90 backdrop-blur-xl z-[90]">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu size={28} /></button>
                <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">{activeAICharacter.name[0]}</div>
                <div className="flex flex-col"><h2 className="font-black text-lg text-slate-900 leading-none">{activeAICharacter.name}</h2><div className="flex items-center gap-2 mt-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div><span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Active</span></div></div>
              </div>
              <div className="flex items-center gap-3">
                 <button onClick={() => setIsEffectsGalleryOpen(true)} className={`p-3 rounded-2xl transition-all ${activeEffect ? 'text-indigo-600 bg-indigo-50 shadow-sm' : 'text-slate-400 hover:text-indigo-600'}`}><Zap size={24} /></button>
                 <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 transition-all relative">
                    <MoreVertical size={24} />
                    {isHeaderMenuOpen && (
                      <div className="absolute top-full right-0 mt-3 w-56 bg-white border border-slate-100 rounded-[1.5rem] shadow-4xl py-2 z-[200] animate-slide-up">
                        <button onClick={() => { const data: AppDataExport = { sessions, savedPersonas, userProfile }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `aura-export-${new Date().getTime()}.json`; a.click(); setIsHeaderMenuOpen(false); }} className="w-full px-5 py-4 flex items-center gap-4 text-slate-600 text-xs font-black uppercase tracking-widest hover:bg-indigo-50"><Save size={18} /> Export Data</button>
                      </div>
                    )}
                 </button>
              </div>
            </header>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar bg-white" style={{ contain: 'layout' }}>
              <div className="max-w-4xl mx-auto flex flex-col space-y-10 lg:px-12">
                {currentSession?.messages.map((msg) => (
                  <MessageItem key={msg.id} msg={msg} isOwn={msg.role === 'user'} onContextMenu={(e: React.MouseEvent, m: Message) => setMessageContextMenu({ x: e.clientX, y: e.clientY, message: m })} onReact={handleReactToMessage} replyToContent={msg.replyToId ? currentSession.messages.find(m => m.id === msg.replyToId)?.content : null} onMediaLoad={() => scrollToBottom('auto')} />
                ))}
                <div className="h-8 w-full shrink-0" />
              </div>
            </div>

            <div className="shrink-0 p-4 lg:p-6 bg-white border-t border-slate-50 z-[100] pb-safe">
              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                {replyingToMessage && (
                  <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-[2.5rem] border border-indigo-100 animate-slide-up shadow-sm">
                    <div className="min-w-0 pr-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Replying to {replyingToMessage.role === 'model' ? activeAICharacter.name : 'You'}</p><p className="text-sm text-indigo-900 font-medium truncate italic opacity-80">"{replyingToMessage.content}"</p></div>
                    <button onClick={() => setReplyingToMessage(null)} className="p-2 text-indigo-400 hover:text-indigo-600 bg-white rounded-full shadow-sm active:scale-90"><X size={16} /></button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex-none">
                    <button onClick={() => fileInputRef.current?.click()} className="h-14 w-14 lg:h-16 lg:w-16 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-white border border-slate-100 active:scale-90 transition-all shadow-sm"><Paperclip size={26} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) compressAndResize(file).then(setSelectedAttachment); }} accept="image/*,audio/*" />
                  </div>
                  <div className="flex-1 flex items-center bg-slate-50 border border-slate-100 rounded-[2.5rem] px-5 shadow-inner focus-within:bg-white focus-within:ring-2 focus-within:ring-indigo-100 transition-all min-h-[56px] lg:min-h-[64px]">
                    <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className={`mr-3 transition-colors ${isEmojiPickerOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}><Smile size={24} /></button>
                    <textarea ref={textareaRef} rows={1} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Talk to Aura..." className="w-full bg-transparent py-4 text-base font-bold text-slate-950 outline-none resize-none max-h-32 custom-scrollbar" />
                  </div>
                  <div className="flex-none"><button onClick={() => { if (!recognitionRef.current) return; if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); } else { recognitionRef.current.start(); setIsRecording(true); } }} className={`h-14 w-14 lg:h-16 lg:w-16 flex items-center justify-center rounded-full transition-all border ${isRecording ? 'bg-red-50 text-red-600 animate-pulse border-red-200 ring-4 ring-red-50' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 border-slate-100 shadow-sm'}`}><Mic size={26} /></button></div>
                  <div className="flex-none"><button onClick={() => handleSendMessage()} disabled={(!inputValue.trim() && !selectedAttachment) || isLoading} className={`h-14 w-14 lg:h-16 lg:w-16 flex items-center justify-center rounded-full transition-all shadow-xl ${ (inputValue.trim() || selectedAttachment) && !isLoading ? 'bg-indigo-600 text-white active:scale-95' : 'bg-slate-100 text-slate-300' }`}><Send size={26} fill="currentColor" /></button></div>
                </div>
              </div>
            </div>
          </main>
        </>
      )}

      {messageContextMenu && (
        <div 
          ref={contextMenuRef}
          onMouseDown={(e) => e.stopPropagation()}
          className="fixed z-[3000] bg-white border border-slate-100 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-3 w-64 animate-slide-up backdrop-blur-xl bg-white/95" 
          style={{ 
            left: Math.min(messageContextMenu.x, window.innerWidth - 270), 
            top: Math.min(messageContextMenu.y, window.innerHeight - 250) 
          }}
        >
          <button onClick={handleActionReply} className="w-full px-6 py-5 flex items-center gap-4 text-slate-700 hover:bg-indigo-50 text-sm font-black uppercase tracking-widest transition-colors"><Reply size={20} className="text-indigo-500" /> Reply</button>
          <button onClick={handleActionCopy} className="w-full px-6 py-5 flex items-center gap-4 text-slate-700 hover:bg-indigo-50 text-sm font-black uppercase tracking-widest transition-colors"><Copy size={20} className="text-indigo-500" /> Copy Text</button>
          <div className="h-[1px] bg-slate-100 mx-5 my-2" />
          <button onClick={handleActionDelete} className="w-full px-6 py-5 flex items-center gap-4 text-red-500 hover:bg-red-50 text-sm font-black uppercase tracking-widest transition-colors">
            <Trash2 size={20} className="text-red-500" /> Delete
          </button>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[1800] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[4rem] shadow-4xl p-10 lg:p-14 animate-slide-up border border-slate-100 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-10"><h2 className="text-4xl font-black text-slate-900 tracking-tighter">Your Profile</h2><button onClick={() => setIsProfileModalOpen(false)} className="p-4 bg-slate-50 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><X size={24} /></button></div>
            <div className="space-y-10">
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Identification</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div className="relative"><input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-8 py-6 font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Full Name" /><User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} /></div><input type="number" className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-8 py-6 font-bold text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} placeholder="Age" /></div></div>
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Identity</p><div className="flex gap-4">{['Female', 'Male', 'Secret'].map(g => (<button key={g} onClick={() => setProfileForm({...profileForm, gender: g})} className={`flex-1 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${profileForm.gender === g ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 text-slate-400 border border-slate-100 hover:bg-white hover:text-indigo-600'}`}>{g}</button>))}</div></div>
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Goal</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{PURPOSES.map(p => (<button key={p.value} onClick={() => setProfileForm({...profileForm, purpose: p.value})} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all ${profileForm.purpose === p.value ? 'bg-white border-indigo-600 text-indigo-600 shadow-xl' : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-white hover:text-indigo-400'}`}><div className={`mb-3 transition-transform ${profileForm.purpose === p.value ? 'scale-125' : ''}`}>{p.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span></button>))}</div></div>
              <Button className="w-full h-22 rounded-[2.5rem] font-black text-2xl bg-slate-900 text-white shadow-2xl uppercase tracking-tighter" onClick={() => { setUserProfile(profileForm); setIsProfileModalOpen(false); }}>SAVE IDENTITY</Button>
            </div>
          </div>
        </div>
      )}

      {isEffectsGalleryOpen && (
        <div className="fixed inset-0 z-[1700] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md" onClick={() => setIsEffectsGalleryOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[4rem] shadow-4xl animate-slide-up flex flex-col max-h-[80vh] overflow-hidden border border-slate-100">
             <div className="p-10 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white shrink-0"><h2 className="text-3xl font-black text-slate-900 tracking-tighter">Atmosphere</h2><button onClick={() => setIsEffectsGalleryOpen(false)} className="p-4 bg-slate-100 text-slate-500 rounded-[1.5rem] active:scale-90"><X size={28} /></button></div>
             <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-8">
               {EFFECT_GROUPS[0]?.effects?.map(eff => (
                 <button key={eff.id} onClick={() => { setActiveEffect(eff as VisualEffect); setIsEffectsGalleryOpen(false); }} className={`flex flex-col items-center p-10 rounded-[3rem] border-2 transition-all group ${activeEffect?.id === eff.id ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-700 hover:bg-white hover:border-indigo-100'}`}><span className="text-5xl mb-6 group-hover:scale-110 transition-transform">{eff.emoji}</span><span className="text-[11px] font-black uppercase tracking-widest">{eff.name}</span></button>
               ))}
               {activeEffect && <button onClick={() => { setActiveEffect(null); setIsEffectsGalleryOpen(false); }} className="col-span-full py-6 mt-4 bg-red-50 text-red-600 rounded-[2rem] font-black text-lg uppercase tracking-widest active:scale-95">Reset Atmosphere</button>}
             </div>
          </div>
        </div>
      )}

      {isPersonaGalleryOpen && (
        <div className="fixed inset-0 z-[1500] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsPersonaGalleryOpen(false)} />
          <div className="relative bg-white w-full max-w-4xl rounded-[3.5rem] shadow-4xl animate-slide-up overflow-hidden flex flex-col max-h-[85vh] border border-slate-100">
            <div className="p-8 lg:p-10 border-b border-slate-50 flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 bg-white/80 backdrop-blur-xl z-20">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <Stars className="text-indigo-600" size={32} />
                  <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Inner Circle</h2>
                </div>
                <p className="text-slate-400 font-semibold text-xs tracking-tight">Select an identity to start your journey.</p>
              </div>
              
              <div className="flex items-center gap-4 mt-6 sm:mt-0">
                <button 
                  onClick={() => { setAiSetupForm({ id: '', name: '', age: '22', gender: 'Female', traits: '' }); setIsAISetupOpen(true); setIsPersonaGalleryOpen(false); }} 
                  className="h-14 bg-slate-900 text-white px-8 rounded-full flex items-center gap-3 font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  <Plus size={18} /> New Identity
                </button>
                <button onClick={() => setIsPersonaGalleryOpen(false)} className="w-14 h-14 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all active:scale-90 border border-slate-100">
                  <X size={24} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 lg:p-10 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8 bg-slate-50/10">
              {savedPersonas.map((p, idx) => (
                <div key={p.id}>
                  <PersonaCard 
                    persona={p} 
                    index={idx}
                    onStart={startNewChatFromPersona}
                    onEdit={openPersonaEdit}
                    onDelete={deletePersona}
                  />
                </div>
              ))}
              
              <div 
                onClick={() => { setAiSetupForm({ id: '', name: '', age: '22', gender: 'Female', traits: '' }); setIsAISetupOpen(true); setIsPersonaGalleryOpen(false); }}
                className="group border-4 border-dashed border-slate-100 rounded-[3rem] p-8 flex flex-col items-center justify-center gap-6 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all duration-300 min-h-[320px] h-full"
              >
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-300 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-500 border-2 border-slate-50">
                  <PlusCircle size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-400 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Create New</h3>
                  <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em] mt-1">Add a custom identity</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAISetupOpen && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsAISetupOpen(false)} />
          <div className="relative bg-white w-full max-w-xl rounded-[4rem] shadow-4xl p-12 animate-slide-up border border-slate-100">
             <h2 className="text-4xl font-black text-slate-900 mb-10 text-center tracking-tighter">{aiSetupForm.id ? 'Refine Identity' : 'New Identity'}</h2>
             <form onSubmit={handleSavePersona} className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Name</p>
                  <input type="text" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-6 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" placeholder="e.g. Aura" value={aiSetupForm.name} onChange={e => setAiSetupForm({...aiSetupForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Age</p>
                    <input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-6 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" placeholder="22" value={aiSetupForm.age} onChange={e => setAiSetupForm({...aiSetupForm, age: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Gender</p>
                    <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-6 font-bold outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner appearance-none" value={aiSetupForm.gender} onChange={e => setAiSetupForm({...aiSetupForm, gender: e.target.value})}><option>Female</option><option>Male</option><option>Non-binary</option></select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Traits (comma separated)</p>
                  <textarea rows={3} className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] px-10 py-6 font-bold resize-none outline-none focus:border-indigo-600 focus:bg-white transition-all shadow-inner" placeholder="Witty, Empathetic, Creative..." value={aiSetupForm.traits} onChange={e => setAiSetupForm({...aiSetupForm, traits: e.target.value})} />
                </div>
                <Button type="submit" className="w-full h-22 rounded-[2.5rem] font-black text-2xl bg-slate-900 text-white shadow-2xl uppercase tracking-tighter">CONFIRM IDENTITY</Button>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

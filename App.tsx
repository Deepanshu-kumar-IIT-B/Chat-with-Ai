
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
  CheckCircle2,
  Home,
  Moon,
  Sun,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Download
} from 'lucide-react';

const DEFAULT_PERSONAS: AICharacter[] = [
  { id: 'p-1', name: 'Aura', age: 22, gender: 'Female', traits: ['Empathetic', 'Witty', 'Calm'] },
  { id: 'p-2', name: 'Leo', age: 26, gender: 'Male', traits: ['Adventurous', 'Direct', 'Knowledgeable'] },
  { id: 'p-3', name: 'Maya', age: 24, gender: 'Non-binary', traits: ['Creative', 'Deep-thinker', 'Playful'] }
];

const FULL_EMOJI_LIST = [
  { cat: 'Smileys', icons: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖'] },
  { cat: 'Hearts', icons: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟'] },
  { cat: 'Hands', icons: ['👋', '🤚', '🖐', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏'] },
  { cat: 'Symbols', icons: ['✨', '🌟', '⭐', '🔥', '💥', '🌈', '☀️', '☁️', '❄️', '🌊', '🍀', '🌸', '🎈', '🎉', '🎊', '🎁', '💎', '💡', '💯', '✅', '❌', '⚠️'] }
];

const REACTION_OPTIONS = ['❤️', '👍', '🙌', '😂', '😮', '🔥', '💯', '✨'];

const PERSONA_GRADIENTS = [
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
  'from-emerald-400 to-teal-600',
  'from-blue-400 to-blue-600',
  'from-amber-400 to-amber-600',
  'from-violet-400 to-fuchsia-600',
];

const PURPOSES: { value: ConversationPurpose; label: string; icon: React.ReactNode }[] = [
  { value: 'Casual Chat', label: 'Casual', icon: <Smile size={24} /> },
  { value: 'Emotional Support', label: 'Support', icon: <Heart size={24} /> },
  { value: 'Study', label: 'Study', icon: <BookOpen size={24} /> },
  { value: 'Motivation', label: 'Focus', icon: <Rocket size={24} /> },
  { value: 'Deep Talk', label: 'Deep', icon: <BrainCircuit size={24} /> }
];

const EFFECT_GROUPS = [
  {
    category: 'Vibes',
    effects: [
      { id: 'sparkle', name: 'Sparkle', type: 'magic', category: 'Magic', className: 'effect-sparkle', emoji: '✨' },
      { id: 'rain', name: 'Rain', type: 'weather', category: 'Nature', className: 'effect-rain', emoji: '🌧️' },
      { id: 'fire', name: 'Fire', type: 'energy', category: 'Energy', className: 'effect-fire', emoji: '🔥' },
      { id: 'snow', name: 'Snow', type: 'weather', category: 'Nature', className: 'effect-snow', emoji: '❄️' },
      { id: 'stars', name: 'Stars', type: 'cinematic', category: 'Cosmic', className: 'effect-stars', emoji: '⭐' },
      { id: 'neon', name: 'Neon', type: 'energy', category: 'Energy', className: 'effect-neon', emoji: '🌈' },
      { id: 'confetti', name: 'Party', type: 'festive', category: 'Festive', className: 'effect-confetti', emoji: '🎉' },
      { id: 'nature', name: 'Zen', type: 'nature', category: 'Nature', className: 'effect-nature', emoji: '🍃' },
    ]
  }
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
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
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

const AttachmentRenderer: React.FC<{ 
  attachment: MessageAttachment, 
  onMediaLoad?: () => void,
  onImageClick?: (url: string) => void
}> = memo(({ attachment, onMediaLoad, onImageClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const src = useMemo(() => attachment.data ? (attachment.data.startsWith('http') ? attachment.data : `data:${attachment.mimeType};base64,${attachment.data}`) : null, [attachment.data, attachment.mimeType]);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onMediaLoad?.();
  }, [onMediaLoad]);
  
  if (attachment.mimeType.startsWith('image/')) {
    return (
      <div 
        className="relative media-container bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] overflow-hidden min-h-[160px] w-full max-w-[400px] cursor-pointer hover:brightness-95 transition-all"
        onClick={() => src && onImageClick?.(src)}
      >
        {(!isLoaded || !src) && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-50 dark:bg-slate-800">
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
        <div className="absolute bottom-4 right-4 bg-black/30 backdrop-blur-md p-2 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 size={16} />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 p-5 bg-indigo-50 dark:bg-indigo-900/30 rounded-[2.5rem] text-indigo-700 dark:text-indigo-300 font-bold text-xs">
      <FileText size={20} /> 
      <span className="truncate">{attachment.fileName || 'File'}</span>
    </div>
  );
});

const MessageItem = memo(({ msg, isOwn, onContextMenu, onReact, replyToContent, onMediaLoad, onImageClick }: any) => {
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
          <div className="mb-2 text-[10px] flex items-center gap-2 text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/80 p-4 rounded-[2rem] border border-slate-100 dark:border-slate-700 max-w-full truncate backdrop-blur-sm">
            <Reply size={12} className="shrink-0" /> {replyToContent}
          </div>
        )}

        {msg.reactions && msg.reactions.length > 0 && (
          <div className={`flex gap-1 mb-[-14px] relative z-20 ${isOwn ? 'justify-end pr-5' : 'justify-start pl-5'}`}>
            <div className="flex -space-x-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md border border-slate-100 dark:border-slate-700 shadow-xl rounded-full p-1.5 ring-4 ring-white dark:ring-slate-950">
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
            className="p-2.5 rounded-full bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-700 shadow-sm transition-all active:scale-90"
          >
            <Smile size={18} />
          </button>
          
          {showReactionPicker && (
            <div className={`absolute bottom-full mb-3 ${isOwn ? 'left-0' : 'right-0'} bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2rem] shadow-4xl p-2 flex gap-1.5 animate-slide-up z-50 ring-1 ring-slate-200/50 dark:ring-slate-700/50`}>
              {REACTION_OPTIONS.map(emoji => (
                <button 
                  key={emoji} 
                  onClick={() => handleReactionClick(emoji)}
                  className={`w-10 h-10 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all text-xl active:scale-125 ${msg.reactions?.includes(emoji) ? 'bg-indigo-50 dark:bg-indigo-900/30 ring-1 ring-indigo-100 dark:ring-indigo-700' : ''}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`px-7 py-5 rounded-[4rem] text-sm lg:text-base font-medium shadow-sm ring-1 ring-inset ${isOwn ? 'bg-indigo-600 text-white rounded-tr-[1.2rem] ring-indigo-500/10' : 'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-100/50 dark:border-slate-700/50 rounded-tl-[1.2rem] ring-slate-100 dark:ring-slate-800'}`}>
          {msg.attachment && <div className="mb-3"><AttachmentRenderer attachment={msg.attachment} onMediaLoad={onMediaLoad} onImageClick={onImageClick} /></div>}
          
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

        <span className={`text-[9px] mt-2 font-black uppercase tracking-wider text-slate-300 dark:text-slate-600 block px-4 ${isOwn ? 'text-right' : 'text-left'}`}>
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
      className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[3rem] p-7 hover-lift cursor-pointer shadow-sm hover:shadow-xl dark:hover:shadow-indigo-500/10 transition-all duration-500 overflow-hidden flex flex-col h-full min-h-[320px]"
    >
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.05] dark:opacity-[0.1] rounded-bl-[8rem] group-hover:scale-125 transition-transform duration-700`} />
      
      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-full flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-white dark:ring-slate-900 group-hover:scale-110 transition-transform duration-500`}>
          {persona.name[0]}
        </div>
        
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(persona); }} 
            className="w-10 h-10 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-400 rounded-2xl flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:text-indigo-600 dark:hover:text-indigo-300 transition-all active:scale-90 border border-slate-100 dark:border-slate-700"
          >
            <Edit2 size={16} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(persona.id); }} 
            className="w-10 h-10 bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-sm text-slate-400 rounded-2xl flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-500 dark:hover:text-red-300 transition-all active:scale-90 border border-slate-100 dark:border-slate-700"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 relative z-10">
        <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-0.5 tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{persona.name}</h3>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.15em] mb-6 flex items-center gap-2">
          {persona.gender} <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" /> AGE {persona.age}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {persona.traits.map((trait, i) => (
            <span 
              key={i} 
              className="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 rounded-full uppercase tracking-wider border border-slate-100 dark:border-slate-700 group-hover:border-indigo-100 dark:group-hover:border-indigo-800 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-all shadow-sm"
            >
              {trait}
            </span>
          ))}
        </div>
      </div>

      <div className="pt-5 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between text-indigo-600 dark:text-indigo-400 font-black text-[11px] uppercase tracking-widest opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 relative z-10">
        <span>Start Chatting</span>
        <ArrowRight size={16} />
      </div>
    </div>
  );
});

const App: React.FC = () => {
  const [isAwaitingStart, setIsAwaitingStart] = useState(true);
  const [isAISetupOpen, setIsAISetupOpen] = useState(false);
  const [isEffectsGalleryOpen, setIsEffectsGalleryOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isHeaderMenuOpen, setIsHeaderMenuOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('aura_dark_mode');
    return saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);
  
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [savedPersonas, setSavedPersonas] = useState<AICharacter[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [personaToDelete, setPersonaToDelete] = useState<string | null>(null);
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
  
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);

  const isHydrated = useRef(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const inactivityTimerRef = useRef<any>(null);
  const lastSaveRef = useRef<number>(Date.now());

  const currentSession = useMemo(() => sessions.find(s => s.id === currentSessionId), [sessions, currentSessionId]);
  const activeAICharacter = useMemo(() => currentSession?.aiCharacter || savedPersonas[0] || DEFAULT_PERSONAS[0], [currentSession, savedPersonas]);

  const galleryImages = useMemo(() => {
    if (!currentSession) return [];
    return currentSession.messages
      .filter(m => m.attachment?.mimeType.startsWith('image/'))
      .map(m => m.attachment!.data.startsWith('http') ? m.attachment!.data : `data:${m.attachment!.mimeType};base64,${m.attachment!.data}`);
  }, [currentSession]);

  const currentImageIndex = useMemo(() => galleryImages.indexOf(viewerImage || ''), [galleryImages, viewerImage]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('aura_dark_mode', String(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    const savedSessions = localStorage.getItem('aura_sessions');
    const savedProfile = localStorage.getItem('aura_profile');
    const savedPersonasData = localStorage.getItem('aura_personas');
    const hasStarted = localStorage.getItem('aura_started');
    
    if (hasStarted === 'true') setIsAwaitingStart(false);
    
    if (savedPersonasData) {
      try { 
        const parsed = JSON.parse(savedPersonasData);
        if (parsed && Array.isArray(parsed)) {
          if (parsed.length > 0) setSavedPersonas(parsed);
          else if (localStorage.getItem('aura_personas_initialized') !== 'true') setSavedPersonas(DEFAULT_PERSONAS);
          else setSavedPersonas([]);
        } else {
          setSavedPersonas(DEFAULT_PERSONAS);
        }
      } catch (e) { setSavedPersonas(DEFAULT_PERSONAS); }
    } else {
      setSavedPersonas(DEFAULT_PERSONAS);
    }

    if (savedSessions) {
      try {
        const revived = JSON.parse(savedSessions).map((s: any) => ({ 
          ...s, 
          lastInteraction: new Date(s.lastInteraction), 
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })) 
        }));
        setSessions(revived);
        if (revived.length > 0) {
            if (hasStarted === 'true') {
                setCurrentSessionId(revived[revived.length - 1].id);
            }
        }
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

  const backgroundSave = useCallback(() => {
    if (!isHydrated.current) return;
    localStorage.setItem('aura_sessions', JSON.stringify(sessions));
    localStorage.setItem('aura_personas', JSON.stringify(savedPersonas));
    localStorage.setItem('aura_personas_initialized', 'true');
    if (userProfile) localStorage.setItem('aura_profile', JSON.stringify(userProfile));
    
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
    lastSaveRef.current = Date.now();
  }, [sessions, savedPersonas, userProfile]);

  useEffect(() => {
    const interval = setInterval(() => {
      backgroundSave();
    }, 180000); 
    return () => clearInterval(interval);
  }, [backgroundSave]);

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

  const handleSendMessage = async (textOverride?: string, attachmentOverride?: MessageAttachment, isProactiveNudge = false) => {
    const text = textOverride || inputValue; 
    const attachment = attachmentOverride || selectedAttachment;
    if ((!text.trim() && !attachment) || isLoading || !currentSessionId) return;
    
    const sessionId = currentSessionId;
    const sessionToUpdate = sessions.find(s => s.id === sessionId);
    if (!sessionToUpdate) return;

    // Use a reference to history BEFORE adding the current turns to avoid double turns in the API call
    const historyBeforeNewMessage = [...sessionToUpdate.messages];

    const userMsg: Message | null = isProactiveNudge ? null : { 
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
      messages: userMsg ? [...s.messages, userMsg, aiPlaceholder] : [...s.messages, aiPlaceholder], 
      lastInteraction: new Date() 
    } : s));

    if (!isProactiveNudge) setInputValue(''); 
    setSelectedAttachment(null); 
    setReplyingToMessage(null); 
    setIsEmojiPickerOpen(false);
    setIsLoading(true); 

    try {
      const nudgePrompt = isProactiveNudge 
        ? "(User is inactive. Send a very short, natural Hinglish check-in like 'Kya hua? So gaye?' or 'Kahan chale gaye yaar?'. Keep it under 10 words.)"
        : text;

      await geminiService.streamMessage(
        historyBeforeNewMessage, 
        nudgePrompt, 
        userProfile, 
        activeAICharacter, 
        attachment, 
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
      console.error("Chat flow error:", error);
      const errStr = String(error).toLowerCase();
      const isQuota = errStr.includes("429") || errStr.includes("quota") || errStr.includes("exhausted");
      const isServerErr = errStr.includes("500") || errStr.includes("code: 0");
      
      let errorMessage = "Phas gaya network! Phir se try karo please.";
      if (isQuota) errorMessage = "Yaar, main thoda thak gayi hoon, thodi der mein baat karein? ❤️";
      if (isServerErr) errorMessage = "Arre, servers thoda ghum gaye hain. Ek baar phir try karo na? ✨";

      setSessions(prev => prev.map(s => s.id === sessionId ? {
        ...s,
        messages: s.messages.map(m => m.id === aiMsgId ? { ...m, content: errorMessage, status: 'sent' } : m)
      } : s));
    } finally { 
      setIsLoading(false); 
      setTimeout(scrollToBottom, 100);
    }
  };

  useEffect(() => {
    if (isAwaitingStart || !currentSessionId || isLoading) {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      return;
    }
    const session = sessions.find(s => s.id === currentSessionId);
    if (!session) return;
    const lastMsg = session.messages[session.messages.length - 1];
    if (lastMsg && lastMsg.role === 'model' && lastMsg.status !== 'sending') {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = setTimeout(() => {
        handleSendMessage("", undefined, true);
        backgroundSave();
      }, 60000); // 1 minute nudge
    } else {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    }
    return () => {
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    };
  }, [currentSessionId, sessions, isAwaitingStart, isLoading, backgroundSave]);

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
      setSessions(prev => {
        const updated = prev.map(s => 
          s.id === currentSessionId 
            ? { ...s, messages: s.messages.filter(m => m.id !== targetId) } 
            : s
        );
        localStorage.setItem('aura_sessions', JSON.stringify(updated));
        return updated;
      });
      setMessageContextMenu(null);
    }
  };

  const startNewChatFromPersona = async (persona: AICharacter) => {
    const existingSession = sessions.find(s => s.aiCharacter.id === persona.id);
    if (existingSession) {
        setCurrentSessionId(existingSession.id);
    } else {
        const newSession: ChatSession = { 
            id: generateId(), 
            title: persona.name, 
            messages: [], 
            lastInteraction: new Date(), 
            aiCharacter: persona, 
            isPinned: false 
        };
        setSessions(prev => {
          const updated = [...prev, newSession];
          localStorage.setItem('aura_sessions', JSON.stringify(updated));
          return updated;
        }); 
        setCurrentSessionId(newSession.id);
    }
    setIsAwaitingStart(false); 
    localStorage.setItem('aura_started', 'true');
  };

  const openPersonaEdit = (p: AICharacter) => {
    setAiSetupForm({ id: p.id, name: p.name, age: p.age.toString(), gender: p.gender, traits: p.traits.join(', ') });
    setIsAISetupOpen(true);
  };

  const deletePersona = (id: string) => {
    setPersonaToDelete(id);
  };

  const confirmDeletePersona = () => {
    const id = personaToDelete;
    if (!id) return;
    try {
      let updatedPersonas: AICharacter[] = [];
      let updatedSessions: ChatSession[] = [];

      setSavedPersonas(prev => {
        updatedPersonas = prev.filter(x => x.id !== id);
        localStorage.setItem('aura_personas', JSON.stringify(updatedPersonas));
        localStorage.setItem('aura_personas_initialized', 'true');
        return updatedPersonas;
      });

      setSessions(prev => {
        updatedSessions = prev.filter(s => s.aiCharacter.id !== id);
        localStorage.setItem('aura_sessions', JSON.stringify(updatedSessions));
        return updatedSessions;
      });

      if (activeAICharacter?.id === id || currentSession?.aiCharacter.id === id) {
        setCurrentSessionId(null);
        setIsAwaitingStart(true);
      }
      
      setPersonaToDelete(null);
      setIsAISetupOpen(false);
      setIsHeaderMenuOpen(false);
      setShowSaveIndicator(true);
      setTimeout(() => setShowSaveIndicator(false), 1500);
    } catch (err) {
      alert("Error deleting persona. Please try again.");
    }
  };

  const deleteSession = (sessionId: string) => {
    try {
      const session = sessions.find(s => s.id === sessionId);
      if (!session) return;
      
      if (window.confirm(`Delete conversation with ${session.aiCharacter.name}? All messages will be erased forever.`)) {
        setSessions(prev => {
          const updated = prev.filter(s => s.id !== sessionId);
          localStorage.setItem('aura_sessions', JSON.stringify(updated));
          return updated;
        });

        if (currentSessionId === sessionId) {
          setCurrentSessionId(null);
          setIsAwaitingStart(true);
        }

        setShowSaveIndicator(true);
        setTimeout(() => setShowSaveIndicator(false), 1500);
      }
    } catch (err) {
      alert("Failed to delete conversation.");
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
      setSavedPersonas(prev => {
        const updated = prev.map(p => p.id === aiSetupForm.id ? newPersona : p);
        localStorage.setItem('aura_personas', JSON.stringify(updated));
        localStorage.setItem('aura_personas_initialized', 'true');
        return updated;
      });
      setSessions(prev => {
        const updated = prev.map(s => s.aiCharacter.id === aiSetupForm.id ? { ...s, aiCharacter: newPersona } : s);
        localStorage.setItem('aura_sessions', JSON.stringify(updated));
        return updated;
      });
    } else {
      setSavedPersonas(prev => {
        const updated = [...prev, newPersona];
        localStorage.setItem('aura_personas', JSON.stringify(updated));
        localStorage.setItem('aura_personas_initialized', 'true');
        return updated;
      });
    }

    setIsAISetupOpen(false);
  };

  const navigateGallery = (direction: 'next' | 'prev') => {
    if (isImageTransitioning) return;
    setIsImageTransitioning(true);
    setTimeout(() => {
      let nextIndex = direction === 'next' ? currentImageIndex + 1 : currentImageIndex - 1;
      if (nextIndex >= galleryImages.length) nextIndex = 0;
      if (nextIndex < 0) nextIndex = galleryImages.length - 1;
      setViewerImage(galleryImages[nextIndex]);
      setIsImageTransitioning(false);
    }, 200);
  };

  return (
    <div className={`flex h-full w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden relative ${activeEffect?.className || ''}`}>
      {activeEffect && <div className="fixed inset-0 pointer-events-none z-[40]"><div className={`effect-overlay effect-overlay-${activeEffect.id}`}></div></div>}

      <div className={`fixed bottom-24 right-6 z-[2000] px-4 py-2 bg-slate-900/80 dark:bg-indigo-600/80 backdrop-blur-md text-white rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all duration-500 transform-gpu ${showSaveIndicator ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <CheckCircle2 size={14} /> Synced to LocalStorage
      </div>

      {isAwaitingStart ? (
        <div className="h-full w-full flex flex-col bg-white dark:bg-slate-950 animate-fade-in relative overflow-y-auto custom-scrollbar">
          <div className="absolute inset-0 opacity-10 dark:opacity-20 flex items-center justify-center overflow-hidden pointer-events-none">
            <Sparkles size={400} className="text-indigo-600 animate-pulse" />
          </div>
          
          <div className="max-w-6xl mx-auto w-full px-6 py-12 lg:py-24 relative z-10 flex flex-col">
            <header className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-3 font-black text-3xl text-indigo-600 tracking-tighter transition-transform hover:scale-105 cursor-default">
                <Sparkles size={32} fill="currentColor" />
                <span>Aura</span>
              </div>
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className="w-14 h-14 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm active:scale-95 border border-slate-100 dark:border-slate-800"
                >
                  {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                </button>
                <button 
                  onClick={() => setIsProfileModalOpen(true)}
                  className="w-14 h-14 rounded-full bg-slate-900 dark:bg-indigo-600 flex items-center justify-center text-white hover:scale-105 transition-all shadow-xl hover:shadow-indigo-500/25"
                >
                  <User size={24} />
                </button>
              </div>
            </header>

            <div className="mb-16">
              <h1 className="text-5xl lg:text-7xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter leading-tight">
                Meet your next <br /> <span className="text-indigo-600">Inner Circle.</span>
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xl max-w-xl font-medium">
                Choose a persona that matches your vibe. Emotional, playful, or deep—Aura adapts to you.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {savedPersonas.map((p, idx) => (
                <PersonaCard 
                  key={p.id}
                  persona={p} 
                  index={idx}
                  onStart={startNewChatFromPersona}
                  onEdit={openPersonaEdit}
                  onDelete={deletePersona}
                />
              ))}
              
              <div 
                onClick={() => { setAiSetupForm({ id: '', name: '', age: '22', gender: 'Female', traits: '' }); setIsAISetupOpen(true); }}
                className="group border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-8 flex flex-col items-center justify-center gap-6 hover:border-indigo-200 dark:hover:border-indigo-800 hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 cursor-pointer transition-all duration-300 min-h-[320px] h-full"
              >
                <div className="w-20 h-20 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center text-slate-300 dark:text-slate-600 group-hover:scale-110 group-hover:text-indigo-400 transition-all duration-500 border-2 border-slate-50 dark:border-slate-700">
                  <PlusCircle size={40} />
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-black text-slate-400 dark:text-slate-500 group-hover:text-indigo-600 transition-colors uppercase tracking-widest">Create Identity</h3>
                  <p className="text-[10px] text-slate-300 dark:text-slate-600 font-bold uppercase tracking-[0.2em] mt-1">Design a custom companion</p>
                </div>
              </div>
            </div>

            {sessions.length > 0 && (
              <div className="mt-24">
                <h2 className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-8 px-2">Recent Journeys</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                   {sessions.slice(-4).reverse().map(s => (
                     <div 
                      key={s.id} 
                      onClick={() => { setCurrentSessionId(s.id); setIsAwaitingStart(false); }}
                      className="p-6 bg-slate-50 dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 flex items-center gap-4 cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg hover:border-indigo-100 dark:hover:border-indigo-900/40 transition-all group"
                     >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black group-hover:scale-110 transition-transform shadow-sm">{s.aiCharacter.name[0]}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate text-sm uppercase tracking-tight">{s.aiCharacter.name}</p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest">{new Date(s.lastInteraction).toLocaleDateString()}</p>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        <>
          <aside className={`fixed lg:static z-[100] inset-y-0 left-0 w-[280px] sm:w-80 bg-white dark:bg-slate-950 border-r border-slate-50 dark:border-slate-900 flex flex-col transition-transform duration-300 transform-gpu pt-safe ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full lg:translate-x-0'}`}>
            <div className="p-8 flex items-center justify-between">
              <div onClick={() => setIsAwaitingStart(true)} className="flex items-center gap-3 font-black text-3xl text-indigo-600 tracking-tighter cursor-pointer hover:scale-105 transition-transform"><Sparkles size={28} fill="currentColor" /><span>Aura</span></div>
              <button className="lg:hidden p-3 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl" onClick={() => setIsSidebarOpen(false)}><X size={28} /></button>
            </div>
            <div className="px-6 mb-8"><Button className="w-full h-16 rounded-[1.5rem] bg-slate-900 dark:bg-indigo-600 text-white font-black text-xs tracking-widest gap-4 shadow-xl active:scale-95" onClick={() => setIsAwaitingStart(true)}><Plus size={20} /> ALL CHARS</Button></div>
            <div className="flex-1 overflow-y-auto px-4 custom-scrollbar space-y-2">
              {sessions.map(s => (
                <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); setIsAwaitingStart(false); }} className={`group px-5 py-5 rounded-[2rem] cursor-pointer flex items-center gap-5 transition-all ${currentSessionId === s.id ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-100 dark:ring-indigo-900/40 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/60'}`}>
                  <div className={`w-12 h-12 rounded-[1.5rem] flex items-center justify-center font-black text-sm ${currentSessionId === s.id ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 dark:bg-slate-900'}`}>{s.aiCharacter.name[0]}</div>
                  <div className="flex-1 min-w-0 text-sm font-black truncate uppercase tracking-widest">{s.title}</div>
                  <button onClick={(e) => { e.stopPropagation(); deleteSession(s.id); }} className="opacity-0 group-hover:opacity-100 p-2.5 hover:bg-red-50 dark:hover:bg-red-900/40 hover:text-red-600 dark:hover:text-red-400 rounded-2xl transition-all"><Trash2 size={18} /></button>
                </div>
              ))}
            </div>
            <div onClick={() => setIsProfileModalOpen(true)} className="m-6 p-5 rounded-[2.2rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center gap-5 cursor-pointer hover:bg-white dark:hover:bg-slate-800 hover:shadow-lg transition-all active:scale-95 group">
              <div className="w-12 h-12 rounded-2xl bg-white dark:bg-slate-950 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shadow-sm group-hover:scale-110 transition-transform"><User size={24} /></div>
              <div className="flex-1 min-w-0 font-black text-base text-slate-900 dark:text-white truncate">{userProfile?.name || "Profile"}</div>
            </div>
          </aside>

          <main className="flex-1 flex flex-col relative bg-white dark:bg-slate-950 min-w-0 pt-safe">
            <header className="h-20 shrink-0 border-b border-slate-100 dark:border-slate-900 flex items-center px-6 justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl z-[90]">
              <div className="flex items-center gap-4">
                <button className="lg:hidden p-2 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl" onClick={() => setIsSidebarOpen(true)}><Menu size={28} /></button>
                <div className="w-12 h-12 rounded-[1.2rem] bg-indigo-600 text-white flex items-center justify-center font-black text-lg shadow-lg">{activeAICharacter.name[0]}</div>
                <div className="flex flex-col"><h2 className="font-black text-lg text-slate-900 dark:text-white leading-none tracking-tight">{activeAICharacter.name}</h2><div className="flex items-center gap-2 mt-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-sm shadow-emerald-500/50"></div><span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-widest">Active Now</span></div></div>
              </div>
              <div className="flex items-center gap-1 sm:gap-3">
                 <button 
                  onClick={() => setIsDarkMode(!isDarkMode)} 
                  title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90"
                 >
                    {isDarkMode ? <Sun size={24} /> : <Moon size={24} />}
                 </button>
                 <button onClick={() => setIsAwaitingStart(true)} title="Home" className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90">
                    <Home size={24} />
                 </button>
                 <button onClick={() => setIsEffectsGalleryOpen(true)} className={`p-3 rounded-2xl transition-all active:scale-90 ${activeEffect ? 'text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 shadow-sm' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}><Zap size={24} /></button>
                 <button onClick={() => setIsHeaderMenuOpen(!isHeaderMenuOpen)} className="p-3 rounded-2xl text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all relative active:scale-90">
                    <MoreVertical size={24} />
                    {isHeaderMenuOpen && (
                      <div className="absolute top-full right-0 mt-3 w-56 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[1.5rem] shadow-4xl py-2 z-[200] animate-slide-up ring-1 ring-slate-100 dark:ring-slate-700">
                        <button onClick={() => { const data: AppDataExport = { sessions, savedPersonas, userProfile }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `aura-export-${new Date().getTime()}.json`; a.click(); setIsHeaderMenuOpen(false); }} className="w-full px-5 py-4 flex items-center gap-4 text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors border-b border-slate-100 dark:border-slate-700"><Save size={18} /> Export Data</button>
                        {currentSession && (
                          <button onClick={() => deletePersona(currentSession.aiCharacter.id)} className="w-full px-5 py-4 flex items-center gap-4 text-red-500 text-xs font-black uppercase tracking-widest hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"><Trash2 size={18} /> Delete Character</button>
                        )}
                      </div>
                    )}
                 </button>
              </div>
            </header>

            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-8 custom-scrollbar bg-white dark:bg-slate-950" style={{ contain: 'layout' }}>
              <div className="max-w-4xl mx-auto flex flex-col space-y-10 lg:px-12">
                {currentSession?.messages.map((msg) => (
                  <MessageItem 
                    key={msg.id} 
                    msg={msg} 
                    isOwn={msg.role === 'user'} 
                    onContextMenu={(e: React.MouseEvent, m: Message) => setMessageContextMenu({ x: e.clientX, y: e.clientY, message: m })} 
                    onReact={handleReactToMessage} 
                    replyToContent={msg.replyToId ? currentSession.messages.find(m => m.id === msg.replyToId)?.content : null} 
                    onMediaLoad={() => scrollToBottom('auto')} 
                    onImageClick={(url: string) => setViewerImage(url)}
                  />
                ))}
                <div className="h-8 w-full shrink-0" />
              </div>
            </div>

            <div className="shrink-0 p-4 lg:p-6 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900 z-[100] pb-safe relative transition-colors duration-400">
              
              {selectedAttachment && (
                <div className="max-w-4xl mx-auto mb-4 animate-slide-up">
                  <div className="relative inline-block group">
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900 shadow-xl bg-slate-50 dark:bg-slate-800">
                      {selectedAttachment.mimeType.startsWith('image/') ? (
                        <img 
                          src={`data:${selectedAttachment.mimeType};base64,${selectedAttachment.data}`} 
                          className="w-full h-full object-cover" 
                          alt="Preview" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-indigo-500">
                          <FileText size={32} />
                        </div>
                      )}
                    </div>
                    <button 
                      onClick={() => setSelectedAttachment(null)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-90 transition-all ring-4 ring-white dark:ring-slate-950"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              )}

              {isEmojiPickerOpen && (
                <div ref={emojiPickerRef} className="absolute bottom-full left-4 right-4 mb-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-4xl p-6 z-[200] max-h-[400px] overflow-y-auto custom-scrollbar animate-slide-up ring-1 ring-slate-100 dark:ring-slate-800">
                  <div className="flex items-center justify-between mb-6 px-2 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md pb-4 border-b border-slate-50 dark:border-slate-800">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Add Emoji</h3>
                    <button onClick={() => setIsEmojiPickerOpen(false)} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"><X size={18} /></button>
                  </div>
                  {FULL_EMOJI_LIST.map((group) => (
                    <div key={group.cat} className="mb-6">
                      <p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest mb-3 px-2">{group.cat}</p>
                      <div className="grid grid-cols-7 gap-2">
                        {group.icons.map(emoji => (
                          <button 
                            key={emoji} 
                            onClick={() => { setInputValue(prev => prev + emoji); setIsEmojiPickerOpen(false); }}
                            className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all active:scale-125"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="max-w-4xl mx-auto flex flex-col gap-4">
                {replyingToMessage && (
                  <div className="flex items-center justify-between p-4 bg-indigo-50/80 dark:bg-indigo-900/40 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-800 animate-slide-up shadow-sm backdrop-blur-sm">
                    <div className="min-w-0 pr-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">Replying to {replyingToMessage.role === 'model' ? activeAICharacter.name : 'You'}</p><p className="text-sm text-indigo-900 dark:text-indigo-200 font-medium truncate italic opacity-80">"{replyingToMessage.content}"</p></div>
                    <button onClick={() => setReplyingToMessage(null)} className="p-2 text-indigo-400 hover:text-indigo-600 bg-white dark:bg-slate-800 rounded-full shadow-sm active:scale-90 transition-all"><X size={16} /></button>
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 lg:gap-5">
                  <div className="flex-none flex items-center gap-2">
                    <button onClick={() => fileInputRef.current?.click()} className="h-14 w-14 flex items-center justify-center rounded-full bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 active:scale-90 transition-all shadow-sm" title="Upload Photo"><Paperclip size={22} /></button>
                    <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => { const file = e.target.files?.[0]; if (file) compressAndResize(file).then(setSelectedAttachment); }} accept="image/*" />
                  </div>
                  <div className="flex-1 flex items-center bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] px-5 shadow-inner focus-within:bg-white dark:focus-within:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all min-h-[56px] lg:min-h-[64px]">
                    <button onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)} className={`mr-3 transition-colors ${isEmojiPickerOpen ? 'text-indigo-600' : 'text-slate-400 hover:text-indigo-600'}`}><Smile size={24} /></button>
                    <textarea ref={textareaRef} rows={1} value={inputValue} onChange={e => setInputValue(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} placeholder="Talk to Aura..." className="w-full bg-transparent py-4 text-base font-bold text-slate-950 dark:text-white outline-none resize-none max-h-32 custom-scrollbar placeholder:text-slate-400 dark:placeholder:text-slate-600" />
                  </div>
                  <div className="flex-none flex items-center gap-2">
                    <button onClick={() => { if (!recognitionRef.current) return; if (isRecording) { recognitionRef.current.stop(); setIsRecording(false); } else { recognitionRef.current.start(); setIsRecording(true); } }} className={`h-14 w-14 flex items-center justify-center rounded-full transition-all border ${isRecording ? 'bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400 animate-pulse border-red-200 dark:border-red-800 ring-4 ring-red-50 dark:ring-red-900/40 shadow-sm' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 border-slate-100 dark:border-slate-800 shadow-sm'}`}><Mic size={24} /></button>
                    <button onClick={() => handleSendMessage()} disabled={(!inputValue.trim() && !selectedAttachment) || isLoading} className={`h-14 w-14 flex items-center justify-center rounded-full transition-all shadow-xl ${ (inputValue.trim() || selectedAttachment) && !isLoading ? 'bg-indigo-600 text-white active:scale-95 hover:bg-indigo-700 shadow-indigo-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-700' }`}><Send size={24} fill="currentColor" /></button>
                  </div>
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
          className="fixed z-[3000] bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-[2.2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] py-3 w-64 animate-slide-up backdrop-blur-xl bg-white/95 dark:bg-slate-800/95 ring-1 ring-black/5 dark:ring-white/5" 
          style={{ 
            left: Math.min(messageContextMenu.x, window.innerWidth - 270), 
            top: Math.min(messageContextMenu.y, window.innerHeight - 250) 
          }}
        >
          <button onClick={handleActionReply} className="w-full px-6 py-5 flex items-center gap-4 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-sm font-black uppercase tracking-widest transition-colors"><Reply size={20} className="text-indigo-500" /> Reply</button>
          <button onClick={handleActionCopy} className="w-full px-6 py-5 flex items-center gap-4 text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 text-sm font-black uppercase tracking-widest transition-colors"><Copy size={20} className="text-indigo-500" /> Copy Text</button>
          <div className="h-[1px] bg-slate-100 dark:bg-slate-700 mx-5 my-2" />
          <button onClick={handleActionDelete} className="w-full px-6 py-5 flex items-center gap-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 text-sm font-black uppercase tracking-widest transition-colors">
            <Trash2 size={20} className="text-red-500" /> Delete
          </button>
        </div>
      )}

      {viewerImage && (
        <div className="fixed inset-0 z-[5000] bg-black/95 backdrop-blur-3xl flex flex-col animate-fade-in overflow-hidden touch-none">
          <div className="flex items-center justify-between p-6 z-[5001]">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setViewerImage(null)}
                className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-90 transition-all"
              >
                <X size={24} />
              </button>
              <div className="text-white">
                <p className="font-black uppercase tracking-widest text-[10px] opacity-60">Media Viewer</p>
                <p className="font-bold text-xs">{currentImageIndex + 1} of {galleryImages.length}</p>
              </div>
            </div>
            <div className="flex gap-3">
               <a 
                href={viewerImage} 
                download={`aura-media-${Date.now()}.jpg`}
                className="w-12 h-12 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-90 transition-all"
               >
                  <Download size={22} />
               </a>
            </div>
          </div>

          <div className="flex-1 relative flex items-center justify-center">
            <button 
              onClick={() => navigateGallery('prev')}
              className="absolute left-6 w-16 h-16 flex items-center justify-center bg-white/5 text-white rounded-full hover:bg-white/10 active:scale-90 transition-all z-[5002] border border-white/10"
            >
              <ChevronLeft size={32} />
            </button>
            
            <div className={`relative max-w-full max-h-[85vh] transition-all duration-300 transform ${isImageTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'}`}>
               <img 
                src={viewerImage} 
                className="w-full h-full object-contain shadow-2xl rounded-lg pointer-events-auto" 
                alt="Full View" 
                onDoubleClick={() => setViewerImage(null)}
               />
            </div>

            <button 
              onClick={() => navigateGallery('next')}
              className="absolute right-6 w-16 h-16 flex items-center justify-center bg-white/5 text-white rounded-full hover:bg-white/10 active:scale-90 transition-all z-[5002] border border-white/10"
            >
              <ChevronRight size={32} />
            </button>
          </div>

          <div className="h-28 shrink-0 flex items-center gap-2 px-6 overflow-x-auto scrollbar-hide bg-white/5 backdrop-blur-xl border-t border-white/10">
            {galleryImages.map((img, i) => (
              <button 
                key={i} 
                onClick={() => setViewerImage(img)}
                className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 transition-all duration-300 border-2 ${viewerImage === img ? 'border-indigo-500 scale-110 shadow-lg' : 'border-transparent opacity-40 hover:opacity-100'}`}
              >
                <img src={img} className="w-full h-full object-cover" alt="Thumb" />
              </button>
            ))}
          </div>
        </div>
      )}

      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[1800] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setIsProfileModalOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[4rem] shadow-4xl p-10 lg:p-14 animate-slide-up border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex items-center justify-between mb-10"><h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Your Profile</h2><button onClick={() => setIsProfileModalOpen(false)} className="p-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-full hover:bg-red-50 hover:text-red-500 transition-all active:scale-90"><X size={24} /></button></div>
            <div className="space-y-10">
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Identification</p><div className="grid grid-cols-1 sm:grid-cols-2 gap-6"><div className="relative"><input type="text" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-8 py-6 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" value={profileForm.name} onChange={e => setProfileForm({...profileForm, name: e.target.value})} placeholder="Full Name" /><User className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={20} /></div><input type="number" className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-8 py-6 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" value={profileForm.age} onChange={e => setProfileForm({...profileForm, age: e.target.value})} placeholder="Age" /></div></div>
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Identity</p><div className="flex gap-4">{['Female', 'Male', 'Secret'].map(g => (<button key={g} onClick={() => setProfileForm({...profileForm, gender: g})} className={`flex-1 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${profileForm.gender === g ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border border-slate-100 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-600'}`}>{g}</button>))}</div></div>
              <div className="space-y-4"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-2">Goal</p><div className="grid grid-cols-2 sm:grid-cols-3 gap-4">{PURPOSES.map(p => (<button key={p.value} onClick={() => setProfileForm({...profileForm, purpose: p.value})} className={`flex flex-col items-center justify-center p-6 rounded-[2.5rem] border-2 transition-all ${profileForm.purpose === p.value ? 'bg-white dark:bg-slate-800 border-indigo-600 text-indigo-600 dark:text-indigo-400 shadow-xl' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-400 hover:bg-white dark:hover:bg-slate-700 hover:text-indigo-400'}`}><div className={`mb-3 transition-transform ${profileForm.purpose === p.value ? 'scale-125' : ''}`}>{p.icon}</div><span className="text-[10px] font-black uppercase tracking-widest">{p.label}</span></button>))}</div></div>
              <Button className="w-full h-22 rounded-[2.5rem] font-black text-2xl bg-slate-900 dark:bg-indigo-600 text-white shadow-2xl uppercase tracking-tighter active:scale-95" onClick={() => { setUserProfile(profileForm); setIsProfileModalOpen(false); backgroundSave(); }}>SAVE IDENTITY</Button>
            </div>
          </div>
        </div>
      )}

      {isEffectsGalleryOpen && (
        <div className="fixed inset-0 z-[1700] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/70 dark:bg-black/90 backdrop-blur-md" onClick={() => setIsEffectsGalleryOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-[4rem] shadow-4xl animate-slide-up flex flex-col max-h-[80vh] overflow-hidden border border-slate-100 dark:border-slate-800">
             <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 shrink-0"><h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Atmosphere</h2><button onClick={() => setIsEffectsGalleryOpen(false)} className="p-4 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-[1.5rem] active:scale-90 hover:bg-red-50 hover:text-red-500 transition-colors"><X size={28} /></button></div>
             <div className="flex-1 overflow-y-auto p-10 grid grid-cols-2 sm:grid-cols-4 gap-8 custom-scrollbar">
               {EFFECT_GROUPS[0]?.effects?.map(eff => (
                 <button key={eff.id} onClick={() => { setActiveEffect(eff as VisualEffect); setIsEffectsGalleryOpen(false); }} className={`flex flex-col items-center p-10 rounded-[3rem] border-2 transition-all group ${activeEffect?.id === eff.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:border-indigo-100 dark:hover:border-indigo-800'}`}><span className="text-5xl mb-6 group-hover:scale-110 transition-transform">{eff.emoji}</span><span className="text-[11px] font-black uppercase tracking-widest">{eff.name}</span></button>
               ))}
               {activeEffect && <button onClick={() => { setActiveEffect(null); setIsEffectsGalleryOpen(false); }} className="col-span-full py-6 mt-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-[2rem] font-black text-lg uppercase tracking-widest active:scale-95 transition-all">Clear All Effects</button>}
             </div>
          </div>
        </div>
      )}

      {isAISetupOpen && (
        <div className="fixed inset-0 z-[1600] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md" onClick={() => setIsAISetupOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-w-xl rounded-[4rem] shadow-4xl p-12 animate-slide-up border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[90vh] custom-scrollbar">
             <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-10 text-center tracking-tighter leading-tight">{aiSetupForm.id ? 'Refine Identity' : 'New Identity'}</h2>
             <form onSubmit={handleSavePersona} className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Character Name</p>
                  <input type="text" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-10 py-6 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" placeholder="e.g. Aura" value={aiSetupForm.name} onChange={e => setAiSetupForm({...aiSetupForm, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Age</p>
                    <input type="number" required className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-10 py-6 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" placeholder="22" value={aiSetupForm.age} onChange={e => setAiSetupForm({...aiSetupForm, age: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Gender</p>
                    <select className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-10 py-6 font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner appearance-none" value={aiSetupForm.gender} onChange={e => setAiSetupForm({...aiSetupForm, gender: e.target.value})}><option>Female</option><option>Male</option><option>Non-binary</option></select>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase text-indigo-400 tracking-[0.2em] px-6">Core Traits (comma separated)</p>
                  <textarea rows={3} className="w-full bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2.5rem] px-10 py-6 font-bold text-slate-900 dark:text-white resize-none outline-none focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-800 transition-all shadow-inner" placeholder="Witty, Empathetic, Creative..." value={aiSetupForm.traits} onChange={e => setAiSetupForm({...aiSetupForm, traits: e.target.value})} />
                </div>
                <div className="flex gap-4">
                  <Button type="submit" className="flex-1 h-20 rounded-[2.5rem] font-black text-xl bg-slate-900 dark:bg-indigo-600 text-white shadow-2xl uppercase tracking-tighter active:scale-95">CONFIRM</Button>
                  {aiSetupForm.id && (
                    <Button 
                      type="button" 
                      variant="danger" 
                      className="flex-1 h-20 rounded-[2.5rem] font-black text-xl uppercase tracking-tighter active:scale-95" 
                      onClick={() => deletePersona(aiSetupForm.id)}
                    >
                      DELETE
                    </Button>
                  )}
                </div>
             </form>
          </div>
        </div>
      )}

      {personaToDelete && (
        <div className="fixed inset-0 z-[2500] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={() => setPersonaToDelete(null)} />
          <div className="relative bg-white dark:bg-slate-900 w-full max-md rounded-[3rem] shadow-4xl p-10 animate-slide-up border border-slate-100 dark:border-slate-800 text-center">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center text-red-600 dark:text-red-400 mx-auto mb-8">
              <AlertTriangle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">Delete Character?</h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-10 leading-relaxed">
              Are you sure you want to delete this persona? <span className="text-red-500 font-bold underline">This cannot be undone.</span>
            </p>
            <div className="flex flex-col gap-3">
              <Button variant="danger" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs" onClick={confirmDeletePersona}>Yes, Delete Everything</Button>
              <Button variant="secondary" className="w-full h-16 rounded-[1.5rem] font-black uppercase tracking-widest text-xs" onClick={() => setPersonaToDelete(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;


import React, { useState, useEffect, useRef } from 'react';
import { Message, ChatSession, UserProfile, ConversationPurpose, AICharacter, MessageAttachment } from './types';
import { geminiService } from './services/geminiService';
import { Button } from './components/Button';
import { 
  Send, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Menu, 
  X, 
  User, 
  Sparkles, 
  Heart,
  BookOpen,
  Coffee,
  Zap,
  ShieldCheck,
  Smile,
  BrainCircuit,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowRight,
  Mail,
  Lock,
  Mic,
  MicOff,
  ThumbsUp,
  Settings2,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

const REACTION_OPTIONS = ['👍', '❤️', '😂', '😮', '🙏'];

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSignUpView, setIsSignUpView] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  
  // Window flow control
  const [isAwaitingStart, setIsAwaitingStart] = useState(true);
  const [isAISetupOpen, setIsAISetupOpen] = useState(false);

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const [selectedAttachment, setSelectedAttachment] = useState<MessageAttachment | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  
  const [authForm, setAuthForm] = useState({
    name: '',
    age: '',
    gender: 'Male',
    email: '',
    password: ''
  });

  const [profileForm, setProfileForm] = useState<UserProfile>({
    name: 'Guest',
    age: '25',
    gender: 'Secret',
    purpose: 'Casual Chat'
  });

  const [aiSetupForm, setAiSetupForm] = useState({
    name: '',
    age: '22',
    gender: 'Female',
    traits: ''
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  const currentSession = sessions.find(s => s.id === currentSessionId);
  const activeAICharacter = currentSession?.aiCharacter || {
    name: 'Aura',
    age: 22,
    gender: 'Female',
    traits: ['Kind', 'Witty', 'Attentive']
  };

  const purposes: { id: ConversationPurpose; icon: any; label: string }[] = [
    { id: 'Casual Chat', icon: Coffee, label: 'Casual Chat' },
    { id: 'Emotional Support', icon: Heart, label: 'Support' },
    { id: 'Study', icon: BookOpen, label: 'Study' },
    { id: 'Motivation', icon: Zap, label: 'Motivation' },
    { id: 'Deep Talk', icon: BrainCircuit, label: 'Deep Talk' },
  ];

  const saveProfile = () => {
    if (profileForm.name.trim()) {
      setUserProfile(profileForm);
      setIsProfileModalOpen(false);
    }
  };

  useEffect(() => {
    const checkApiKey = async () => {
      const selected = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(selected);
    };
    checkApiKey();

    const savedSessions = localStorage.getItem('aura_sessions');
    const savedProfile = localStorage.getItem('aura_profile');
    const authStatus = localStorage.getItem('aura_auth');
    const hasStarted = localStorage.getItem('aura_started');

    if (authStatus === 'true') {
      setIsLoggedIn(true);
      if (hasStarted === 'true') {
        setIsAwaitingStart(false);
      }
    }

    if (savedSessions) {
      try {
        const parsed = JSON.parse(savedSessions);
        const revived = parsed.map((s: any) => ({
          ...s,
          lastInteraction: new Date(s.lastInteraction),
          messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }))
        }));
        setSessions(revived);
        if (revived.length > 0) {
          setCurrentSessionId(revived[0].id);
        }
      } catch (e) { console.error(e); }
    }

    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        setProfileForm(parsed);
      } catch (e) { console.error(e); }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputValue(transcript);
      };

      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const handleOpenKeySelector = async () => {
    await (window as any).aistudio.openSelectKey();
    setHasApiKey(true);
  };

  const toggleRecording = () => {
    if (!recognitionRef.current) return;
    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
      setIsRecording(true);
    }
  };

  const handleAutoCorrect = async () => {
    if (!inputValue.trim() || isCorrecting || isLoading) return;
    setIsCorrecting(true);
    try {
      const corrected = await geminiService.autoCorrect(inputValue);
      setInputValue(corrected);
    } finally {
      setIsCorrecting(false);
    }
  };

  useEffect(() => {
    if (sessions.length > 0) localStorage.setItem('aura_sessions', JSON.stringify(sessions));
  }, [sessions]);

  useEffect(() => {
    if (userProfile) localStorage.setItem('aura_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [inputValue]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId, streamingText]);

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUpView) {
      if (!authForm.name || !authForm.email || !authForm.password) return;
      const newProfile: UserProfile = {
        name: authForm.name,
        age: authForm.age || '25',
        gender: authForm.gender || 'Secret',
        purpose: 'Casual Chat'
      };
      setUserProfile(newProfile);
      setProfileForm(newProfile);
    }
    setIsLoggedIn(true);
    localStorage.setItem('aura_auth', 'true');
  };

  const handleStartConversation = () => {
    setAiSetupForm({
      name: '',
      age: '22',
      gender: 'Female',
      traits: ''
    });
    setIsAISetupOpen(true);
  };

  const handleFinalizeAISetup = (e: React.FormEvent) => {
    e.preventDefault();
    const finalizedAI: AICharacter = {
      name: aiSetupForm.name || 'Aura',
      age: parseInt(aiSetupForm.age) || 22,
      gender: aiSetupForm.gender,
      traits: aiSetupForm.traits.split(',').map(t => t.trim()).filter(Boolean)
    };
    
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      title: 'New Conversation',
      messages: [],
      lastInteraction: new Date(),
      aiCharacter: finalizedAI
    };

    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setIsAISetupOpen(false);
    setIsAwaitingStart(false);
    setIsSidebarOpen(false);
    localStorage.setItem('aura_started', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAwaitingStart(true);
    localStorage.removeItem('aura_auth');
    localStorage.removeItem('aura_started');
  };

  const createNewSession = () => {
    handleStartConversation();
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const filtered = prev.filter(s => s.id !== id);
      if (filtered.length === 0) {
        setCurrentSessionId(null);
        setIsAwaitingStart(true);
        return [];
      }
      if (currentSessionId === id) {
        setCurrentSessionId(filtered[0].id);
      }
      return filtered;
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      setSelectedAttachment({
        mimeType: file.type,
        data: base64,
        fileName: file.name
      });
    };
    reader.readAsDataURL(file);
  };

  const handleReact = (messageId: string, emoji: string) => {
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        return {
          ...s,
          messages: s.messages.map(m => {
            if (m.id === messageId) {
              const currentReaction = m.reactions?.[0];
              return {
                ...m,
                reactions: currentReaction === emoji ? [] : [emoji]
              };
            }
            return m;
          })
        };
      }
      return s;
    }));
  };

  const handleSendMessage = async (textOverride?: string) => {
    const text = textOverride || inputValue;
    if ((!text.trim() && !selectedAttachment) || isLoading || isCorrecting || !currentSessionId) return;

    if (isRecording) {
      recognitionRef.current?.stop();
    }

    const sessionId = currentSessionId;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: new Date(),
      attachment: selectedAttachment || undefined
    };

    setSessions(prev => prev.map(s => {
      if (s.id === sessionId) {
        return {
          ...s,
          title: s.messages.length === 0 ? (text ? text.slice(0, 40) : 'File shared') : s.title,
          messages: [...s.messages, userMsg],
          lastInteraction: new Date(),
        };
      }
      return s;
    }));

    const currentAttachment = selectedAttachment;
    setInputValue('');
    setSelectedAttachment(null);
    setIsLoading(true);
    setStreamingText('');

    try {
      const history = sessions.find(s => s.id === sessionId)?.messages || [];
      const response = await geminiService.streamMessage(
        history, 
        text, 
        userProfile, 
        activeAICharacter, 
        currentAttachment,
        (chunk) => {
          setStreamingText(prev => prev + chunk);
        }
      );

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: response,
        timestamp: new Date(),
      };

      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            messages: [...s.messages, aiMsg],
            lastInteraction: new Date(),
          };
        }
        return s;
      }));
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.message || "";
      if (errorMessage.includes("Requested entity was not found") || errorMessage.includes("RESOURCE_EXHAUSTED")) {
        setHasApiKey(false);
      }
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'model',
        content: errorMessage.includes("RESOURCE_EXHAUSTED") 
          ? "I'm currently over my quota. Please select your own API key to continue chatting without limits." 
          : "Sorry, I hit a snag with that message. Can you try sending it again?",
        timestamp: new Date(),
      };
      setSessions(prev => prev.map(s => {
        if (s.id === sessionId) return { ...s, messages: [...s.messages, errorMsg] };
        return s;
      }));
    } finally {
      setIsLoading(false);
      setStreamingText('');
    }
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.mimeType.startsWith('image/');
    const isVideo = attachment.mimeType.startsWith('video/');
    const isPDF = attachment.mimeType === 'application/pdf';
    if (isImage) return <img src={`data:${attachment.mimeType};base64,${attachment.data}`} alt="Attached" className="max-w-full rounded-2xl shadow-sm border border-slate-100 mt-2" />;
    if (isVideo) return (
        <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl mt-2 text-indigo-700 font-medium text-xs">
          <VideoIcon size={16} />
          <span>{attachment.fileName || 'Video shared'}</span>
        </div>
    );
    if (isPDF) return (
        <div className="flex items-center gap-2 p-3 bg-red-50/50 rounded-xl mt-2 text-red-700 font-medium text-xs">
          <FileText size={16} />
          <span>{attachment.fileName || 'PDF Document'}</span>
        </div>
    );
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-xl mt-2 text-slate-700 font-medium text-xs">
        <Paperclip size={16} />
        <span>{attachment.fileName || 'File attached'}</span>
      </div>
    );
  };

  if (!hasApiKey) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-20">
           <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[140px]"></div>
           <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] bg-purple-500 rounded-full blur-[140px]"></div>
        </div>
        
        <div className="max-w-md w-full bg-white/10 backdrop-blur-xl border border-white/20 p-12 rounded-[3.5rem] shadow-4xl text-center z-10 animate-fade-in">
          <div className="w-24 h-24 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-indigo-500/40">
            <Lock size={48} />
          </div>
          <h1 className="text-4xl font-black mb-6 tracking-tight">Access Pro Features</h1>
          <p className="text-slate-300 font-medium mb-10 leading-relaxed">
            Aura Pro requires a personal API key to provide high-quality, uninterrupted conversations.
          </p>
          <Button onClick={handleOpenKeySelector} className="w-full py-7 rounded-[2rem] bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xl mb-8 flex justify-between px-10">
            <span>SELECT API KEY</span>
            <ChevronRight size={28} />
          </Button>
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
            <span>Learn about billing</span>
            <ExternalLink size={18} />
          </a>
        </div>
        <p className="mt-12 text-slate-500 font-black uppercase tracking-[0.4em] text-[10px]">Secure · Private · Pro Models</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="h-[100dvh] w-full flex bg-[#0a0a0c] overflow-hidden relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] bg-indigo-600/10 rounded-full blur-[140px] animate-pulse"></div>
          <div className="absolute bottom-[-15%] right-[-10%] w-[70%] h-[70%] bg-purple-600/10 rounded-full blur-[140px] animate-pulse [animation-delay:2s]"></div>
        </div>
        <div className="relative z-10 w-full h-full flex flex-col lg:flex-row bg-white overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
          <div className="hidden lg:flex flex-[0.7] bg-slate-900 h-full p-20 flex-col justify-between shrink-0 overflow-hidden relative">
            <div className="relative z-20 flex items-center gap-5 text-4xl font-black text-white tracking-tighter">
              <div className="p-4 bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-3xl shadow-3xl shadow-indigo-500/30">
                <Sparkles size={36} fill="currentColor" />
              </div>
              <span>Aura</span>
            </div>
            <div className="relative z-20 space-y-10">
              <h1 className="text-7xl font-black text-white leading-[1.1] tracking-tight">AI with a <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300">Human Soul.</span></h1>
              <p className="text-slate-400 text-xl font-medium leading-relaxed max-w-md">Experience high-EQ conversational intelligence designed to understand your context, mood, and needs naturally.</p>
              <div className="flex flex-wrap gap-5 pt-6">
                <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 backdrop-blur-xl">
                  <Heart className="text-pink-500" size={24} fill="currentColor" />
                  <span className="text-white font-bold text-base">Empathetic</span>
                </div>
                <div className="px-8 py-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 backdrop-blur-xl">
                  <BrainCircuit className="text-indigo-400" size={24} />
                  <span className="text-white font-bold text-base">Context Aware</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 h-full overflow-y-auto custom-scrollbar bg-white flex flex-col">
            <div className="max-w-md mx-auto w-full px-8 py-20 lg:py-24">
              <div className="mb-14 text-center lg:text-left">
                <h2 className="text-5xl font-black text-slate-900 mb-4 tracking-tighter">{isSignUpView ? 'Start your story' : 'Welcome back'}</h2>
                <p className="text-slate-500 text-xl font-medium">Connect with a persona that gets you.</p>
              </div>
              <form onSubmit={handleAuthSubmit} className="space-y-7">
                {isSignUpView && (
                  <div className="space-y-7">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Name</label>
                        <input type="text" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:border-indigo-200" value={authForm.name} onChange={e => setAuthForm({...authForm, name: e.target.value})} />
                      </div>
                      <div className="space-y-2.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Age</label>
                        <input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:border-indigo-200" value={authForm.age} onChange={e => setAuthForm({...authForm, age: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="space-y-7">
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Email</label>
                    <input type="email" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:border-indigo-200" value={authForm.email} onChange={e => setAuthForm({...authForm, email: e.target.value})} />
                  </div>
                  <div className="space-y-2.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-3">Password</label>
                    <input type={showPassword ? "text" : "password"} required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 font-bold text-slate-900 outline-none focus:border-indigo-200" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
                  </div>
                </div>
                <div className="pt-8">
                  <Button type="submit" className="w-full h-20 rounded-[3rem] bg-slate-900 text-white font-black text-xl hover:bg-slate-800 transition-all flex justify-between px-10 items-center">
                    <span>{isSignUpView ? 'CREATE ACCOUNT' : 'SIGN IN'}</span>
                    <ChevronRight size={28} />
                  </Button>
                </div>
              </form>
              <div className="mt-8 text-center">
                <button onClick={() => setIsSignUpView(!isSignUpView)} className="text-slate-500 font-bold hover:text-indigo-600 transition-colors">
                  {isSignUpView ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const AISetupModal = (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-2xl" onClick={() => !isAwaitingStart && setIsAISetupOpen(false)} />
      <div className="relative bg-white w-full max-w-xl rounded-[3rem] shadow-4xl p-10 md:p-14 border border-slate-100 animate-fade-in overflow-y-auto max-h-[95vh] custom-scrollbar">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-100 mb-6">
             <BrainCircuit size={40} />
          </div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter text-center">Persona Identity</h2>
          <p className="text-slate-500 font-medium text-center mt-2">Design your AI companion's character.</p>
        </div>
        <form onSubmit={handleFinalizeAISetup} className="space-y-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Name</label>
            <input type="text" required placeholder="Name your companion..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 text-lg font-bold text-slate-900 outline-none focus:border-indigo-200" value={aiSetupForm.name} onChange={e => setAiSetupForm({...aiSetupForm, name: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Age</label>
              <input type="number" required className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 text-lg font-bold text-slate-900 outline-none focus:border-indigo-200" value={aiSetupForm.age} onChange={e => setAiSetupForm({...aiSetupForm, age: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Gender</label>
              <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 text-lg font-bold text-slate-900 outline-none appearance-none cursor-pointer" value={aiSetupForm.gender} onChange={e => setAiSetupForm({...aiSetupForm, gender: e.target.value})}>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-4">Persona Details / Traits</label>
            <textarea rows={3} placeholder="Sarcastic, bubbly, kind, deep thinker..." className="w-full bg-slate-50 border-2 border-slate-100 rounded-[2rem] px-8 py-5 text-lg font-bold text-slate-900 outline-none focus:border-indigo-200 resize-none" value={aiSetupForm.traits} onChange={e => setAiSetupForm({...aiSetupForm, traits: e.target.value})} />
          </div>
          <div className="pt-4">
            <Button type="submit" className="w-full h-20 rounded-[2.5rem] bg-slate-900 text-white font-black text-xl hover:bg-slate-800 transition-all flex justify-between px-10 items-center">
              <span>START CONVERSATION</span>
              <ArrowRight size={28} />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );

  if (isAwaitingStart) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#fdfdfd] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-40">
           <div className="absolute top-[20%] right-[-5%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[140px]"></div>
           <div className="absolute bottom-[20%] left-[-5%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[140px]"></div>
        </div>
        {!isAISetupOpen ? (
          <div className="text-center animate-fade-in px-8 flex flex-col items-center">
            <div className="p-8 bg-white border border-slate-100 rounded-[3.5rem] shadow-4xl mb-12 animate-pulse">
              <BrainCircuit size={80} className="text-indigo-600" />
            </div>
            <Button onClick={handleStartConversation} className="py-10 px-16 rounded-[3rem] bg-slate-900 text-white text-3xl font-black tracking-tight shadow-4xl hover:scale-105 transition-all flex items-center gap-8 group">
              <Sparkles size={40} className="text-indigo-400" />
              <span>New Conversation</span>
              <ArrowRight size={40} className="group-hover:translate-x-3 transition-transform" />
            </Button>
            <p className="mt-8 text-slate-400 font-bold uppercase tracking-[0.4em] text-xs">Identity-Based AI Experience</p>
          </div>
        ) : AISetupModal}
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-white text-slate-900 overflow-hidden relative">
      {isAISetupOpen && AISetupModal}

      <aside className={`fixed md:static inset-y-0 left-0 w-80 bg-white border-r border-slate-50 flex flex-col z-50 transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className="flex items-center gap-3 font-black text-3xl text-indigo-600 tracking-tighter">
            <Sparkles size={32} fill="currentColor" />
            <span>Aura</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(false)} className="md:hidden">
            <X size={24} />
          </Button>
        </div>
        <div className="px-6 mb-8">
          <Button className="w-full flex items-center gap-3 bg-slate-900 text-white hover:bg-slate-800 rounded-[2rem] py-6 font-black border-none shadow-3xl shadow-slate-200" onClick={createNewSession}>
            <Plus size={24} />
            <span className="tracking-[0.15em] text-xs">NEW CHAT</span>
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar scroll-smooth">
          <h4 className="px-4 text-[10px] font-black text-slate-300 uppercase tracking-[0.4em] mb-6">History</h4>
          {sessions.map(s => (
            <div key={s.id} onClick={() => { setCurrentSessionId(s.id); setIsSidebarOpen(false); }} className={`group flex items-center justify-between p-5 rounded-[2rem] cursor-pointer transition-all ${currentSessionId === s.id ? 'bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/40' : 'hover:bg-slate-50 text-slate-500'}`}>
              <div className="flex items-center gap-4 overflow-hidden">
                <div className={`p-3 rounded-2xl ${currentSessionId === s.id ? 'bg-white' : 'bg-slate-100'}`}>
                  <MessageSquare size={18} className={currentSessionId === s.id ? 'text-indigo-500' : 'text-slate-400'} />
                </div>
                <span className="truncate text-sm font-bold tracking-tight">{s.aiCharacter?.name || s.title}</span>
              </div>
              <button onClick={(e) => deleteSession(e, s.id)} className="opacity-0 group-hover:opacity-100 p-2 hover:text-red-500 transition-all">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
        <div onClick={() => setIsProfileModalOpen(true)} className="p-6 m-6 rounded-[2.5rem] bg-indigo-50/20 border border-indigo-50 flex items-center gap-4 cursor-pointer hover:bg-indigo-50/40 transition-all group">
          <div className="w-12 h-12 rounded-2xl bg-white border border-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm">
            <User size={24} />
          </div>
          <div className="flex-1 truncate">
            <p className="text-base font-black truncate text-slate-900">{userProfile?.name}</p>
            <p className="text-[10px] text-indigo-400 uppercase font-black tracking-widest">{userProfile?.purpose}</p>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full bg-white">
        <header className="h-20 flex items-center px-6 md:px-10 shrink-0 border-b border-slate-50 bg-white/80 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-4 w-full">
            <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(true)} className="md:hidden p-2">
              <Menu size={24} />
            </Button>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black text-sm uppercase shadow-sm">
                {activeAICharacter.name[0]}
              </div>
              <div className="flex flex-col">
                <h2 className="font-black text-lg text-slate-900 leading-none">{activeAICharacter.name}</h2>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isLoading ? 'animate-pulse' : ''}`}></div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {isLoading ? 'Typing...' : 'Online'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 space-y-12 custom-scrollbar scroll-smooth">
          {(!currentSession || currentSession.messages.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center text-center max-w-lg mx-auto space-y-8 animate-fade-in">
              <div className="p-10 bg-indigo-600 text-white rounded-[3rem] shadow-4xl shadow-indigo-100">
                <Sparkles size={60} />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Hi, {userProfile?.name}!</h1>
                <p className="text-slate-500 font-bold text-lg leading-relaxed">I'm <span className="text-slate-900">{activeAICharacter.name}</span>. Feel free to talk about anything on your mind.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-10 max-w-4xl mx-auto">
              {currentSession.messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`flex items-center gap-2 mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wider`}>
                    <span className={msg.role === 'user' ? 'text-indigo-600' : 'text-slate-600'}>
                      {msg.role === 'user' ? 'You' : activeAICharacter.name}
                    </span>
                    <span className="text-slate-300 select-none">·</span>
                    <span className="font-medium lowercase tracking-normal text-slate-400">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="relative group/bubble max-w-[85%] md:max-w-[75%]">
                    <div className={`rounded-[1.5rem] px-5 py-3.5 text-[16px] font-medium leading-[1.6] shadow-sm transition-all ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-slate-50 text-slate-800 rounded-tl-sm'}`}>
                      {msg.attachment && renderAttachment(msg.attachment)}
                      <div className={msg.attachment ? "mt-3" : ""}>{msg.content}</div>
                    </div>
                    {msg.reactions && msg.reactions.length > 0 && (
                      <div className={`flex gap-1 mt-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.reactions.map(r => (
                          <span key={r} className="bg-white border border-slate-100 shadow-sm rounded-full px-2 py-0.5 text-xs animate-fade-in">{r}</span>
                        ))}
                      </div>
                    )}
                    <div className={`absolute top-0 opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1 bg-white/90 backdrop-blur shadow-lg border border-slate-100 rounded-full p-1 z-10 ${msg.role === 'user' ? '-left-32' : '-right-32'}`}>
                      {REACTION_OPTIONS.map(emoji => (
                        <button key={emoji} onClick={() => handleReact(msg.id, emoji)} className="hover:scale-125 transition-transform p-1 rounded-full hover:bg-slate-100 text-sm">{emoji}</button>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
              {(streamingText || isLoading) && (
                <div className="flex flex-col items-start">
                  <div className="flex items-center gap-2 mb-1.5 px-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    <span className="text-slate-600">{activeAICharacter.name}</span>
                    <span className="text-slate-300">·</span>
                    <span className="animate-pulse font-medium lowercase tracking-normal text-slate-400">Typing...</span>
                  </div>
                  <div className={`rounded-[1.5rem] px-5 py-3.5 text-[16px] font-medium leading-[1.6] shadow-sm bg-slate-50 text-slate-800 rounded-tl-sm min-w-[80px]`}>
                    {streamingText ? (
                      <>{streamingText}<span className="inline-block w-1 h-5 bg-indigo-500 animate-pulse ml-1.5 align-middle" /></>
                    ) : (
                      <div className="flex gap-1.5 items-center justify-center py-2">
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="px-6 pb-8 md:px-12 md:pb-10 bg-white">
          <div className="max-w-4xl mx-auto space-y-4">
            {selectedAttachment && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/50 animate-fade-in shadow-sm">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm">
                  {selectedAttachment.mimeType.startsWith('image/') ? <ImageIcon size={20} /> : <FileText size={20} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{selectedAttachment.fileName}</p>
                  <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest">{selectedAttachment.mimeType}</p>
                </div>
                <button onClick={() => setSelectedAttachment(null)} className="p-2 text-slate-400 hover:text-red-500 transition-all">
                  <X size={14} />
                </button>
              </div>
            )}
            
            <div className="relative flex items-end gap-2 group">
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileChange} accept="image/*,video/*,application/pdf,text/*" />
              <div className="flex-1 relative bg-slate-50 border border-slate-100 rounded-[2rem] flex items-center shadow-inner overflow-hidden">
                {/* Fixed action buttons on the left with consistent spacing */}
                <div className="flex items-center pl-4 pr-2 gap-2">
                  <button onClick={() => fileInputRef.current?.click()} disabled={isCorrecting || !currentSessionId} className="p-2.5 rounded-full text-slate-400 hover:text-indigo-600 hover:bg-white transition-all disabled:opacity-50"><Paperclip size={22} /></button>
                  <button onClick={toggleRecording} disabled={isCorrecting || !currentSessionId} className={`p-2.5 rounded-full transition-all ${isRecording ? 'text-indigo-600 bg-white shadow-sm' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'} disabled:opacity-50`}><Mic size={22} /></button>
                </div>

                {/* Textarea with proper padding to avoid icons */}
                <textarea
                  ref={textareaRef}
                  rows={1}
                  value={inputValue}
                  disabled={isCorrecting || !currentSessionId}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                  placeholder={isRecording ? 'Listening...' : isCorrecting ? 'Refining...' : !currentSessionId ? 'Identity needed...' : `Message ${activeAICharacter.name}...`}
                  className={`flex-1 bg-transparent py-4 text-[16px] font-medium text-slate-900 resize-none outline-none custom-scrollbar transition-all placeholder:text-slate-400 pr-12`}
                  style={{ minHeight: '56px', maxHeight: '160px' }}
                />

                {/* Optional Sparkles button on the far right of the input area */}
                {inputValue.trim().length > 3 && (
                  <div className="absolute right-3 bottom-2.5">
                    <button onClick={handleAutoCorrect} disabled={isCorrecting || isLoading} className={`p-2 rounded-full transition-all ${isCorrecting ? 'text-indigo-600 animate-spin' : 'text-slate-400 hover:text-indigo-600 hover:bg-white'}`} title="Refine Message"><Sparkles size={20} /></button>
                  </div>
                )}
              </div>
              <button onClick={() => handleSendMessage()} disabled={(!inputValue.trim() && !selectedAttachment) || isLoading || isCorrecting || !currentSessionId} className={`p-4 rounded-full transition-all transform active:scale-90 shrink-0 ${ (inputValue.trim() || selectedAttachment) && !isLoading && !isCorrecting && currentSessionId ? 'bg-indigo-600 text-white shadow-lg hover:bg-indigo-700' : 'bg-slate-100 text-slate-300 cursor-not-allowed'}`}>
                <Send size={24} fill="currentColor" />
              </button>
            </div>
          </div>
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]"><ShieldCheck size={14} /> Private</div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]"><Heart size={14} /> Human AI</div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;

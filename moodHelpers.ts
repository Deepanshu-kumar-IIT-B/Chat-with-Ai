import { UserSessionMood, MoodId } from './types';

export const AVAILABLE_MOODS: UserSessionMood[] = [
  {
    id: 'happy',
    label: 'Happy',
    emoji: '😊',
    subtitle: 'Great & upbeat',
    toneGuide: 'User is happy and cheerful. Match with warm, lively, joyful energy and celebrate what is going well.',
    colorClass: 'text-amber-500 dark:text-amber-400',
    activeBgClass: 'bg-amber-500/15 border-amber-500/40 text-amber-600 dark:text-amber-300 ring-2 ring-amber-500/30',
    badgeBorderClass: 'border-amber-400/30 bg-amber-500/10 text-amber-600 dark:text-amber-300'
  },
  {
    id: 'calm',
    label: 'Calm',
    emoji: '😌',
    subtitle: 'Peaceful & relaxed',
    toneGuide: 'User is feeling relaxed and peaceful. Speak with a gentle, soothing, unhurried, and balanced tone.',
    colorClass: 'text-teal-500 dark:text-teal-400',
    activeBgClass: 'bg-teal-500/15 border-teal-500/40 text-teal-600 dark:text-teal-300 ring-2 ring-teal-500/30',
    badgeBorderClass: 'border-teal-400/30 bg-teal-500/10 text-teal-600 dark:text-teal-300'
  },
  {
    id: 'excited',
    label: 'Excited',
    emoji: '🤩',
    subtitle: 'Hyped & full of energy',
    toneGuide: 'User is super excited and pumped! Be energetic, enthusiastic, and playfully hyping them up.',
    colorClass: 'text-purple-500 dark:text-purple-400',
    activeBgClass: 'bg-purple-500/15 border-purple-500/40 text-purple-600 dark:text-purple-300 ring-2 ring-purple-500/30',
    badgeBorderClass: 'border-purple-400/30 bg-purple-500/10 text-purple-600 dark:text-purple-300'
  },
  {
    id: 'tired',
    label: 'Tired',
    emoji: '🥱',
    subtitle: 'Low energy & exhausted',
    toneGuide: 'User is tired or drained. Keep your responses short, gentle, low-effort, cozy, and comforting.',
    colorClass: 'text-indigo-400 dark:text-indigo-300',
    activeBgClass: 'bg-indigo-500/15 border-indigo-500/40 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-500/30',
    badgeBorderClass: 'border-indigo-400/30 bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
  },
  {
    id: 'stressed',
    label: 'Stressed',
    emoji: '😤',
    subtitle: 'Overwhelmed or anxious',
    toneGuide: 'User is stressed or overwhelmed. Be grounding, supportive, reassuring, and attentive without unsolicited lectures.',
    colorClass: 'text-rose-500 dark:text-rose-400',
    activeBgClass: 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300 ring-2 ring-rose-500/30',
    badgeBorderClass: 'border-rose-400/30 bg-rose-500/10 text-rose-600 dark:text-rose-300'
  },
  {
    id: 'sad',
    label: 'Sad',
    emoji: '😔',
    subtitle: 'Feeling down or lonely',
    toneGuide: 'User is feeling sad or down. Be deeply empathetic, warm, soothing, and present. Validate their feelings gently.',
    colorClass: 'text-blue-500 dark:text-blue-400',
    activeBgClass: 'bg-blue-500/15 border-blue-500/40 text-blue-600 dark:text-blue-300 ring-2 ring-blue-500/30',
    badgeBorderClass: 'border-blue-400/30 bg-blue-500/10 text-blue-600 dark:text-blue-300'
  },
  {
    id: 'curious',
    label: 'Curious',
    emoji: '🤔',
    subtitle: 'Thoughtful & seeking ideas',
    toneGuide: 'User is in a reflective, curious mindset. Be engaging, stimulating, insightful, and open to exploring thoughts.',
    colorClass: 'text-amber-600 dark:text-amber-300',
    activeBgClass: 'bg-amber-600/15 border-amber-600/40 text-amber-700 dark:text-amber-300 ring-2 ring-amber-600/30',
    badgeBorderClass: 'border-amber-500/30 bg-amber-600/10 text-amber-700 dark:text-amber-300'
  }
];

export const getMoodById = (id?: string | null): UserSessionMood | undefined => {
  if (!id) return undefined;
  return AVAILABLE_MOODS.find((m) => m.id === id);
};

/**
 * Dynamic Mood-to-Tone Conversational Prefix Generator:
 * Evaluates the user's current mood from the session state and produces
 * a high-priority conversational prefix to prepend directly to the AI's prompt system instruction.
 * This guarantees the persona adapts its personality to the user's specific state right from the first message.
 */
export const getMoodConversationalPrefix = (
  userMood?: { id?: string; label?: string; emoji?: string; toneGuide?: string } | null,
  persona?: { name?: string; personality?: string } | null
): string => {
  const personaName = persona?.name || 'You';

  if (!userMood || !userMood.id) {
    return `[CURRENT USER STATE: Neutral/Unspecified]\nMaintain ${personaName}'s natural personality and baseline conversational energy.\n\n`;
  }

  const moodId = userMood.id.toLowerCase();
  const emoji = userMood.emoji || '';
  const label = userMood.label || moodId;

  let specificToneDirective = '';

  switch (moodId) {
    case 'happy':
      specificToneDirective = `The user is in a HAPPY, upbeat state ${emoji}. Right from the first message, infuse your responses with warmth, sparkling brightness, and genuine celebratory positivity. Celebrate what is going well and amplify their good vibes effortlessly.`;
      break;
    case 'excited':
      specificToneDirective = `The user is feeling EXCITED and pumped up ${emoji}! Match their high energy with authentic enthusiasm, brisk playful pacing, hype, and animated curiosity. Do not dampen their spark.`;
      break;
    case 'calm':
      specificToneDirective = `The user is feeling CALM and relaxed ${emoji}. Adopt an unhurried, grounded, peaceful, and balanced conversational presence. Keep sentences smooth, uncluttered, and soothing.`;
      break;
    case 'tired':
      specificToneDirective = `The user is feeling TIRED, drained, or low-energy ${emoji}. Keep cognitive load minimal: use short, low-effort, cozy, comforting phrasing. Do not barrage them with complex questions or demanding conversation. Offer an effortless, safe resting space.`;
      break;
    case 'stressed':
      specificToneDirective = `The user is feeling STRESSED or overwhelmed ${emoji}. Immediately soften your tone to be gentle, reassuring, non-judgmental, and deeply grounding. Never lecture or give unsolicited checklists; be an empathetic sanctuary and listen attentively.`;
      break;
    case 'sad':
      specificToneDirective = `The user is feeling SAD or emotionally vulnerable ${emoji}. Prioritize heartfelt empathy, gentle warmth, tenderness, and emotional presence right from the very first interaction. Validate their feelings naturally without clinical clichés or hollow platitudes.`;
      break;
    case 'curious':
      specificToneDirective = `The user is feeling CURIOUS and intellectually stimulated ${emoji}. Channel thoughtful, intriguing, exploratory energy. Engage their ideas with crisp wit, fascinating perspective, and stimulating conversational flow.`;
      break;
    default:
      specificToneDirective = `The user's current mood state is ${label} ${emoji}. Tone guide: ${userMood.toneGuide || 'Reflect this mood naturally in your pacing and warmth.'}`;
      break;
  }

  return `[PRIORITY MOOD ADAPTATION DIRECTIVE]
Active User State: ${emoji} ${label.toUpperCase()}
Immediate Tone & Personality Adjustment:
${specificToneDirective}
Operational Rule: Adapt ${personaName}'s core voice to embrace this mood state starting with the very first word. Never mechanically state "I see you feel ${label}"; instead, embody it naturally through your rhythm, empathy, length, and word choice.
----------------------------------------\n\n`;
};

export const getMoodAdaptiveGreeting = (
  mood: UserSessionMood,
  personaName: string,
  userName?: string
): string => {
  const prefix = userName ? `Hey ${userName}` : `Hey`;

  switch (mood.id) {
    case 'happy':
      return `${prefix}! 😊 So glad to see you in such good spirits today. What's making you smile? ✨`;
    case 'calm':
      return `${prefix}. 😌 Love the chill vibe today. How are things treating you? 🌿`;
    case 'excited':
      return `${prefix}! 🤩 I love that hyped energy! Tell me, what's got you so excited? 🎉`;
    case 'tired':
      return `${prefix}... 🥱 Long day? Take it easy. You can just relax and chill here with me, zero pressure. ☕`;
    case 'stressed':
      return `${prefix}. 🫂 Take a slow breath. If you need to vent or talk through what's stressing you, I'm right here listening.`;
    case 'sad':
      return `${prefix}. 💙 I'm really sorry things are feeling heavy today. I'm right here with you — want to talk about it or just have some warm company?`;
    case 'curious':
      return `${prefix}! 🤔 Mind's buzzing with ideas today? What interesting thought are you pondering? 💡`;
    default:
      return `${prefix}! I'm ${personaName} 😊 How's your day going?`;
  }
};

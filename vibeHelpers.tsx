import { Heart, Brain, Zap, Wind, Palette, Moon, Smile, Shield } from 'lucide-react';

export const getPersonalityVibe = (personality: string) => {
  const lower = personality.toLowerCase();
  
  if (/(empathetic|kind|caring|warm|sweet|friendly|supportive|gentle)/.test(lower)) {
    return { trait: 'Warm', colorClass: 'bg-rose-50 text-rose-600 border-rose-200', accentClass: 'bg-rose-500', icon: Heart };
  }
  if (/(logical|analytical|smart|grounded|rational|direct|clever)/.test(lower)) {
    return { trait: 'Analytical', colorClass: 'bg-blue-50 text-blue-600 border-blue-200', accentClass: 'bg-blue-500', icon: Brain };
  }
  if (/(energetic|active|dynamic|adventurous|fun|crazy|exciting)/.test(lower)) {
    return { trait: 'Energetic', colorClass: 'bg-amber-50 text-amber-600 border-amber-200', accentClass: 'bg-amber-500', icon: Zap };
  }
  if (/(calm|peaceful|zen|quiet|chill|relaxed)/.test(lower)) {
    return { trait: 'Calm', colorClass: 'bg-teal-50 text-teal-600 border-teal-200', accentClass: 'bg-teal-500', icon: Wind };
  }
  if (/(creative|artistic|imaginative|dreamer|passionate)/.test(lower)) {
    return { trait: 'Creative', colorClass: 'bg-purple-50 text-purple-600 border-purple-200', accentClass: 'bg-purple-500', icon: Palette };
  }
  if (/(dark|mysterious|edgy|serious|stoic)/.test(lower)) {
    return { trait: 'Mysterious', colorClass: 'bg-slate-100 text-slate-700 border-slate-300', accentClass: 'bg-slate-700', icon: Moon };
  }
  if (/(protective|loyal|brave|strong|bold)/.test(lower)) {
    return { trait: 'Loyal', colorClass: 'bg-indigo-50 text-indigo-600 border-indigo-200', accentClass: 'bg-indigo-500', icon: Shield };
  }

  return { trait: 'Balanced', colorClass: 'bg-zinc-50 text-zinc-600 border-zinc-200', accentClass: 'bg-zinc-400', icon: Smile };
};

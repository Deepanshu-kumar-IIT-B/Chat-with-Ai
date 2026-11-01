import React from 'react';
import { User, Cat, Ghost, Bot, Sparkles, Star, Zap, Flame, Crown, Lightbulb } from 'lucide-react';

export const iconMap: Record<string, React.ElementType> = {
  user: User,
  cat: Cat,
  ghost: Ghost,
  robot: Bot,
  sparkles: Sparkles,
  star: Star,
  zap: Zap,
  flame: Flame,
  crown: Crown,
  lightbulb: Lightbulb,
};

export const predefinedAvatars = [
  { id: 'bot-indigo', iconId: 'robot', colorClass: 'bg-indigo-500 text-white shadow-indigo-500/30' },
  { id: 'sparkles-purple', iconId: 'sparkles', colorClass: 'bg-purple-500 text-white shadow-purple-500/30' },
  { id: 'ghost-rose', iconId: 'ghost', colorClass: 'bg-rose-500 text-white shadow-rose-500/30' },
  { id: 'cat-orange', iconId: 'cat', colorClass: 'bg-orange-500 text-white shadow-orange-500/30' },
  { id: 'star-amber', iconId: 'star', colorClass: 'bg-amber-500 text-white shadow-amber-500/30' },
  { id: 'crown-emerald', iconId: 'crown', colorClass: 'bg-emerald-500 text-white shadow-emerald-500/30' },
  { id: 'zap-blue', iconId: 'zap', colorClass: 'bg-blue-500 text-white shadow-blue-500/30' },
  { id: 'flame-pink', iconId: 'flame', colorClass: 'bg-pink-500 text-white shadow-pink-500/30' },
  { id: 'lightbulb-yellow', iconId: 'lightbulb', colorClass: 'bg-yellow-400 text-yellow-900 shadow-yellow-400/30' },
  { id: 'user-zinc', iconId: 'user', colorClass: 'bg-zinc-700 text-white shadow-zinc-700/30' },
];

export const predefinedIconPaths = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=Aura&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Kai&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=Nova&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/micah/svg?seed=Luna&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/fun-emoji/svg?seed=Max&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/lorelei/svg?seed=Cleo&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/personas/svg?seed=Leo&backgroundColor=ffdfbf',
];

export const getAvatarConfig = (id: string) => {
  return predefinedAvatars.find(a => a.id === id) || predefinedAvatars[0];
};

export const renderAvatarIcon = (iconId: string, size: number = 28) => {
  const Icon = iconMap[iconId] || User;
  return <Icon size={size} />;
};

export const compressImageFile = (file: File, maxDim: number = 320, quality: number = 0.85): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please select a valid image file.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxDim) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            }
          } else {
            if (height > maxDim) {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Failed to load image.'));
        img.src = reader.result;
      } else {
        reject(new Error('Failed to read image file.'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
};


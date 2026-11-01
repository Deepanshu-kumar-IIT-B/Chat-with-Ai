import React from 'react';
import { Briefcase, Palette, Smile, Bot, Gamepad2, PenTool } from 'lucide-react';

export const AVAILABLE_TAGS = [
  { id: 'Work', icon: Briefcase },
  { id: 'Creative', icon: Palette },
  { id: 'Fun', icon: Smile },
  { id: 'Assistant', icon: Bot },
  { id: 'Gaming', icon: Gamepad2 },
  { id: 'Writing', icon: PenTool },
];

export const renderTagIcon = (tagId: string, size: number = 14) => {
  const tag = AVAILABLE_TAGS.find(t => t.id === tagId);
  if (!tag) return null;
  const Icon = tag.icon;
  return <Icon size={size} />;
};

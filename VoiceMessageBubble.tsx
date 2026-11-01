import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Mic } from 'lucide-react';

interface VoiceMessageBubbleProps {
  audioUrl: string;
  duration?: number;
  isUser: boolean;
  timestamp: string;
}

export const VoiceMessageBubble: React.FC<VoiceMessageBubbleProps> = ({
  audioUrl,
  duration = 0,
  isUser,
  timestamp
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize and handle audio events
  useEffect(() => {
    const audio = new Audio(audioUrl);
    audioRef.current = audio;

    const onLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(Math.round(audio.duration));
      }
    };

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audioRef.current = null;
    };
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio play error:', err);
      });
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const targetTime = ratio * (audioDuration || 1);
    audioRef.current.currentTime = targetTime;
    setCurrentTime(targetTime);
  };

  const formatTime = (secs: number) => {
    const s = Math.floor(secs);
    const m = Math.floor(s / 60);
    const remainder = s % 60;
    return `${m}:${remainder < 10 ? '0' : ''}${remainder}`;
  };

  // Fixed pseudo waveform heights for Telegram-style sound wave representation
  const WAVE_BARS = [
    30, 45, 75, 40, 60, 90, 80, 50, 65, 40,
    85, 95, 70, 55, 40, 75, 90, 60, 50, 80,
    65, 45, 35, 60
  ];

  const progressRatio = audioDuration > 0 ? currentTime / audioDuration : 0;

  return (
    <div
      className={`px-4 py-3 rounded-2xl flex flex-col gap-2 w-full max-w-full min-w-0 box-border ${
        isUser
          ? 'btn-glass-blush text-white shadow-md shadow-purple-500/15 rounded-br-xs'
          : 'bg-[var(--surface-glass)] backdrop-blur-xl text-[var(--text-primary)] border border-[var(--border)] rounded-bl-xs shadow-xs'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlay}
          className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-90 cursor-pointer ${
            isUser
              ? 'bg-white/20 hover:bg-white/30 text-white'
              : 'bg-[var(--accent)] text-white hover:opacity-90'
          }`}
          aria-label={isPlaying ? 'Pause voice message' : 'Play voice message'}
        >
          {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
        </button>

        {/* Telegram-style Interactive Waveform */}
        <div className="flex-1 flex flex-col justify-center min-w-0">
          <div
            onClick={handleSeek}
            className="flex items-center gap-[3px] h-8 cursor-pointer py-1 select-none"
            title="Click to seek"
          >
            {WAVE_BARS.map((heightPercent, idx) => {
              const barRatio = idx / WAVE_BARS.length;
              const isPast = barRatio <= progressRatio;
              return (
                <div
                  key={idx}
                  className={`flex-1 rounded-full transition-colors duration-150 ${
                    isUser
                      ? isPast
                        ? 'bg-white'
                        : 'bg-white/35'
                      : isPast
                        ? 'bg-[var(--accent)]'
                        : 'bg-[var(--border)]'
                  }`}
                  style={{
                    height: `${heightPercent}%`,
                    minHeight: '4px'
                  }}
                />
              );
            })}
          </div>

          {/* Time & Indicator */}
          <div className="flex items-center justify-between text-[11px] font-semibold opacity-85 mt-0.5">
            <span className="flex items-center gap-1">
              <Mic size={10} />
              <span>{isPlaying ? formatTime(currentTime) : formatTime(audioDuration)}</span>
            </span>
            <span className="text-[10px] opacity-75">{timestamp}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  Headphones, 
  SkipForward, 
  SkipBack,
  CheckCircle2,
  ListMusic
} from 'lucide-react';
import { AudioChunk, PreferredLanguage } from '../types/report';

interface VoiceExplainerProps {
  chunks: AudioChunk[];
  preferredLanguage: PreferredLanguage;
}

export const VoiceExplainer: React.FC<VoiceExplainerProps> = ({
  chunks,
  preferredLanguage,
}) => {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const activeChunk = chunks[currentChunkIndex] || chunks[0];

  // Language display text
  const getLanguageLabel = (lang: PreferredLanguage) => {
    if (lang === 'tamil') return 'Tamil (தமிழ்)';
    if (lang === 'hindi') return 'Hindi (हिन्दी)';
    return 'English';
  };

  useEffect(() => {
    // Reset time when chunk changes
    setCurrentTime(0);
    setIsPlaying(false);
    setPlaybackError(null);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.load();
    }
  }, [currentChunkIndex]);

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio playback prevented or failed:', e);
        setIsPlaying(false);
        setPlaybackError('Audio playback failed. Check that the backend audio file is reachable.');
      });
    }
  };

  const handleAudioError = () => {
    setIsPlaying(false);
    setPlaybackError('Audio could not be loaded. The voice file may be unavailable.');
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || activeChunk.duration_seconds || 0);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    // Auto-advance to next chunk if available
    if (currentChunkIndex < chunks.length - 1) {
      const nextIndex = currentChunkIndex + 1;
      setCurrentChunkIndex(nextIndex);
      // Give browser time to load next source then auto play
      setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }, 300);
    } else {
      setCurrentTime(0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = () => {
    const speeds = [1, 1.25, 1.5, 0.75];
    const nextSpeed = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length];
    setPlaybackSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!chunks || chunks.length === 0) {
    return null;
  }

  return (
    <div 
      className="p-5 sm:p-6 rounded-2xl bg-linear-to-br from-teal-900 via-slate-900 to-slate-900 text-white shadow-md border border-teal-800/40"
      id="voice-explanation-section"
    >
      {/* Hidden HTML audio element */}
      <audio
        ref={audioRef}
        src={activeChunk.audio_url}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleAudioEnded}
        onError={handleAudioError}
      />

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
            <Headphones className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight">Listen to Your Explanation</h2>
            <div className="flex items-center gap-2 text-xs text-teal-200/80 mt-0.5">
              <span>Language: <strong className="text-white font-semibold">{getLanguageLabel(preferredLanguage)}</strong></span>
              <span>•</span>
              <span>{chunks.length} {chunks.length === 1 ? 'Audio Part' : 'Sequential Parts'}</span>
            </div>
          </div>
        </div>

        {/* Chunk selector tabs if multiple chunks */}
        {chunks.length > 1 && (
          <div className="flex items-center gap-1.5 p-1 bg-white/10 rounded-lg text-xs" id="audio-chunks-nav">
            {chunks.map((chunk, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentChunkIndex(idx)}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                  currentChunkIndex === idx
                    ? 'bg-teal-500 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                Part {chunk.chunk_index || idx + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active Chunk Title & Animated Waveform */}
      <div className="py-4 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-teal-300 font-semibold uppercase tracking-wider">
            Now Playing Part {activeChunk.chunk_index || currentChunkIndex + 1} of {chunks.length}
          </p>
          <p className="text-sm font-medium text-slate-100 truncate mt-0.5">
            {activeChunk.title || `Diagnostic audio summary (${activeChunk.language_code})`}
          </p>
        </div>

        {/* Dynamic Sound Wave visualizer bars */}
        <div className="flex items-center gap-1 shrink-0 h-6">
          {[40, 75, 100, 60, 85, 45, 90, 60].map((h, i) => (
            <span
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying
                  ? 'bg-teal-400 animate-pulse'
                  : 'bg-slate-600 h-2'
              }`}
              style={{
                height: isPlaying ? `${Math.max(4, (h * (i % 2 === 0 ? 0.9 : 0.6)) / 3.5)}px` : '4px',
                animationDelay: `${i * 90}ms`,
              }}
            />
          ))}
        </div>
      </div>
      {playbackError && (
        <p className="text-sm text-amber-200 bg-amber-950/40 border border-amber-500/30 rounded-lg px-3 py-2" role="alert">
          {playbackError}
        </p>
      )}

      {/* Scrubber / Progress bar */}
      <div className="space-y-1.5 pt-1">
        <input
          type="range"
          min="0"
          max={duration || activeChunk.duration_seconds || 100}
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-teal-400"
          id="audio-seek-slider"
        />
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration || activeChunk.duration_seconds || 0)}</span>
        </div>
      </div>

      {/* Media Controls Bar */}
      <div className="mt-4 flex items-center justify-between pt-2 border-t border-white/10">
        {/* Speed button */}
        <button
          type="button"
          onClick={handleSpeedChange}
          className="px-2.5 py-1 text-xs font-semibold text-teal-200 bg-white/10 hover:bg-white/15 rounded-md transition-colors"
          title="Change playback speed"
          id="audio-speed-btn"
        >
          {playbackSpeed}x
        </button>

        {/* Center transport buttons */}
        <div className="flex items-center gap-3">
          {/* Previous chunk button */}
          <button
            type="button"
            onClick={() => setCurrentChunkIndex(Math.max(0, currentChunkIndex - 1))}
            disabled={currentChunkIndex === 0}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Previous audio section"
            id="audio-prev-chunk-btn"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Main Play / Pause Button */}
          <button
            type="button"
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-teal-500 hover:bg-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-teal-500/25 transition-all active:scale-95"
            id="audio-play-pause-btn"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-slate-950" />
            ) : (
              <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
            )}
          </button>

          {/* Next chunk button */}
          <button
            type="button"
            onClick={() => setCurrentChunkIndex(Math.min(chunks.length - 1, currentChunkIndex + 1))}
            disabled={currentChunkIndex >= chunks.length - 1}
            className="p-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:hover:text-slate-400 transition-colors"
            title="Next audio section"
            id="audio-next-chunk-btn"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Mute button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-2 text-slate-300 hover:text-white transition-colors"
          title={isMuted ? 'Unmute' : 'Mute'}
          id="audio-mute-btn"
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

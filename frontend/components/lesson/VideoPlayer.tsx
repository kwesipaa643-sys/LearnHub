'use client';
// components/lesson/VideoPlayer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import {
  Play, Pause, Volume2, VolumeX, Settings, Maximize, Minimize,
  SkipForward, SkipBack, FileText, Loader2,
} from 'lucide-react';
import { enrollmentApi, notesApi } from '@/lib/api';
import { LessonNote } from '@/types/api';

interface Props {
  videoUrl: string;
  playbackId?: string;
  lessonId: number;
  courseId: number;
  duration: number;
  onComplete?: () => void;
  notes?: LessonNote[];
  onNoteAdded?: () => void;
}

export function VideoPlayer({ videoUrl, lessonId, courseId, duration, onComplete, notes = [], onNoteAdded }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout>();
  const lastSavedRef = useRef(0);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimer = useRef<NodeJS.Timeout>();

  const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2];

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoUrl) return;

    if (Hls.isSupported() && videoUrl.includes('.m3u8')) {
      const hls = new Hls({ startLevel: -1 }); // auto quality
      hlsRef.current = hls;
      hls.loadSource(videoUrl);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => setLoading(false));
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = videoUrl;
      setLoading(false);
    } else {
      video.src = videoUrl;
      setLoading(false);
    }

    return () => {
      hlsRef.current?.destroy();
    };
  }, [videoUrl]);

  // Video event listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      // Update buffered
      if (video.buffered.length > 0) {
        setBuffered(video.buffered.end(video.buffered.length - 1));
      }
    };
    const onEnded = () => {
      setPlaying(false);
      saveProgress(true);
    };
    const onWaiting = () => setLoading(true);
    const onPlaying = () => setLoading(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Auto-save progress every 15s while playing
  useEffect(() => {
    if (playing) {
      progressTimerRef.current = setInterval(() => saveProgress(false), 15000);
    } else {
      clearInterval(progressTimerRef.current);
    }
    return () => clearInterval(progressTimerRef.current);
  }, [playing, currentTime]);

  const saveProgress = useCallback(async (completed = false) => {
    if (!videoRef.current) return;
    const ct = videoRef.current.currentTime;
    const pct = duration > 0 ? (ct / duration) * 100 : 0;

    // Don't save if hasn't moved much
    if (!completed && Math.abs(ct - lastSavedRef.current) < 5) return;
    lastSavedRef.current = ct;

    const shouldComplete = completed || pct >= 90;

    try {
      await enrollmentApi.updateProgress({
        lesson_id: lessonId,
        watch_seconds: Math.floor(ct),
        watch_percent: pct,
        is_completed: shouldComplete,
      });
      if (shouldComplete) onComplete?.();
    } catch {}
  }, [lessonId, duration, onComplete]);

  // Controls auto-hide
  const resetControlsTimer = useCallback(() => {
    setShowControls(true);
    clearTimeout(controlsTimer.current);
    controlsTimer.current = setTimeout(() => {
      if (playing) setShowControls(false);
    }, 3000);
  }, [playing]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    playing ? video.pause() : video.play();
  };

  const seek = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    video.currentTime = pct * (duration || video.duration);
  };

  const skip = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    if (videoRef.current) videoRef.current.volume = v;
    setMuted(v === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const setPlaybackSpeed = (s: number) => {
    setSpeed(s);
    if (videoRef.current) videoRef.current.playbackRate = s;
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setFullscreen(true);
    } else {
      document.exitFullscreen();
      setFullscreen(false);
    }
  };

  const addNote = async () => {
    if (!noteText.trim()) return;
    setSavingNote(true);
    try {
      await notesApi.create(lessonId, {
        content: noteText,
        timestamp_seconds: Math.floor(videoRef.current?.currentTime ?? 0),
      });
      setNoteText('');
      onNoteAdded?.();
    } finally {
      setSavingNote(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div className="flex flex-col">
      {/* Player */}
      <div
        ref={containerRef}
        className="relative bg-black select-none"
        style={{ aspectRatio: '16/9' }}
        onMouseMove={resetControlsTimer}
        onClick={togglePlay}
      >
        <video ref={videoRef} className="w-full h-full" playsInline />

        {/* Loading spinner */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-10 h-10 text-white animate-spin" />
          </div>
        )}

        {/* Center play indicator */}
        {!playing && !loading && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-20 h-20 bg-black/50 rounded-full flex items-center justify-center">
              <Play className="w-10 h-10 text-white fill-current ml-1" />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className={`absolute bottom-0 left-0 right-0 transition-opacity duration-300 ${showControls || !playing ? 'opacity-100' : 'opacity-0'}`}
          onClick={(e) => e.stopPropagation()}>
          {/* Progress bar */}
          <div ref={progressRef} className="relative h-1 mx-3 mb-2 cursor-pointer group"
            style={{ height: '4px' }} onClick={seek}>
            <div className="absolute inset-0 bg-white/20 rounded-full" />
            <div className="absolute inset-0 bg-white/40 rounded-full" style={{ width: `${bufferedPct}%` }} />
            <div className="absolute inset-0 bg-primary rounded-full" style={{ width: `${progressPct}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ left: `calc(${progressPct}% - 6px)` }} />
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-3 px-3 pb-3 bg-gradient-to-t from-black/80 to-transparent">
            {/* Play/Pause */}
            <button onClick={togglePlay} className="text-white hover:text-primary transition-colors">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip */}
            <button onClick={() => skip(-10)} className="text-white hover:text-primary transition-colors">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={() => skip(10)} className="text-white hover:text-primary transition-colors">
              <SkipForward className="w-4 h-4" />
            </button>

            {/* Volume */}
            <button onClick={toggleMute} className="text-white hover:text-primary transition-colors">
              {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
              onChange={handleVolume} className="w-16 accent-primary" />

            {/* Time */}
            <span className="text-white text-xs font-mono ml-1">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Speed */}
            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="text-white hover:text-primary text-xs font-bold transition-colors">
                {speed}x
              </button>
              {showSpeedMenu && (
                <div className="absolute bottom-full right-0 mb-2 bg-gray-900 rounded-lg py-1 min-w-16 shadow-lg">
                  {SPEEDS.map((s) => (
                    <button key={s} onClick={() => setPlaybackSpeed(s)}
                      className={`block w-full text-right px-4 py-1.5 text-xs transition-colors ${
                        speed === s ? 'text-primary font-bold' : 'text-white hover:bg-white/10'
                      }`}>
                      {s}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notes */}
            <button onClick={() => setShowNotes(!showNotes)}
              className={`transition-colors ${showNotes ? 'text-primary' : 'text-white hover:text-primary'}`}>
              <FileText className="w-4 h-4" />
            </button>

            {/* Fullscreen */}
            <button onClick={toggleFullscreen} className="text-white hover:text-primary transition-colors">
              {fullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Notes panel */}
      {showNotes && (
        <div className="bg-card border border-border rounded-b-xl p-4">
          <h4 className="font-semibold text-sm mb-3">Notes at {formatTime(currentTime)}</h4>
          <div className="flex gap-2 mb-4">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add a note at this timestamp..."
              rows={2}
              className="flex-1 px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
            <button onClick={addNote} disabled={savingNote || !noteText.trim()}
              className="h-9 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 self-end">
              {savingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
            </button>
          </div>

          {notes.length > 0 && (
            <div className="space-y-2">
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3 p-2.5 bg-muted/50 rounded-lg">
                  {note.timestamp_seconds != null && (
                    <button
                      onClick={() => { if (videoRef.current) videoRef.current.currentTime = note.timestamp_seconds!; }}
                      className="text-xs text-primary font-mono whitespace-nowrap hover:underline flex-shrink-0">
                      {formatTime(note.timestamp_seconds)}
                    </button>
                  )}
                  <p className="text-sm flex-1">{note.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

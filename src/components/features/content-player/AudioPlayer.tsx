"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Play, Pause, Bookmark, Headphones, FileText } from "lucide-react";
import { AudioPlayerProps, PLAYBACK_SPEEDS, PlaybackSpeed } from "./types";

export function AudioPlayer({
  audioUrl,
  title,
  className,
  onTimestampCapture,
  transcript,
  wordTimestamps,
  onWordClick,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTranscript, setShowTranscript] = useState(false);

  // Build plain transcript text from wordTimestamps (with line breaks for dialogues)
  const transcriptText = wordTimestamps && wordTimestamps.length > 0
    ? wordTimestamps.map(w => w.word === "\n" ? "\n" : w.word).join(" ").replace(/ \n /g, "\n")
    : transcript || null;

  const hasTranscript = !!transcriptText;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Update buffered amount
      if (audio.buffered.length > 0) {
        setBuffered(audio.buffered.end(audio.buffered.length - 1));
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);
    const handleError = () => {
      setError("Failed to load audio");
      setIsLoading(false);
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (err) {
      console.error("Playback failed:", err);
      setError("Playback failed");
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audio.currentTime = percent * duration;
  };

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  };

  const captureTimestamp = () => {
    onTimestampCapture?.(currentTime);
  };

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  if (error) {
    return (
      <div
        className={cn(
          "rounded-xl bg-red-500/10 border border-red-500/20 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3 text-red-400">
          <Headphones className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-gradient-to-r from-purple-500/10 to-indigo-500/10 border border-purple-500/20 p-4",
        className
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-purple-500/20">
          <Headphones className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-purple-300 truncate">{title}</h3>
          <p className="text-xs text-muted-foreground">Podcast / Audio</p>
        </div>
      </div>

      {/* Progress bar with buffer indicator */}
      <div
        className="h-2 bg-white/10 rounded-full cursor-pointer mb-4 relative overflow-hidden group"
        onClick={handleSeek}
      >
        {/* Buffered indicator */}
        <div
          className="absolute h-full bg-white/10 rounded-full transition-all"
          style={{ width: `${bufferedProgress}%` }}
        />
        {/* Progress indicator */}
        <div
          className="absolute h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Scrubber dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
          style={{ left: `calc(${progress}% - 6px)` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <Button
            size="icon"
            onClick={togglePlay}
            className="bg-purple-600 hover:bg-purple-700 rounded-full h-10 w-10"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </Button>

          {/* Time display */}
          <span className="text-sm text-muted-foreground font-mono min-w-[80px]">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Transcript toggle */}
          {hasTranscript && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowTranscript(!showTranscript)}
              className={cn(
                "hover:bg-purple-500/20",
                showTranscript ? "text-purple-300 bg-purple-500/10" : "text-muted-foreground"
              )}
              title={showTranscript ? "Hide transcript" : "Show transcript"}
            >
              <FileText className="h-4 w-4" />
            </Button>
          )}

          {/* Timestamp capture */}
          {onTimestampCapture && (
            <Button
              size="sm"
              variant="ghost"
              onClick={captureTimestamp}
              className="text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
            >
              <Bookmark className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Save</span>
            </Button>
          )}

          {/* Playback speed */}
          <select
            value={playbackSpeed}
            onChange={(e) =>
              handleSpeedChange(parseFloat(e.target.value) as PlaybackSpeed)
            }
            className="bg-white/10 text-sm rounded px-2 py-1.5 border border-purple-500/20 outline-none cursor-pointer hover:bg-white/15 transition-colors"
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Static transcript */}
      {showTranscript && transcriptText && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-lg bg-white/5 border border-purple-500/10 p-4 leading-relaxed text-foreground/80 whitespace-pre-line text-sm">
          {transcriptText}
        </div>
      )}
    </div>
  );
}

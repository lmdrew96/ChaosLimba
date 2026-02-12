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
    } catch {
      // Error handled via state
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
          "rounded-xl bg-destructive/10 border border-destructive/20 p-4",
          className
        )}
      >
        <div className="flex items-center gap-3 text-destructive">
          <Headphones className="h-5 w-5" />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl bg-primary/10 border border-primary/20 p-4",
        className
      )}
    >
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-3 rounded-lg bg-primary/20">
          <Headphones className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-primary truncate">{title}</h3>
          <p className="text-xs text-muted-foreground">Podcast / Audio</p>
        </div>
      </div>

      {/* Progress bar with buffer indicator */}
      <div
        className="h-2 bg-muted/20 rounded-full cursor-pointer mb-4 relative overflow-hidden group"
        onClick={handleSeek}
        role="slider"
        aria-label="Audio progress"
        aria-valuemin={0}
        aria-valuemax={Math.round(duration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatTime(currentTime)} of ${formatTime(duration)}`}
        tabIndex={0}
        onKeyDown={(e) => {
          const audio = audioRef.current;
          if (!audio || !duration) return;
          if (e.key === "ArrowRight") { audio.currentTime = Math.min(duration, audio.currentTime + 5); }
          if (e.key === "ArrowLeft") { audio.currentTime = Math.max(0, audio.currentTime - 5); }
        }}
      >
        {/* Buffered indicator */}
        <div
          className="absolute h-full bg-muted/20 rounded-full transition-all"
          style={{ width: `${bufferedProgress}%` }}
        />
        {/* Progress indicator */}
        <div
          className="absolute h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
        {/* Scrubber dot */}
        <div
          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
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
            className="bg-primary hover:bg-primary/80 rounded-full h-10 w-10"
            disabled={isLoading}
            aria-label={isLoading ? "Loading audio" : isPlaying ? "Pause" : "Play"}
          >
            {isLoading ? (
              <div className="h-4 w-4 border-2 border-foreground/30 border-t-foreground rounded-full animate-spin" />
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
                "hover:bg-primary/20",
                showTranscript ? "text-primary bg-primary/10" : "text-muted-foreground"
              )}
              aria-label={showTranscript ? "Hide transcript" : "Show transcript"}
              aria-expanded={showTranscript}
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
              className="text-chart-3 hover:bg-chart-3/20 hover:text-chart-3/80"
              aria-label={`Save timestamp at ${formatTime(currentTime)}`}
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
            className="bg-muted/20 text-sm rounded px-2 py-1.5 border border-primary/20 outline-none cursor-pointer hover:bg-muted/30 transition-colors"
            aria-label="Playback speed"
          >
            {PLAYBACK_SPEEDS.map((speed) => (
              <option key={speed} value={speed}>
                {speed}x
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transcript */}
      {showTranscript && hasTranscript && (
        <div className="mt-4 max-h-48 overflow-y-auto rounded-lg bg-muted/20 border border-primary/10 p-4 leading-relaxed text-sm">
          {onWordClick ? (
            // Clickable words mode (Deep Fog — tap word to capture for Mystery Shelf)
            transcriptText!.split(/(\n)/).map((line, li) =>
              line === "\n" ? (
                <div key={li} className="w-full h-2" />
              ) : (
                <span key={li}>
                  {line.split(/\s+/).filter(Boolean).map((word, wi) => (
                    <span
                      key={wi}
                      onClick={() => onWordClick(word, line)}
                      className="cursor-pointer rounded px-0.5 py-0.5 inline-block hover:bg-primary/20 hover:text-primary text-foreground/80 transition-colors"
                    >
                      {word}{" "}
                    </span>
                  ))}
                </span>
              )
            )
          ) : (
            // Plain text mode
            <p className="text-foreground/80 whitespace-pre-line">{transcriptText}</p>
          )}
        </div>
      )}
    </div>
  );
}

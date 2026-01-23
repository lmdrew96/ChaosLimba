"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Play,
  Pause,
  Maximize,
  Minimize,
  Bookmark,
  Volume2,
  VolumeX,
} from "lucide-react";
import { VideoPlayerProps, PLAYBACK_SPEEDS, PlaybackSpeed } from "./types";

// YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number; target: YTPlayer }) => void;
          };
        }
      ) => YTPlayer;
      PlayerState: {
        PLAYING: number;
        PAUSED: number;
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YTPlayer {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setPlaybackRate: (rate: number) => void;
  getPlaybackRate: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  destroy: () => void;
}

// Track API loading state globally
let apiLoaded = false;
let apiLoading = false;
const apiCallbacks: (() => void)[] = [];

function loadYouTubeAPI(callback: () => void) {
  if (apiLoaded) {
    callback();
    return;
  }

  apiCallbacks.push(callback);

  if (apiLoading) return;

  apiLoading = true;

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true;
    apiCallbacks.forEach((cb) => cb());
    apiCallbacks.length = 0;
  };
}

export function VideoPlayer({
  youtubeId,
  startTime = 0,
  endTime,
  title,
  className,
  onTimestampCapture,
}: VideoPlayerProps) {
  const playerRef = useRef<YTPlayer | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const playerIdRef = useRef(`yt-player-${youtubeId}-${Date.now()}`);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(startTime);
  const [duration, setDuration] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<PlaybackSpeed>(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [showControls, setShowControls] = useState(true);

  const effectiveDuration = endTime
    ? endTime - startTime
    : duration - startTime;

  const initPlayer = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    const playerVars: Record<string, number | string> = {
      start: startTime,
      enablejsapi: 1,
      modestbranding: 1,
      rel: 0,
      controls: 0,
      showinfo: 0,
      iv_load_policy: 3,
      origin: typeof window !== "undefined" ? window.location.origin : "",
    };

    // Only add end time if specified
    if (endTime !== undefined) {
      playerVars.end = endTime;
    }

    playerRef.current = new window.YT.Player(playerIdRef.current, {
      videoId: youtubeId,
      playerVars,
      events: {
        onReady: (event) => {
          setDuration(event.target.getDuration());
          setIsReady(true);
        },
        onStateChange: (event) => {
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING);

          // Enforce end time boundary
          if (endTime && event.target.getCurrentTime() >= endTime) {
            event.target.pauseVideo();
            event.target.seekTo(startTime, true);
          }
        },
      },
    });
  }, [youtubeId, startTime, endTime]);

  // Load YouTube IFrame API
  useEffect(() => {
    loadYouTubeAPI(initPlayer);

    return () => {
      playerRef.current?.destroy();
    };
  }, [initPlayer]);

  // Update current time periodically
  useEffect(() => {
    if (!isPlaying || !playerRef.current) return;

    const interval = setInterval(() => {
      const time = playerRef.current?.getCurrentTime() || 0;
      setCurrentTime(time);

      // Enforce boundaries
      if (time < startTime) {
        playerRef.current?.seekTo(startTime, true);
      }
      if (endTime && time >= endTime) {
        playerRef.current?.pauseVideo();
        playerRef.current?.seekTo(startTime, true);
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isPlaying, startTime, endTime]);

  // Hide controls after inactivity
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    const timeout = setTimeout(() => setShowControls(false), 3000);
    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      playerRef.current?.pauseVideo();
    } else {
      playerRef.current?.playVideo();
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!playerRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const seekTime = startTime + percent * effectiveDuration;

    // Enforce boundaries
    const clampedTime = Math.max(
      startTime,
      Math.min(seekTime, endTime || duration)
    );
    playerRef.current.seekTo(clampedTime, true);
    setCurrentTime(clampedTime);
  };

  const handleSpeedChange = (speed: PlaybackSpeed) => {
    setPlaybackSpeed(speed);
    playerRef.current?.setPlaybackRate(speed);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      playerRef.current?.unMute();
    } else {
      playerRef.current?.mute();
    }
    setIsMuted(!isMuted);
  };

  const captureTimestamp = () => {
    onTimestampCapture?.(currentTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress =
    effectiveDuration > 0
      ? ((currentTime - startTime) / effectiveDuration) * 100
      : 0;

  return (
    <div
      ref={containerRef}
      className={cn("relative rounded-xl overflow-hidden bg-black", className)}
      onMouseMove={() => setShowControls(true)}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* YouTube iframe container */}
      <div className="aspect-video relative">
        <div id={playerIdRef.current} className="w-full h-full" />

        {/* Click overlay for play/pause */}
        <div
          className="absolute inset-0 cursor-pointer z-10"
          onClick={togglePlay}
        />
      </div>

      {/* Custom controls overlay */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 pt-12 transition-opacity duration-300 z-20",
          showControls ? "opacity-100" : "opacity-0"
        )}
      >
        {/* Progress bar */}
        <div
          className="h-1.5 bg-white/20 rounded-full cursor-pointer mb-3 group"
          onClick={handleSeek}
        >
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full relative transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg" />
          </div>
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={togglePlay}
              className="text-white hover:bg-white/20"
              disabled={!isReady}
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5 ml-0.5" />
              )}
            </Button>

            {/* Mute toggle */}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={toggleMute}
              className="text-white hover:bg-white/20"
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>

            {/* Time display */}
            <span className="text-white text-sm font-mono">
              {formatTime(currentTime - startTime)} /{" "}
              {formatTime(effectiveDuration)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Timestamp capture */}
            {onTimestampCapture && (
              <Button
                size="sm"
                variant="ghost"
                onClick={captureTimestamp}
                className="text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
              >
                <Bookmark className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Save Timestamp</span>
              </Button>
            )}

            {/* Playback speed */}
            <select
              value={playbackSpeed}
              onChange={(e) =>
                handleSpeedChange(parseFloat(e.target.value) as PlaybackSpeed)
              }
              className="bg-white/10 text-white text-sm rounded px-2 py-1 border-none outline-none cursor-pointer hover:bg-white/20 transition-colors"
            >
              {PLAYBACK_SPEEDS.map((speed) => (
                <option key={speed} value={speed} className="bg-gray-900">
                  {speed}x
                </option>
              ))}
            </select>

            {/* Fullscreen */}
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/20"
            >
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {!isReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
          <div className="text-white text-sm">Loading video...</div>
        </div>
      )}
    </div>
  );
}

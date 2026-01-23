"use client";

import { cn } from "@/lib/utils";
import { VideoPlayer } from "./VideoPlayer";
import { AudioPlayer } from "./AudioPlayer";
import { TextReader } from "./TextReader";
import { ContentPlayerProps } from "./types";
import { Loader2, AlertCircle } from "lucide-react";

export function ContentPlayer({
  content,
  className,
  onTimestampCapture,
  onWordClick,
}: ContentPlayerProps) {
  if (!content) {
    return (
      <div
        className={cn(
          "rounded-xl bg-muted/30 p-8 flex flex-col items-center justify-center",
          className
        )}
      >
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">Loading content...</p>
      </div>
    );
  }

  switch (content.type) {
    case "video":
      if (!content.youtubeId) {
        return (
          <div
            className={cn(
              "rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3",
              className
            )}
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">
              Video content is missing a YouTube ID
            </span>
          </div>
        );
      }
      return (
        <VideoPlayer
          youtubeId={content.youtubeId}
          startTime={content.startTime ?? undefined}
          endTime={content.endTime ?? undefined}
          title={content.title}
          className={className}
          onTimestampCapture={onTimestampCapture}
        />
      );

    case "audio":
      if (!content.audioUrl) {
        return (
          <div
            className={cn(
              "rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3",
              className
            )}
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">
              Audio content is missing a URL
            </span>
          </div>
        );
      }
      return (
        <AudioPlayer
          audioUrl={content.audioUrl}
          title={content.title}
          className={className}
          onTimestampCapture={onTimestampCapture}
        />
      );

    case "text":
      if (!content.textContent) {
        return (
          <div
            className={cn(
              "rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-center gap-3",
              className
            )}
          >
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <span className="text-red-400">Text content is empty</span>
          </div>
        );
      }
      return (
        <TextReader
          content={content.textContent}
          title={content.title}
          className={className}
          onWordClick={onWordClick}
        />
      );

    default:
      return (
        <div
          className={cn(
            "rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4 flex items-center gap-3",
            className
          )}
        >
          <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-400">
            Unknown content type: {content.type}
          </span>
        </div>
      );
  }
}

"use client";

import { cn } from "@/lib/utils";
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
    case "audio": {
      if (!content.audioUrl) {
        return (
          <div
            className={cn(
              "rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3",
              className
            )}
          >
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-destructive">
              Audio content is missing a URL
            </span>
          </div>
        );
      }
      const features = content.languageFeatures as Record<string, unknown> | null;
      const wordTimestamps = features?.wordTimestamps as
        | { word: string; start: number; end: number }[]
        | undefined;
      return (
        <AudioPlayer
          audioUrl={content.audioUrl}
          title={content.title}
          className={className}
          onTimestampCapture={onTimestampCapture}
          transcript={content.transcript ?? undefined}
          wordTimestamps={wordTimestamps}
          onWordClick={onWordClick}
        />
      );
    }

    case "text":
      if (!content.textContent) {
        return (
          <div
            className={cn(
              "rounded-xl bg-destructive/10 border border-destructive/20 p-4 flex items-center gap-3",
              className
            )}
          >
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-destructive">Text content is empty</span>
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
            "rounded-xl bg-chart-3/10 border border-chart-3/20 p-4 flex items-center gap-3",
            className
          )}
        >
          <AlertCircle className="h-5 w-5 text-chart-3 flex-shrink-0" />
          <span className="text-chart-3">
            Unknown content type: {content.type}
          </span>
        </div>
      );
  }
}

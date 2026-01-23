"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { BookOpen } from "lucide-react";
import { TextReaderProps } from "./types";

export function TextReader({
  content,
  title,
  className,
  onWordClick,
}: TextReaderProps) {
  const [selectedWord, setSelectedWord] = useState<string | null>(null);

  // Memoize the word extraction to prevent re-renders
  const extractWordContext = useCallback(
    (word: string, fullContent: string) => {
      const wordIndex = fullContent.toLowerCase().indexOf(word.toLowerCase());
      if (wordIndex === -1) return `...${word}...`;

      const contextStart = Math.max(0, wordIndex - 40);
      const contextEnd = Math.min(
        fullContent.length,
        wordIndex + word.length + 40
      );
      let context = fullContent.slice(contextStart, contextEnd);

      // Add ellipsis if we're not at the start/end
      if (contextStart > 0) context = "..." + context;
      if (contextEnd < fullContent.length) context = context + "...";

      return context;
    },
    []
  );

  // Parse content into clickable words
  const renderedContent = useMemo(() => {
    // Split by whitespace while preserving it
    const segments = content.split(/(\s+)/);

    return segments.map((segment, index) => {
      // Skip whitespace segments - just render them
      if (/^\s+$/.test(segment)) {
        return <span key={index}>{segment}</span>;
      }

      // Try to extract Romanian word with diacritics
      // Pattern: optional punctuation + word + optional punctuation
      const wordMatch = segment.match(
        /^([^a-zA-ZăâîșțĂÂÎȘȚéÉ]*)?([a-zA-ZăâîșțĂÂÎȘȚéÉ]+(?:-[a-zA-ZăâîșțĂÂÎȘȚéÉ]+)?)([^a-zA-ZăâîșțĂÂÎȘȚéÉ]*)?$/i
      );

      if (!wordMatch) {
        // No word found, just render the segment
        return <span key={index}>{segment}</span>;
      }

      const [, prefix = "", word, suffix = ""] = wordMatch;

      const handleClick = () => {
        if (!onWordClick) return;

        setSelectedWord(word);
        const context = extractWordContext(word, content);
        onWordClick(word, context);
      };

      const isSelected = selectedWord?.toLowerCase() === word.toLowerCase();

      return (
        <span key={index}>
          {prefix}
          <span
            onClick={onWordClick ? handleClick : undefined}
            className={cn(
              onWordClick && "cursor-pointer transition-all duration-150 rounded px-0.5 -mx-0.5",
              onWordClick && "hover:bg-yellow-500/30 hover:text-yellow-100",
              isSelected && "bg-yellow-500/40 text-yellow-100"
            )}
          >
            {word}
          </span>
          {suffix}
        </span>
      );
    });
  }, [content, selectedWord, onWordClick, extractWordContext]);

  return (
    <div className={cn("rounded-xl bg-muted/30 overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/40">
        <div className="p-2 rounded-lg bg-blue-500/20">
          <BookOpen className="h-5 w-5 text-blue-400" />
        </div>
        <div>
          <h3 className="font-medium text-blue-300">{title}</h3>
          <p className="text-xs text-muted-foreground">Article / Text</p>
        </div>
      </div>

      {/* Text content */}
      <div className="p-6">
        <div className="text-lg leading-relaxed text-foreground/90">
          {renderedContent}
        </div>
      </div>

      {/* Instruction hint */}
      {onWordClick && (
        <div className="px-6 pb-4">
          <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 p-3">
            <p className="text-sm text-amber-400">
              Click on any word to add it to your Mystery Shelf
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

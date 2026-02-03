"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  BookOpen,
  Headphones,
  Plus,
  Filter,
  Shuffle,
  Loader2,
  X,
  Check,
  AlertTriangle,
} from "lucide-react";
import { ContentPlayer } from "@/components/features/content-player";
import { ContentItem } from "@/lib/db/schema";

// Map difficulty level (1.0-10.0) to CEFR
function difficultyToCEFR(level: string | number): string {
  const numLevel = typeof level === "string" ? parseFloat(level) : level;
  if (numLevel <= 2) return "A1";
  if (numLevel <= 3.5) return "A2";
  if (numLevel <= 5) return "B1";
  if (numLevel <= 6.5) return "B2";
  if (numLevel <= 8) return "C1";
  return "C2";
}

// Format duration
function formatDuration(seconds: number, type: string): string {
  const mins = Math.round(seconds / 60);
  if (type === "text") return `${mins} min read`;
  return `${mins} min`;
}

const typeIcons = {
  audio: Headphones,
  text: BookOpen,
};

const typeColors = {
  text: {
    bg: "bg-blue-500/10",
    text: "text-blue-400",
    border: "border-blue-500/20",
  },
  audio: {
    bg: "bg-purple-500/10",
    text: "text-purple-400",
    border: "border-purple-500/20",
  },
};

type ContentFilter = "all" | "text" | "audio";

export default function DeepFogPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(
    null
  );

  // Fetch content on mount and when filter changes
  useEffect(() => {
    async function fetchContent() {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("type", filter);
        }

        const res = await fetch(`/api/content?${params}`);
        if (!res.ok) {
          throw new Error("Failed to fetch content");
        }

        const data = await res.json();
        setContent(data.items);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load content");
      } finally {
        setIsLoading(false);
      }
    }

    fetchContent();
  }, [filter]);

  const [capturedWord, setCapturedWord] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedWord, setSavedWord] = useState<string | null>(null);

  const saveToMysteryShelf = useCallback(
    async (word: string, context: string) => {
      if (isSaving) return;
      setIsSaving(true);
      setSaveError(null);
      setSavedWord(null);
      setCapturedWord(word);

      try {
        const res = await fetch("/api/mystery-shelf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word, context, source: "deep_fog" }),
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || "Failed to save");
        }

        setSavedWord(word);
      } catch (err) {
        setSaveError(
          err instanceof Error ? err.message : "Failed to save to Mystery Shelf"
        );
      } finally {
        setIsSaving(false);
      }
    },
    [isSaving]
  );

  const handleTimestampCapture = useCallback(
    (timestamp: number) => {
      if (!selectedContent) return;
      const mins = Math.floor(timestamp / 60);
      const secs = Math.floor(timestamp % 60);
      const formatted = `${mins}:${secs.toString().padStart(2, "0")}`;
      const word = `Timestamp ${formatted}`;
      const context = `at ${formatted} in "${selectedContent.title}"`;
      saveToMysteryShelf(word, context);
    },
    [selectedContent, saveToMysteryShelf]
  );

  const handleWordClick = useCallback(
    (word: string, context: string) => {
      const cleanWord = word.replace(/[.,!?;:"""''„…\-()[\]{}]/g, "").trim();
      if (!cleanWord) return;
      saveToMysteryShelf(cleanWord, context);
    },
    [saveToMysteryShelf]
  );

  // Auto-dismiss toast after save completes
  useEffect(() => {
    if (!capturedWord) return;
    if (isSaving) return; // Don't dismiss while saving
    const timer = setTimeout(() => {
      setCapturedWord(null);
      setSavedWord(null);
      setSaveError(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [capturedWord, isSaving, savedWord, saveError]);

  const handleRandomContent = () => {
    if (content.length === 0) return;
    const randomIndex = Math.floor(Math.random() * content.length);
    setSelectedContent(content[randomIndex]);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-7 w-7 text-indigo-300" />
            Deep Fog Mode
          </h1>
          <p className="text-muted-foreground">
            Immerse yourself in above-level content. Collect unknowns to your
            Mystery Shelf.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-border"
            onClick={handleRandomContent}
            disabled={content.length === 0}
          >
            <Shuffle className="h-4 w-4 mr-1" /> Random
          </Button>
          <Button size="sm" className="bg-foreground/80 hover:bg-foreground/60">
            <Filter className="h-4 w-4 mr-1" /> Filter
          </Button>
        </div>
      </div>

      {/* Level indicator */}
      <Card className="rounded-2xl border-border bg-gradient-to-r from-foreground/50 to-foreground/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-foreground">Your level:</span>
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              B1 Intermediate
            </span>
            <span className="text-foreground hidden sm:inline">•</span>
            <span className="text-foreground">
              Content shown is 1-2 levels above you for optimal immersion
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "text", "audio"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-foreground/80 hover:bg-foreground/60"
                : "border-border"
            }
          >
            {f === "all" && "All Content"}
            {f === "text" && (
              <>
                <BookOpen className="h-4 w-4 mr-1" /> Read
              </>
            )}
            {f === "audio" && (
              <>
                <Headphones className="h-4 w-4 mr-1" /> Listen
              </>
            )}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/80" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="rounded-xl border-red-500/30 bg-red-500/10">
          <CardContent className="p-4 text-center text-red-400">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Content grid */}
      {!isLoading && !error && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {content.map((item) => {
            const colors = typeColors[item.type];
            const Icon = typeIcons[item.type];
            const cefr = difficultyToCEFR(item.difficultyLevel);

            return (
              <Card
                key={item.id}
                className={`rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${colors.border}`}
                onClick={() => setSelectedContent(item)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`h-5 w-5 ${colors.text}`} />
                    </div>
                    <div className="flex gap-2">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-400">
                        {cefr}
                      </span>
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {item.topic}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {formatDuration(item.durationSeconds, item.type)}
                    </span>
                    <button
                      className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium rounded-md transition-colors hover:bg-primary/20"
                    >
                      Enter Fog →
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty state */}
          {content.length === 0 && !isLoading && (
            <Card className="col-span-full rounded-xl border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  No content available yet
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Content will appear here once added to the database.
                  <br />
                  Use the API to add content items.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Word captured toast */}
      {capturedWord && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white shadow-lg backdrop-blur-sm ${
              saveError
                ? "bg-red-500/90"
                : savedWord
                  ? "bg-green-500/90"
                  : "bg-indigo-500/90"
            }`}
          >
            {saveError ? (
              <AlertTriangle className="h-4 w-4" />
            ) : savedWord ? (
              <Check className="h-4 w-4" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <span className="text-sm font-medium">
              {saveError
                ? `Failed to save "${capturedWord}"`
                : savedWord
                  ? `"${capturedWord}" added to Mystery Shelf`
                  : `Saving "${capturedWord}"...`}
            </span>
          </div>
        </div>
      )}

      {/* Content modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border-indigo-500/30">
            <CardHeader className="flex flex-row items-start justify-between sticky top-0 bg-card z-10 border-b border-border/40">
              <div className="flex items-center gap-2">
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400">
                  {difficultyToCEFR(selectedContent.difficultyLevel)} - Above
                  Your Level
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDuration(
                    selectedContent.durationSeconds,
                    selectedContent.type
                  )}
                </span>
              </div>
              <Button onClick={() => setSelectedContent(null)}
                className="px-3 text-xs text-foreground/60 font-medium rounded-md transition-colors bg-transparent hover:bg-foreground/40">
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            
            <CardContent className="space-y-4 p-6">
              {/* Content Player */}
              <ContentPlayer
                content={selectedContent}
                onTimestampCapture={handleTimestampCapture}
                onWordClick={handleWordClick}
              />

              {/* Mystery Shelf hint */}
              <Card className="rounded-xl border-border bg-indigo-400/10">
                <CardContent className="p-4">
                  <p className="text-sm text-indigo-400 mb-2">
                    {selectedContent.type === "text"
                      ? "Add words to your Mystery Shelf to explore later"
                      : "Use the 'Save Timestamp' button to capture moments for later review"}
                  </p>
                  <p className="text-xs text-foreground/70">
                    Don't worry about understanding <em>everything</em> in the moment. The fog is
                    supposed to be thick!
                  </p>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={handleRandomContent}
                >
                  <Shuffle className="mr-2 h-4 w-4" />
                  Load New Content
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

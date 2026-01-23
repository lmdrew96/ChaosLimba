"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Cloud,
  BookOpen,
  Headphones,
  Video,
  Plus,
  Filter,
  Shuffle,
  Loader2,
  X,
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
  video: Video,
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
  video: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
  },
};

type ContentFilter = "all" | "text" | "audio" | "video";

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

  const handleTimestampCapture = (timestamp: number) => {
    // TODO: Integrate with Mystery Shelf - save timestamp context
    console.log(
      "Captured timestamp:",
      timestamp,
      "for content:",
      selectedContent?.title
    );
    // Future: Open modal to add context/notes before saving to Mystery Shelf
  };

  const handleWordClick = (word: string, context: string) => {
    // TODO: Integrate with Mystery Shelf - save word with context
    console.log("Clicked word:", word, "Context:", context);
    // Future: Open modal to confirm adding word to Mystery Shelf
  };

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
            <Cloud className="h-7 w-7 text-indigo-400" />
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
            className="border-indigo-500/30"
            onClick={handleRandomContent}
            disabled={content.length === 0}
          >
            <Shuffle className="h-4 w-4 mr-1" /> Random
          </Button>
          <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
            <Filter className="h-4 w-4 mr-1" /> Filter
          </Button>
        </div>
      </div>

      {/* Level indicator */}
      <Card className="rounded-2xl border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <span className="text-muted-foreground">Your level:</span>
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              B1 Intermediate
            </span>
            <span className="text-muted-foreground hidden sm:inline">•</span>
            <span className="text-muted-foreground">
              Content shown is 1-2 levels above you for optimal immersion
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Filter buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "text", "audio", "video"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "border-indigo-500/30"
            }
          >
            {f === "all" && "All Content"}
            {f === "text" && (
              <>
                <BookOpen className="h-4 w-4 mr-1" /> Articles
              </>
            )}
            {f === "audio" && (
              <>
                <Headphones className="h-4 w-4 mr-1" /> Podcasts
              </>
            )}
            {f === "video" && (
              <>
                <Video className="h-4 w-4 mr-1" /> Videos
              </>
            )}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
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
                      <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
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
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10"
                    >
                      Enter Fog →
                    </Button>
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

      {/* Content modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border-indigo-500/30">
            <CardHeader className="flex flex-row items-start justify-between sticky top-0 bg-card z-10 border-b border-border/40">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
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
                <CardTitle className="text-xl">
                  {selectedContent.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedContent(null)}
                className="flex-shrink-0"
              >
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

              {/* Cultural notes if present */}
              {selectedContent.culturalNotes && (
                <Card className="rounded-xl border-purple-500/20 bg-purple-500/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-purple-400 mb-2">
                      Cultural Notes
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedContent.culturalNotes}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Mystery Shelf hint */}
              <Card className="rounded-xl border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-400 mb-2">
                    {selectedContent.type === "text"
                      ? "Click on words to add them to your Mystery Shelf"
                      : "Use the 'Save Timestamp' button to capture moments for later review"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't worry about understanding everything. The fog is
                    supposed to be thick!
                  </p>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button className="flex-1 min-w-[200px] bg-amber-600 hover:bg-amber-700 rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Mystery Shelf
                </Button>
                <Button
                  variant="outline"
                  className="border-indigo-500/30"
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

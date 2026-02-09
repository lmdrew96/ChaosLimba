"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Cloud,
  BookOpen,
  Headphones,
  Shuffle,
  Loader2,
  X,
  Check,
  AlertTriangle,
  Search,
  Clock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { ContentPlayer } from "@/components/features/content-player";
import { ContentItem } from "@/lib/db/schema";

type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

// Fog range: content 1-3 CEFR levels above user
function getFogRange(level: CEFRLevel): { min: number; max: number } {
  switch (level) {
    case "A1": return { min: 2.0, max: 7.0 };
    case "A2": return { min: 3.5, max: 8.5 };
    case "B1": return { min: 5.0, max: 10.0 };
    case "B2": return { min: 6.5, max: 10.0 };
    case "C1": return { min: 8.0, max: 10.0 };
    case "C2": return { min: 8.0, max: 10.0 };
  }
}

// Map difficulty level (1.0-10.0) to CEFR
function difficultyToCEFR(level: string | number): CEFRLevel {
  const numLevel = typeof level === "string" ? parseFloat(level) : level;
  if (numLevel <= 2) return "A1";
  if (numLevel <= 3.5) return "A2";
  if (numLevel <= 5) return "B1";
  if (numLevel <= 6.5) return "B2";
  if (numLevel <= 8) return "C1";
  return "C2";
}

// CEFR to numeric rank for distance calc
function cefrRank(level: CEFRLevel): number {
  const ranks: Record<CEFRLevel, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5, C2: 6 };
  return ranks[level];
}

// Fog depth based on CEFR distance
function getFogDepth(userLevel: CEFRLevel, contentLevel: CEFRLevel): { label: string; color: string; intensity: number } {
  const distance = cefrRank(contentLevel) - cefrRank(userLevel);
  if (distance <= 1) return { label: "Light Fog", color: "bg-accent/20 text-accent", intensity: 1 };
  if (distance <= 2) return { label: "Dense Fog", color: "bg-accent/40 text-accent", intensity: 2 };
  return { label: "Thick Fog", color: "bg-accent/60 text-foreground", intensity: 3 };
}

// Format CEFR with descriptive name
function cefrLabel(level: CEFRLevel): string {
  const labels: Record<CEFRLevel, string> = {
    A1: "A1 Beginner",
    A2: "A2 Elementary",
    B1: "B1 Intermediate",
    B2: "B2 Upper-Intermediate",
    C1: "C1 Advanced",
    C2: "C2 Mastery",
  };
  return labels[level];
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
    bg: "bg-accent/10",
    text: "text-accent",
    border: "border-accent/20",
  },
  audio: {
    bg: "bg-primary/10",
    text: "text-primary",
    border: "border-primary/20",
  },
};

type ContentFilter = "all" | "text" | "audio";
type SortMode = "newest" | "difficulty" | "duration";
type SortDirection = "asc" | "desc";

export default function DeepFogPage() {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ContentFilter>("all");
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);

  // CEFR level state
  const [userLevel, setUserLevel] = useState<CEFRLevel | null>(null);
  const [browseAll, setBrowseAll] = useState(false);

  // Search & sort
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  // Stats
  const [totalWordsCollected, setTotalWordsCollected] = useState(0);

  // Session word tracking
  const [sessionWords, setSessionWords] = useState<string[]>([]);
  const [showSessionSummary, setShowSessionSummary] = useState(false);

  // Word capture toast state
  const [capturedWord, setCapturedWord] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedWord, setSavedWord] = useState<string | null>(null);

  // Fetch user CEFR level on mount
  useEffect(() => {
    async function fetchUserLevel() {
      try {
        const res = await fetch("/api/user/preferences");
        if (res.ok) {
          const data = await res.json();
          setUserLevel(data.preferences?.languageLevel || "A1");
        }
      } catch {
        // Default to A1 if fetch fails
        setUserLevel("A1");
      }
    }
    fetchUserLevel();
  }, []);

  // Fetch deep fog stats on mount
  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/deep-fog/stats");
        if (res.ok) {
          const data = await res.json();
          setTotalWordsCollected(data.wordsCollected);
        }
      } catch {
        // Stats are non-critical
      }
    }
    fetchStats();
  }, []);

  // Fetch content when filter or level changes
  useEffect(() => {
    if (!userLevel) return;

    async function fetchContent() {
      try {
        setIsLoading(true);
        setError(null);
        const params = new URLSearchParams();
        if (filter !== "all") {
          params.set("type", filter);
        }

        // Apply fog range filtering unless browsing all
        if (!browseAll) {
          const range = getFogRange(userLevel!);
          params.set("minDifficulty", range.min.toString());
          params.set("maxDifficulty", range.max.toString());
        }

        params.set("limit", "50");

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
  }, [filter, userLevel, browseAll]);

  // Client-side search + sort
  const filteredContent = useMemo(() => {
    let result = content;

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.topic.toLowerCase().includes(q)
      );
    }

    // Sort
    const dir = sortDirection === "asc" ? 1 : -1;
    if (sortMode === "newest") {
      // API returns newest first (desc). Reverse for asc.
      if (sortDirection === "asc") {
        result = [...result].reverse();
      }
    } else if (sortMode === "difficulty") {
      result = [...result].sort(
        (a, b) => dir * (parseFloat(String(a.difficultyLevel)) - parseFloat(String(b.difficultyLevel)))
      );
    } else if (sortMode === "duration") {
      result = [...result].sort((a, b) => dir * (a.durationSeconds - b.durationSeconds));
    }

    return result;
  }, [content, searchQuery, sortMode, sortDirection]);

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
        setSessionWords((prev) => [...prev, word]);
        setTotalWordsCollected((prev) => prev + 1);
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
    if (isSaving) return;
    const timer = setTimeout(() => {
      setCapturedWord(null);
      setSavedWord(null);
      setSaveError(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [capturedWord, isSaving, savedWord, saveError]);

  const handleRandomContent = () => {
    if (filteredContent.length === 0) return;
    const randomIndex = Math.floor(Math.random() * filteredContent.length);
    setSelectedContent(filteredContent[randomIndex]);
  };

  const handleCloseModal = () => {
    if (sessionWords.length > 0) {
      setShowSessionSummary(true);
    }
    setSelectedContent(null);
  };

  const handleDismissSummary = () => {
    setShowSessionSummary(false);
    setSessionWords([]);
  };

  const fogRange = userLevel ? getFogRange(userLevel) : null;
  const fogTargetMin = fogRange ? difficultyToCEFR(fogRange.min) : null;
  const fogTargetMax = fogRange ? difficultyToCEFR(fogRange.max) : null;

  const defaultDirection: Record<SortMode, SortDirection> = {
    newest: "desc",
    difficulty: "asc",
    duration: "asc",
  };

  const handleSortClick = () => {
    const modes: SortMode[] = ["newest", "difficulty", "duration"];
    const currentIdx = modes.indexOf(sortMode);
    const nextMode = modes[(currentIdx + 1) % modes.length];
    setSortMode(nextMode);
    setSortDirection(defaultDirection[nextMode]);
  };

  const handleDirectionToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSortDirection((d) => (d === "asc" ? "desc" : "asc"));
  };

  const sortModeLabel = sortMode === "newest" ? "Date" : sortMode === "difficulty" ? "Difficulty" : "Duration";
  const SortModeIcon = sortMode === "newest" ? Clock : ArrowUpDown;
  const DirectionIcon = sortDirection === "asc" ? ArrowUp : ArrowDown;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Cloud className="h-7 w-7 text-accent" />
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
            disabled={filteredContent.length === 0}
          >
            <Shuffle className="h-4 w-4 mr-1" /> Random
          </Button>
        </div>
      </div>

      {/* Level indicator */}
      {userLevel && (
        <Card className="rounded-2xl border-border bg-gradient-to-r from-foreground/50 to-foreground/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-4 text-sm flex-wrap">
              <span className="text-foreground">Your level:</span>
              <span className="px-2 py-1 rounded-full bg-green-400/20 text-green-300">
                {cefrLabel(userLevel)}
              </span>
              <span className="text-foreground hidden sm:inline">&bull;</span>
              {browseAll ? (
                <span className="text-foreground">
                  Browsing all levels
                  <Button
                    variant="link"
                    size="sm"
                    className="text-accent ml-1 p-0 h-auto"
                    onClick={() => setBrowseAll(false)}
                  >
                    Show fog range
                  </Button>
                </span>
              ) : (
                <span className="text-foreground">
                  Fog target: {fogTargetMin}–{fogTargetMax} content (1–3 levels above you)
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats bar */}
      {!isLoading && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Cloud className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground">{filteredContent.length}</span> available
            </span>
          </div>
          {sessionWords.length > 0 && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Eye className="h-3.5 w-3.5 text-accent" />
              <span>
                <span className="font-medium text-foreground">{sessionWords.length}</span> captured this session
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span>
              <span className="font-medium text-foreground">{totalWordsCollected}</span> total from Deep Fog
            </span>
          </div>
        </div>
      )}

      {/* Search, filter, sort controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
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
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSortClick}
              className="border-border text-xs gap-1.5 rounded-r-none border-r-0"
            >
              <SortModeIcon className="h-3.5 w-3.5" /> {sortModeLabel}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDirectionToggle}
              className="border-border text-xs px-1.5 rounded-l-none"
              title={sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              <DirectionIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-foreground/80" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <Card className="rounded-xl border-destructive/30 bg-destructive/10">
          <CardContent className="p-4 text-center text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* Content grid */}
      {!isLoading && !error && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredContent.map((item) => {
            const colors = typeColors[item.type];
            const Icon = typeIcons[item.type];
            const contentCEFR = difficultyToCEFR(item.difficultyLevel);
            const fogDepth = userLevel
              ? getFogDepth(userLevel, contentCEFR)
              : null;

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
                      {fogDepth && !browseAll ? (
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${fogDepth.color}`}
                        >
                          {fogDepth.label} &middot; {contentCEFR}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs rounded-full bg-chart-4/20 text-chart-4">
                          {contentCEFR}
                        </span>
                      )}
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
                    <span className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium text-muted-foreground">
                      Enter Fog &rarr;
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {/* Empty state: no content at fog level */}
          {content.length === 0 && !isLoading && !browseAll && (
            <Card className="col-span-full rounded-xl border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  No content at your fog level yet
                </p>
                <p className="text-sm text-muted-foreground/60 mb-4">
                  Your fog range targets {fogTargetMin}–{fogTargetMax} content.
                  {" "}As more content is added, fog-level items will appear here.
                </p>
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => setBrowseAll(true)}
                >
                  Browse All Levels
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Empty state: browse all, truly no content */}
          {content.length === 0 && !isLoading && browseAll && (
            <Card className="col-span-full rounded-xl border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <Cloud className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  No content available yet
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Content will appear here once added to the database.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Empty state: search with no results */}
          {content.length > 0 && filteredContent.length === 0 && searchQuery.trim() && (
            <Card className="col-span-full rounded-xl border-dashed border-2 border-muted">
              <CardContent className="p-8 text-center">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-2">
                  No content matches &ldquo;{searchQuery}&rdquo;
                </p>
                <p className="text-sm text-muted-foreground/60">
                  Try a different search term or clear your search.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Session summary card */}
      {showSessionSummary && (
        <Card className="rounded-xl border-accent/30 bg-accent/10">
          <CardContent className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-semibold text-accent mb-1">
                  Fog Session Complete
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  You collected{" "}
                  <span className="font-medium text-foreground">
                    {sessionWords.length}
                  </span>{" "}
                  word{sessionWords.length !== 1 ? "s" : ""} from this session
                </p>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    className="bg-accent hover:bg-accent/50 text-foreground"
                    onClick={() => {
                      window.location.href = "/mystery-shelf";
                    }}
                  >
                    <BookOpen className="h-4 w-4 mr-1" /> Explore on Mystery
                    Shelf
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-border"
                    onClick={handleDismissSummary}
                  >
                    Keep Exploring
                  </Button>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
                onClick={handleDismissSummary}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Word captured toast */}
      {capturedWord && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-foreground shadow-lg backdrop-blur-sm ${
              saveError
                ? "bg-destructive"
                : savedWord
                  ? "bg-chart-4"
                  : "bg-accent"
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
          <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl border-accent/30">
            <CardHeader className="flex flex-row items-start justify-between sticky top-0 bg-card z-10 border-b border-border/40">
              <div className="flex items-center gap-2">
                {userLevel && !browseAll ? (
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      getFogDepth(userLevel, difficultyToCEFR(selectedContent.difficultyLevel)).color
                    }`}
                  >
                    {getFogDepth(userLevel, difficultyToCEFR(selectedContent.difficultyLevel)).label}{" "}
                    &middot; {difficultyToCEFR(selectedContent.difficultyLevel)}
                  </span>
                ) : (
                  <span className="px-2 py-1 text-xs rounded-full bg-chart-4/20 text-chart-4">
                    {difficultyToCEFR(selectedContent.difficultyLevel)} - Above
                    Your Level
                  </span>
                )}
                <span className="text-xs text-muted-foreground">
                  {formatDuration(
                    selectedContent.durationSeconds,
                    selectedContent.type
                  )}
                </span>
                {sessionWords.length > 0 && (
                  <span className="text-xs text-accent">
                    {sessionWords.length} word{sessionWords.length !== 1 ? "s" : ""} captured
                  </span>
                )}
              </div>
              <Button
                onClick={handleCloseModal}
                className="px-3 text-xs text-foreground/60 font-medium rounded-md transition-colors bg-transparent hover:bg-foreground/40"
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

              {/* Mystery Shelf hint */}
              <Card className="rounded-xl border-border bg-accent/10">
                <CardContent className="p-4">
                  <p className="text-sm text-accent mb-2">
                    {selectedContent.type === "text"
                      ? "Click any word to add it to your Mystery Shelf"
                      : "Use the 'Save Timestamp' button to capture moments for later review"}
                  </p>
                  <p className="text-xs text-foreground/70">
                    Don&apos;t worry about understanding <em>everything</em> in the
                    moment. The fog is supposed to be thick!
                  </p>
                </CardContent>
              </Card>

              {/* Action buttons */}
              <div className="flex gap-3 flex-wrap">
                <Button
                  variant="outline"
                  className="border-border"
                  onClick={() => {
                    // Pick new random content without closing modal
                    if (filteredContent.length > 1) {
                      const others = filteredContent.filter(
                        (c) => c.id !== selectedContent.id
                      );
                      const next =
                        others[Math.floor(Math.random() * others.length)];
                      setSelectedContent(next);
                    }
                  }}
                  disabled={filteredContent.length <= 1}
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

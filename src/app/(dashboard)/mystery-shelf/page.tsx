"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { BookOpen, Search, Sparkles, Trash2, CheckCircle2, Plus, Loader2, Volume2, Pause, ArrowDownAZ, Clock, AlertTriangle, ArrowUp, ArrowDown } from "lucide-react"
import { CrystalBall } from "@/components/icons/CrystalBall"
import { MysteryExploreCard, type MysteryItemFull } from "@/components/features/mystery-shelf/MysteryExploreCard"

export default function MysteryShelfPage() {
  const [items, setItems] = useState<MysteryItemFull[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "new" | "explored">("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortMode, setSortMode] = useState<"newest" | "az">("newest")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [selectedItem, setSelectedItem] = useState<MysteryItemFull | null>(null)

  // Delete confirmation state
  const [pendingDeleteItem, setPendingDeleteItem] = useState<MysteryItemFull | null>(null)

  // Duplicate detection state
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  // Quick Review Dialog state
  const [quickReviewItem, setQuickReviewItem] = useState<MysteryItemFull | null>(null)
  const [isQuickReviewLoading, setIsQuickReviewLoading] = useState(false)

  // Quick Review TTS state
  const [isQuickTTSLoading, setIsQuickTTSLoading] = useState(false)
  const [isQuickTTSPlaying, setIsQuickTTSPlaying] = useState(false)
  const quickAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleQuickReviewTTS = async () => {
    if (!quickReviewItem) return

    if (isQuickTTSPlaying && quickAudioRef.current) {
      quickAudioRef.current.pause()
      setIsQuickTTSPlaying(false)
      return
    }

    setIsQuickTTSLoading(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: quickReviewItem.word, speed: 0.85 })
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        console.error('TTS failed:', data.error || res.status)
        return
      }

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (!quickAudioRef.current) {
        quickAudioRef.current = new Audio()
        quickAudioRef.current.onended = () => setIsQuickTTSPlaying(false)
        quickAudioRef.current.onerror = () => setIsQuickTTSPlaying(false)
      }

      quickAudioRef.current.src = audioUrl
      quickAudioRef.current.play()
      setIsQuickTTSPlaying(true)
    } catch (error) {
      console.error('TTS error:', error)
    } finally {
      setIsQuickTTSLoading(false)
    }
  }

  // Quick Review - fetch definition if needed, then show dialog
  const handleQuickReview = async (item: MysteryItemFull) => {
    setQuickReviewItem(item)

    // If no definition yet, fetch it
    if (!item.definition) {
      setIsQuickReviewLoading(true)
      try {
        const res = await fetch("/api/ai/analyze-mystery-item", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ itemId: item.id })
        })

        if (res.ok) {
          const updatedItem = await res.json()
          const enrichedItem = {
            ...item,
            definition: updatedItem.definition,
            pronunciation: updatedItem.pronunciation,
            examples: updatedItem.examples,
            grammarInfo: updatedItem.grammarInfo,
          }
          setQuickReviewItem(enrichedItem)
          // Update main items list too
          setItems(items.map(i => i.id === item.id ? enrichedItem : i))
        }
      } catch (error) {
        console.error("Quick review fetch failed", error)
      } finally {
        setIsQuickReviewLoading(false)
      }
    }
  }

  const handleQuickReviewMarkExplored = async () => {
    if (quickReviewItem) {
      await markExplored(quickReviewItem.id)
      setQuickReviewItem(null)
    }
  }

  // AI Analysis Logic
  const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set())

  const runAIAnalysis = async (id: string) => {
    setAnalyzingIds(prev => new Set(prev).add(id))

    try {
      const res = await fetch("/api/ai/analyze-mystery-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: id })
      })

      if (res.ok) {
        const updatedItem = await res.json()
        // Update both the items list and selected item
        setItems(items.map(item =>
          item.id === id ? {
            ...item,
            definition: updatedItem.definition,
            examples: updatedItem.examples,
            grammarInfo: updatedItem.grammarInfo,
            relatedWords: updatedItem.relatedWords,
            practicePrompt: updatedItem.practicePrompt,
            pronunciation: updatedItem.pronunciation,
            etymology: updatedItem.etymology,
            context: updatedItem.context || item.context,
          } : item
        ))
        if (selectedItem?.id === id) {
          setSelectedItem(prev => prev ? {
            ...prev,
            definition: updatedItem.definition,
            examples: updatedItem.examples,
            grammarInfo: updatedItem.grammarInfo,
            relatedWords: updatedItem.relatedWords,
            practicePrompt: updatedItem.practicePrompt,
            pronunciation: updatedItem.pronunciation,
            etymology: updatedItem.etymology,
            context: updatedItem.context || prev.context,
          } : null)
        }
      }
    } catch (error) {
      console.error("AI Analysis failed", error)
    } finally {
      setAnalyzingIds(prev => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  // Add Item Form State
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newItemWord, setNewItemWord] = useState("")
  const [newItemContext, setNewItemContext] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fetchItems = async () => {
    try {
      const res = await fetch("/api/mystery-shelf")
      if (res.ok) {
        const data = await res.json()
        setItems(data.map((item: any) => ({
          ...item,
          collected: new Date(item.createdAt).toLocaleDateString(),
          createdAt: item.createdAt,
        })))
      }
    } catch (e) {
      console.error("Failed to fetch items", e)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchItems()
  }, [])

  const handleAddItem = async (force = false) => {
    if (!newItemWord.trim()) return

    // Duplicate detection
    if (!force) {
      const existing = items.find(
        i => i.word.toLowerCase() === newItemWord.trim().toLowerCase()
      )
      if (existing) {
        setDuplicateWarning(existing.word)
        return
      }
    }

    setDuplicateWarning(null)
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/mystery-shelf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          word: newItemWord,
          context: newItemContext,
          source: "manual"
        })
      })

      if (res.ok) {
        await fetchItems()
        setNewItemWord("")
        setNewItemContext("")
        setIsAddOpen(false)
      }
    } catch (e) {
      console.error("Failed to add item", e)
    } finally {
      setIsSubmitting(false)
    }
  }

  const markExplored = async (id: string) => {
    // Optimistic Update
    setItems(items.map(item =>
      item.id === id ? { ...item, isExplored: true } : item
    ))
    if (selectedItem?.id === id) {
      setSelectedItem(prev => prev ? { ...prev, isExplored: true } : null)
    }

    try {
      await fetch(`/api/mystery-shelf/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isExplored: true })
      })
    } catch (e) {
      console.error("Failed to update item", e)
      fetchItems()
    }
  }

  const confirmDelete = async () => {
    if (!pendingDeleteItem) return
    const id = pendingDeleteItem.id

    setItems(items.filter(item => item.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)
    setPendingDeleteItem(null)

    try {
      await fetch(`/api/mystery-shelf/${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Failed to delete item", e)
      fetchItems()
    }
  }

  const filteredItems = items
    .filter((item) => {
      if (filter === "new") return !item.isExplored
      if (filter === "explored") return item.isExplored
      return true
    })
    .filter((item) => {
      if (!searchQuery.trim()) return true
      return item.word.toLowerCase().includes(searchQuery.toLowerCase())
    })
    .sort((a, b) => {
      const dir = sortDirection === "asc" ? 1 : -1
      if (sortMode === "az") return dir * a.word.localeCompare(b.word)
      if (sortMode === "newest") {
        // API returns newest first (desc). Compare by createdAt.
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dir * (aTime - bTime) * -1 // -1 because desc = newest first
      }
      return 0
    })

  // Stats computed from full items list
  const exploredCount = items.filter(i => i.isExplored).length
  const exploredPercent = items.length > 0 ? Math.round((exploredCount / items.length) * 100) : 0
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  const newThisWeek = items.filter(i => i.createdAt && new Date(i.createdAt) >= oneWeekAgo).length
  const manualCount = items.filter(i => i.source === "manual").length
  const deepFogCount = items.filter(i => i.source === "deep_fog").length

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            <CrystalBall className="h-7 w-7 text-accent" />
            Mystery Shelf
          </h1>
          <p className="text-muted-foreground">
            Your collection of unknowns — click Deep Explore to unlock each word
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Dialog open={isAddOpen} onOpenChange={(open) => { setIsAddOpen(open); if (!open) setDuplicateWarning(null) }}>
            <DialogTrigger asChild>
              <Button className="bg-accent hover:bg-accent/50 text-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add to Mystery Shelf</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="word">Word or Phrase</Label>
                  <Input
                    id="word"
                    placeholder="e.g. îndoielnic"
                    value={newItemWord}
                    onChange={(e) => setNewItemWord(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="context">Context (Optional)</Label>
                  <Textarea
                    id="context"
                    placeholder="Where did you see this? e.g. 'Este îndoielnic că va reuși'"
                    value={newItemContext}
                    onChange={(e) => setNewItemContext(e.target.value)}
                  />
                </div>
              </div>
              {duplicateWarning && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm text-destructive">
                      You already have &lsquo;{duplicateWarning}&rsquo; on your shelf
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs h-7"
                        onClick={() => setDuplicateWarning(null)}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        className="text-xs h-7 bg-accent hover:bg-accent/50"
                        onClick={() => handleAddItem(true)}
                      >
                        Add Anyway
                      </Button>
                    </div>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => { setIsAddOpen(false); setDuplicateWarning(null) }}>Cancel</Button>
                <Button
                  onClick={() => handleAddItem()}
                  className="bg-accent hover:bg-accent/50"
                  disabled={!newItemWord.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Shelf"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Overview */}
      {!isLoading && items.length > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <BookOpen className="h-3.5 w-3.5" />
            <span><span className="font-medium text-foreground">{items.length}</span> collected</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-chart-4" />
            <span><span className="font-medium text-foreground">{exploredCount}</span> explored ({exploredPercent}%)</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span><span className="font-medium text-foreground">{newThisWeek}</span> new this week</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span><span className="font-medium text-foreground">{manualCount}</span> Manual · <span className="font-medium text-foreground">{deepFogCount}</span> Deep Fog</span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {(["all", "new", "explored"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className={
                filter === f
                  ? "bg-accent hover:bg-accent/50"
                  : "border-borders"
              }
            >
              {f === "all" && `All (${items.length})`}
              {f === "new" && `New (${items.filter((i) => !i.isExplored).length})`}
              {f === "explored" &&
                `Explored (${items.filter((i) => i.isExplored).length})`}
            </Button>
          ))}
        </div>
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-sm"
            />
          </div>
          <div className="flex items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const next = sortMode === "newest" ? "az" : "newest"
                setSortMode(next)
                setSortDirection(next === "newest" ? "desc" : "asc")
              }}
              className="border-border text-xs gap-1.5 rounded-r-none border-r-0"
            >
              {sortMode === "az" ? (
                <><ArrowDownAZ className="h-3.5 w-3.5" /> A–Z</>
              ) : (
                <><Clock className="h-3.5 w-3.5" /> Date</>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortDirection(d => d === "asc" ? "desc" : "asc")}
              className="border-border text-xs px-1.5 rounded-l-none"
              title={sortDirection === "asc" ? "Ascending" : "Descending"}
            >
              {sortDirection === "asc" ? (
                <ArrowUp className="h-3.5 w-3.5" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-accent-500 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`rounded-xl border-border cursor-pointer transition-all hover:border-accent/50 hover:shadow-lg hover:shadow-accent/5 ${selectedItem?.id === item.id
                  ? "ring-2 ring-accent/50 border-accent/50"
                  : ""
                  }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-accent truncate">
                          {item.word}
                        </h3>
                        {item.pronunciation && (
                          <span className="text-xs text-muted-foreground font-mono">
                            /{item.pronunciation}/
                          </span>
                        )}
                      </div>
                      {item.definition && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                          {item.definition}
                        </p>
                      )}
                      {!item.definition && item.context && (
                        <p className="text-sm text-muted-foreground italic mt-1 line-clamp-1">
                          "{item.context}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        Collected: {item.collected} • {item.source === "deep_fog" ? "Deep Fog" : "Manual"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      {item.isExplored ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-chart-4/20 text-chart-4 flex items-center gap-1 whitespace-nowrap">
                          <CheckCircle2 className="h-3 w-3" /> Explored
                        </span>
                      ) : item.definition ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent whitespace-nowrap">
                          Analyzed
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent whitespace-nowrap">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-accent/30 hover:bg-accent/10 hover:border-accent/50"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItem(item)
                        if (!item.definition) {
                          runAIAnalysis(item.id)
                        }
                      }}
                      disabled={analyzingIds.has(item.id)}
                    >
                      {analyzingIds.has(item.id) ? (
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      ) : (
                        <Search className="h-3 w-3 mr-1" />
                      )}
                      {item.definition ? "View" : "Deep Explore"}
                    </Button>
                    {!item.isExplored && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs border-border hover:bg-chart-4/10"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleQuickReview(item)
                        }}
                      >
                        <Sparkles className="h-3 w-3 mr-1" /> Quick Review
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-destructive/30 hover:bg-destructive/10 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteItem(item)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredItems.length === 0 && (
              <Card className="rounded-xl border-dashed border-2 border-border">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-accent mb-4" />
                  {searchQuery.trim() ? (
                    <>
                      <p className="text-muted-foreground">No matches for &ldquo;{searchQuery}&rdquo;</p>
                      <p className="text-sm text-muted-foreground/60">Try a different search term</p>
                    </>
                  ) : filter === "new" ? (
                    <>
                      <p className="text-muted-foreground">All caught up!</p>
                      <p className="text-sm text-muted-foreground/60">Every item has been explored.</p>
                    </>
                  ) : filter === "explored" ? (
                    <>
                      <p className="text-muted-foreground">No explored items yet</p>
                      <p className="text-sm text-muted-foreground/60">Try Deep Explore on a word!</p>
                    </>
                  ) : (
                    <>
                      <p className="text-muted-foreground">No items to display</p>
                      <p className="text-sm text-muted-foreground/60">
                        Add items manually or collect from Deep Fog mode
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Deep Exploration Card */}
          {selectedItem && (
            <MysteryExploreCard
              item={selectedItem}
              onCloseAction={() => setSelectedItem(null)}
              onExploreAction={runAIAnalysis}
              onMarkExploredAction={markExplored}
              isAnalyzing={analyzingIds.has(selectedItem.id)}
            />
          )}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!pendingDeleteItem} onOpenChange={(open) => { if (!open) setPendingDeleteItem(null) }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Delete &lsquo;{pendingDeleteItem?.word}&rsquo; from your shelf? This can&apos;t be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPendingDeleteItem(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Review Dialog */}
      <Dialog open={!!quickReviewItem} onOpenChange={(open) => {
        if (!open) {
          // Stop audio and reset TTS state when closing
          if (quickAudioRef.current) {
            quickAudioRef.current.pause()
          }
          setIsQuickTTSPlaying(false)
          setQuickReviewItem(null)
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-accent flex items-center gap-3">
              {quickReviewItem?.word}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleQuickReviewTTS}
                disabled={isQuickTTSLoading}
                className="h-8 w-8 p-0 text-accent hover:bg-accent/20"
                title="Hear pronunciation"
              >
                {isQuickTTSLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : isQuickTTSPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              {quickReviewItem?.pronunciation && (
                <span className="text-sm font-normal text-muted-foreground font-mono">
                  /{quickReviewItem.pronunciation}/
                </span>
              )}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Quick review before marking as explored
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isQuickReviewLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="ml-2 text-muted-foreground">Fetching definition...</span>
              </div>
            ) : quickReviewItem?.definition ? (
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-1">Definition</h4>
                  <p className="text-muted-foreground">{quickReviewItem.definition}</p>
                </div>

                {quickReviewItem.grammarInfo && (
                  <div className="flex flex-wrap gap-2">
                    <span className="px-2 py-1 text-xs rounded-full bg-accent/20 text-accent">
                      {quickReviewItem.grammarInfo.partOfSpeech}
                    </span>
                    {quickReviewItem.grammarInfo.gender && (
                      <span className="px-2 py-1 text-xs rounded-full bg-chart-2/20 text-chart-2">
                        {quickReviewItem.grammarInfo.gender}
                      </span>
                    )}
                  </div>
                )}

                {quickReviewItem.examples && quickReviewItem.examples.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-1">Example</h4>
                    <p className="text-sm text-muted-foreground italic border-l-2 border-accent/30 pl-3">
                      "{quickReviewItem.examples[0]}"
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">
                No definition available. Try Deep Explore for full analysis.
              </p>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setQuickReviewItem(null)}>
              Cancel
            </Button>
            <Button
              className="bg-chart-4 hover:bg-chart-4/80"
              onClick={handleQuickReviewMarkExplored}
              disabled={isQuickReviewLoading}
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark as Explored
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { BookOpen, Search, Sparkles, Trash2, CheckCircle2, Plus, Loader2 } from "lucide-react"

// Types matching API/Schema
type MysteryItem = {
  id: string;
  word: string;
  context: string | null;
  definition: string | null;
  examples: string[] | null;
  isExplored: boolean;
  collected: string; // display string
  createdAt: string; // ISO string
  source: string;
}

export default function MysteryShelfPage() {
  const [items, setItems] = useState<MysteryItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<"all" | "new" | "explored">("all")
  const [selectedItem, setSelectedItem] = useState<MysteryItem | null>(null)

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
          collected: new Date(item.createdAt).toLocaleDateString()
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

  const handleAddItem = async () => {
    if (!newItemWord.trim()) return

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
    setSelectedItem(null)

    try {
      await fetch(`/api/mystery-shelf/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isExplored: true })
      })
    } catch (e) {
      console.error("Failed to update item", e)
      fetchItems() // Revert logic would be better but fetching ensures consistency
    }
  }

  const removeItem = async (id: string) => {
    setItems(items.filter(item => item.id !== id))
    if (selectedItem?.id === id) setSelectedItem(null)

    try {
      await fetch(`/api/mystery-shelf/${id}`, { method: "DELETE" })
    } catch (e) {
      console.error("Failed to delete item", e)
      fetchItems()
    }
  }

  const filteredItems = items.filter((item) => {
    if (filter === "new") return !item.isExplored
    if (filter === "explored") return item.isExplored
    return true
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-7 w-7 text-amber-400" />
            Mystery Shelf
          </h1>
          <p className="text-muted-foreground">
            Your collection of unknowns from Deep Fog mode
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700 text-white">
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button
                  onClick={handleAddItem}
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={!newItemWord.trim() || isSubmitting}
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add to Shelf"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex gap-2">
        {(["all", "new", "explored"] as const).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-amber-600 hover:bg-amber-700"
                : "border-amber-500/30"
            }
          >
            {f === "all" && `All (${items.length})`}
            {f === "new" && `New (${items.filter((i) => !i.isExplored).length})`}
            {f === "explored" &&
              `Explored (${items.filter((i) => i.isExplored).length})`}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <Card
                key={item.id}
                className={`rounded-xl border-amber-500/20 cursor-pointer transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 ${selectedItem?.id === item.id
                    ? "ring-2 ring-amber-500/50"
                    : ""
                  }`}
                onClick={() => setSelectedItem(item)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-amber-300">
                        {item.word}
                      </h3>
                      {item.context && (
                        <p className="text-sm text-muted-foreground italic mt-1 line-clamp-2">
                          "{item.context}"
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground/60 mt-2">
                        Collected: {item.collected} • {item.source}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.isExplored ? (
                        <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Explored
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
                          New
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-amber-500/30 hover:bg-amber-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedItem(item)
                      }}
                    >
                      <Search className="h-3 w-3 mr-1" /> Deep Explore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-purple-500/30 hover:bg-purple-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        markExplored(item.id) // This actually marks as explored in backend
                      }}
                      disabled={item.isExplored}
                    >
                      <Sparkles className="h-3 w-3 mr-1" /> {item.isExplored ? "Reviewed" : "Quick Review"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs border-red-500/30 hover:bg-red-500/10 text-red-400"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeItem(item.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredItems.length === 0 && (
              <Card className="rounded-xl border-dashed border-2 border-muted">
                <CardContent className="p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground">No items to display</p>
                  <p className="text-sm text-muted-foreground/60">
                    Add items manually or from Deep Fog mode
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {selectedItem && (
            <Card className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 sticky top-24 h-fit">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-2xl text-amber-300">
                    {selectedItem.word}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedItem(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    ✕
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedItem.definition ? (
                  <div className="p-4 rounded-xl bg-background/50">
                    <h4 className="text-sm font-medium text-amber-400 mb-2">
                      Definition
                    </h4>
                    <p>{selectedItem.definition}</p>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-amber-200">
                      Deep Explore not yet run on this item.
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2 w-full"
                    // disabled={true}
                    >
                      <Sparkles className="h-3 w-3 mr-2" />
                      Run AI Analysis (Coming Soon)
                    </Button>
                  </div>
                )}

                {selectedItem.context && (
                  <div className="p-4 rounded-xl bg-background/50">
                    <h4 className="text-sm font-medium text-amber-400 mb-2">
                      Context
                    </h4>
                    <p className="italic text-muted-foreground">
                      "{selectedItem.context}"
                    </p>
                  </div>
                )}

                {selectedItem.examples && selectedItem.examples.length > 0 && (
                  <div className="p-4 rounded-xl bg-background/50">
                    <h4 className="text-sm font-medium text-amber-400 mb-2">
                      Usage Examples
                    </h4>
                    <ul className="space-y-2">
                      {selectedItem.examples.map((ex, i) => (
                        <li key={i} className="text-sm italic text-muted-foreground">
                          "{ex}"
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {!selectedItem.isExplored && (
                  <Button
                    className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl mt-4"
                    onClick={() => markExplored(selectedItem.id)}
                  >
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Explored
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

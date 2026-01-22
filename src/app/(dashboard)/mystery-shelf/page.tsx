"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Search, Sparkles, Trash2, CheckCircle2 } from "lucide-react"

const initialItems = [
  {
    id: 1,
    word: "îndoielnic",
    context: "Este îndoielnic că va reuși...",
    collected: "2024-01-15",
    explored: false,
    definition: "doubtful, questionable, uncertain",
    examples: [
      "Calitatea acestui produs este îndoielnică.",
      "E îndoielnic că va veni la timp.",
    ],
  },
  {
    id: 2,
    word: "răbdător",
    context: "Trebuie să fii răbdător cu tine însuți.",
    collected: "2024-01-14",
    explored: false,
    definition: "patient (adjective)",
    examples: [
      "El este foarte răbdător cu copiii.",
      "Fii răbdător, totul va fi bine.",
    ],
  },
  {
    id: 3,
    word: "înfricoșător",
    context: "O experiență înfricoșătoare...",
    collected: "2024-01-13",
    explored: true,
    definition: "frightening, scary, terrifying",
    examples: [
      "Filmul a fost înfricoșător.",
      "A avut un vis înfricoșător.",
    ],
  },
  {
    id: 4,
    word: "neobișnuit",
    context: "Un comportament neobișnuit pentru el.",
    collected: "2024-01-12",
    explored: false,
    definition: "unusual, uncommon, extraordinary",
    examples: [
      "Este un lucru neobișnuit în această zonă.",
      "A fost o zi neobișnuit de caldă.",
    ],
  },
]

export default function MysteryShelfPage() {
  const [items, setItems] = useState(initialItems)
  const [filter, setFilter] = useState<"all" | "new" | "explored">("all")
  const [selectedItem, setSelectedItem] = useState<(typeof items)[0] | null>(
    null
  )

  const filteredItems = items.filter((item) => {
    if (filter === "new") return !item.explored
    if (filter === "explored") return item.explored
    return true
  })

  const markExplored = (id: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, explored: true } : item
      )
    )
    setSelectedItem(null)
  }

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id))
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
              {f === "new" && `New (${items.filter((i) => !i.explored).length})`}
              {f === "explored" &&
                `Explored (${items.filter((i) => i.explored).length})`}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              className={`rounded-xl border-amber-500/20 cursor-pointer transition-all hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5 ${
                selectedItem?.id === item.id
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
                    <p className="text-sm text-muted-foreground italic mt-1">
                      "{item.context}"
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-2">
                      Collected: {item.collected}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.explored ? (
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
                      markExplored(item.id)
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1" /> Quick Review
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
                  Collect words from Deep Fog mode
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {selectedItem && (
          <Card className="rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-orange-500/5 sticky top-24">
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
              <div className="p-4 rounded-xl bg-background/50">
                <h4 className="text-sm font-medium text-amber-400 mb-2">
                  Definition
                </h4>
                <p>{selectedItem.definition}</p>
              </div>

              <div className="p-4 rounded-xl bg-background/50">
                <h4 className="text-sm font-medium text-amber-400 mb-2">
                  Context
                </h4>
                <p className="italic text-muted-foreground">
                  "{selectedItem.context}"
                </p>
              </div>

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

              <div className="p-4 rounded-xl bg-background/50">
                <h4 className="text-sm font-medium text-amber-400 mb-2">
                  Practice
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Try using "{selectedItem.word}" in your own sentence:
                </p>
                <textarea
                  className="w-full h-20 rounded-xl bg-background border border-amber-500/30 p-3 text-sm focus:ring-2 focus:ring-amber-500/30 focus:outline-none"
                  placeholder="Write your sentence here..."
                />
              </div>

              <Button
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl"
                onClick={() => markExplored(selectedItem.id)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Explored
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

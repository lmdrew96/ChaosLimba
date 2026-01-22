"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Cloud,
  BookOpen,
  Headphones,
  Video,
  Plus,
  Filter,
  Shuffle,
} from "lucide-react"

const contentItems = [
  {
    id: 1,
    type: "article",
    title: "Complexitatea sistemului educațional",
    level: "C1",
    duration: "8 min read",
    preview:
      "Complexitatea sistemului educațional românesc reflectă tensiunile inerente dintre tradiție și modernitate...",
    icon: BookOpen,
  },
  {
    id: 2,
    type: "podcast",
    title: "Conversații despre cultură",
    level: "B2",
    duration: "15 min",
    preview:
      "Discuție despre evoluția culturii române contemporane și influențele globale...",
    icon: Headphones,
  },
  {
    id: 3,
    type: "video",
    title: "Documentar: Delta Dunării",
    level: "B2",
    duration: "22 min",
    preview:
      "Explorați biodiversitatea unică a Deltei Dunării, una dintre cele mai importante zone umede...",
    icon: Video,
  },
  {
    id: 4,
    type: "article",
    title: "Istoria cuvintelor românești",
    level: "C1",
    duration: "12 min read",
    preview:
      "Originile și evoluția limbii române, de la latina vulgară la influențele moderne...",
    icon: BookOpen,
  },
  {
    id: 5,
    type: "podcast",
    title: "Povești din București",
    level: "B1",
    duration: "18 min",
    preview:
      "Bucureștiul prin ochii localnicilor: povești, amintiri și transformări urbane...",
    icon: Headphones,
  },
  {
    id: 6,
    type: "article",
    title: "Tradițiile de iarnă",
    level: "B1",
    duration: "6 min read",
    preview:
      "Obiceiuri și tradiții românești specifice sărbătorilor de iarnă, de la colinde la urături...",
    icon: BookOpen,
  },
]

const typeColors = {
  article: { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/20" },
  podcast: { bg: "bg-purple-500/10", text: "text-purple-400", border: "border-purple-500/20" },
  video: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" },
}

export default function DeepFogPage() {
  const [filter, setFilter] = useState<"all" | "article" | "podcast" | "video">(
    "all"
  )
  const [selectedContent, setSelectedContent] = useState<
    (typeof contentItems)[0] | null
  >(null)

  const filteredContent = contentItems.filter((item) => {
    if (filter === "all") return true
    return item.type === filter
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
          >
            <Shuffle className="h-4 w-4 mr-1" /> Random
          </Button>
          <Button
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Filter className="h-4 w-4 mr-1" /> Filter
          </Button>
        </div>
      </div>

      <Card className="rounded-2xl border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Your level:</span>
            <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400">
              B1 Intermediate
            </span>
            <span className="text-muted-foreground">•</span>
            <span className="text-muted-foreground">
              Content shown is 1-2 levels above you for optimal immersion
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        {(["all", "article", "podcast", "video"] as const).map((f) => (
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
            {f === "article" && (
              <>
                <BookOpen className="h-4 w-4 mr-1" /> Articles
              </>
            )}
            {f === "podcast" && (
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

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredContent.map((item) => {
          const colors = typeColors[item.type as keyof typeof typeColors]
          return (
            <Card
              key={item.id}
              className={`rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:shadow-lg ${colors.border}`}
              onClick={() => setSelectedContent(item)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg ${colors.bg}`}>
                    <item.icon className={`h-5 w-5 ${colors.text}`} />
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 text-xs rounded-full bg-amber-500/20 text-amber-400">
                      {item.level}
                    </span>
                  </div>
                </div>
                <h3 className="font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {item.preview}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    {item.duration}
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
          )
        })}
      </div>

      {selectedContent && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="max-w-3xl w-full max-h-[80vh] overflow-y-auto rounded-2xl border-indigo-500/30">
            <CardHeader className="flex flex-row items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-amber-500/20 text-amber-400">
                    {selectedContent.level} - Above Your Level
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {selectedContent.duration}
                  </span>
                </div>
                <CardTitle className="text-xl">
                  {selectedContent.title}
                </CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedContent(null)}
              >
                ✕
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-6 rounded-xl bg-muted/30 leading-relaxed">
                <p className="text-lg">
                  Complexitatea sistemului educațional românesc reflectă{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    tensiunile inerente
                  </span>{" "}
                  dintre tradiție și modernitate. Deși reformele{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    succesive
                  </span>{" "}
                  au încercat să{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    atenueze
                  </span>{" "}
                  aceste contradicții,{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    persistența
                  </span>{" "}
                  unor practici{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    învechite
                  </span>{" "}
                  continuă să{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    împiedice
                  </span>{" "}
                  progresul spre un sistem mai{" "}
                  <span className="bg-yellow-500/30 px-1 rounded cursor-pointer hover:bg-yellow-500/40 transition-colors">
                    echitabil
                  </span>{" "}
                  și eficient.
                </p>
              </div>

              <Card className="rounded-xl border-amber-500/20 bg-amber-500/5">
                <CardContent className="p-4">
                  <p className="text-sm text-amber-400 mb-2">
                    💡 Click on highlighted words to add them to your Mystery
                    Shelf
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Don't worry about understanding everything. The fog is
                    supposed to be thick!
                  </p>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button className="flex-1 bg-amber-600 hover:bg-amber-700 rounded-xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Selection to Mystery Shelf
                </Button>
                <Button
                  variant="outline"
                  className="border-indigo-500/30"
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
  )
}

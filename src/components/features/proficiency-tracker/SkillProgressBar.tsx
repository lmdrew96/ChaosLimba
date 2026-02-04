"use client"

import { cn } from "@/lib/utils"
import type { CEFRLevel } from "@/lib/proficiency"
import { Headphones, BookOpen, Mic2, PenTool } from "lucide-react"

interface SkillProgressBarProps {
    skill: 'listening' | 'reading' | 'speaking' | 'writing'
    score: number
    level: CEFRLevel
}

const skillConfig = {
    listening: {
        icon: Headphones,
        label: "Listening",
        color: "from-accent to-accent/70",
        bgColor: "bg-accent/10",
        textColor: "text-accent",
    },
    reading: {
        icon: BookOpen,
        label: "Reading",
        color: "from-chart-3 to-chart-3/70",
        bgColor: "bg-chart-3/10",
        textColor: "text-chart-3",
    },
    speaking: {
        icon: Mic2,
        label: "Speaking",
        color: "from-secondary to-secondary/70",
        bgColor: "bg-secondary/10",
        textColor: "text-secondary",
    },
    writing: {
        icon: PenTool,
        label: "Writing",
        color: "from-chart-4 to-chart-4/70",
        bgColor: "bg-chart-4/10",
        textColor: "text-chart-4",
    },
}

export function SkillProgressBar({ skill, score, level }: SkillProgressBarProps) {
    const config = skillConfig[skill]
    const Icon = config.icon

    return (
        <div className="group p-4 rounded-xl bg-muted/30 border border-border hover:border-border/80 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <Icon className={cn("h-5 w-5", config.textColor)} />
                    </div>
                    <span className="font-medium text-foreground">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("text-xl font-bold", config.textColor)}>
                        {Math.round(score)}
                    </span>
                    <span className="text-sm text-muted-foreground font-medium px-2 py-0.5 bg-muted/20 rounded">
                        {level}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                        config.color
                    )}
                    style={{ width: `${score}%` }}
                />
            </div>
        </div>
    )
}

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
        color: "from-cyan-500 to-blue-500",
        bgColor: "bg-cyan-500/10",
        textColor: "text-cyan-400",
    },
    reading: {
        icon: BookOpen,
        label: "Reading",
        color: "from-amber-500 to-orange-500",
        bgColor: "bg-amber-500/10",
        textColor: "text-amber-400",
    },
    speaking: {
        icon: Mic2,
        label: "Speaking",
        color: "from-pink-500 to-rose-500",
        bgColor: "bg-pink-500/10",
        textColor: "text-pink-400",
    },
    writing: {
        icon: PenTool,
        label: "Writing",
        color: "from-emerald-500 to-teal-500",
        bgColor: "bg-emerald-500/10",
        textColor: "text-emerald-400",
    },
}

export function SkillProgressBar({ skill, score, level }: SkillProgressBarProps) {
    const config = skillConfig[skill]
    const Icon = config.icon

    return (
        <div className="group p-4 rounded-xl bg-black/20 border border-white/5 hover:border-white/10 transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg", config.bgColor)}>
                        <Icon className={cn("h-5 w-5", config.textColor)} />
                    </div>
                    <span className="font-medium text-slate-200">{config.label}</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className={cn("text-xl font-bold", config.textColor)}>
                        {Math.round(score)}
                    </span>
                    <span className="text-sm text-slate-400 font-medium px-2 py-0.5 bg-white/5 rounded">
                        {level}
                    </span>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-2 bg-black/40 rounded-full overflow-hidden">
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

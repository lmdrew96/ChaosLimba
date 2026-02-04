"use client"

import { Badge } from "@/components/ui/badge"
import { Wrench } from "lucide-react"

interface FeatureExplored {
  featureKey: string
  featureName: string
  correct: boolean
}

interface FeatureProgressProps {
  featuresExplored: FeatureExplored[]
  sessionChallengeCount: number
}

export function FeatureProgress({ featuresExplored, sessionChallengeCount }: FeatureProgressProps) {
  if (featuresExplored.length === 0 && sessionChallengeCount === 0) {
    return null
  }

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap shrink-0">
        <Wrench className="h-3.5 w-3.5" />
        <span>{sessionChallengeCount} challenge{sessionChallengeCount !== 1 ? "s" : ""}</span>
      </div>

      <div className="h-4 w-px bg-border/40 shrink-0" />

      <div className="flex items-center gap-1.5 overflow-x-auto">
        {featuresExplored.map((feature, i) => (
          <Badge
            key={`${feature.featureKey}-${i}`}
            variant="outline"
            className={`whitespace-nowrap text-xs shrink-0 ${
              feature.correct
                ? "bg-chart-4/10 text-chart-4 border-chart-4/30"
                : "bg-chart-3/10 text-chart-3 border-chart-3/30"
            }`}
          >
            {feature.featureName}
          </Badge>
        ))}
      </div>
    </div>
  )
}

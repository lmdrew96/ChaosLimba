"use client"

import { Badge } from "@/components/ui/badge"
import { Wrench } from "lucide-react"
import { challengeTypeConfig } from "@/components/features/workshop/ChallengeCard"
import type { WorkshopChallengeType } from "@/lib/ai/workshop"

interface FeatureExplored {
  featureKey: string
  featureName: string
  correct: boolean
  challengeType?: WorkshopChallengeType
}

interface FeatureProgressProps {
  featuresExplored: FeatureExplored[]
  sessionChallengeCount: number
}

export function FeatureProgress({ featuresExplored, sessionChallengeCount }: FeatureProgressProps) {
  if (featuresExplored.length === 0 && sessionChallengeCount === 0) {
    return null
  }

  const correctCount = featuresExplored.filter(f => f.correct).length
  const accuracy = featuresExplored.length > 0
    ? Math.round((correctCount / featuresExplored.length) * 100)
    : 0

  // Count type occurrences for distribution dots
  const typeCounts = new Map<string, number>()
  for (const f of featuresExplored) {
    if (f.challengeType) {
      typeCounts.set(f.challengeType, (typeCounts.get(f.challengeType) || 0) + 1)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap shrink-0">
          <Wrench className="h-3.5 w-3.5" />
          <span>{sessionChallengeCount} challenge{sessionChallengeCount !== 1 ? "s" : ""}</span>
        </div>

        {featuresExplored.length > 0 && (
          <>
            <div className="h-4 w-px bg-border/40 shrink-0" />
            <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
              {accuracy}% accuracy
            </span>
          </>
        )}

        <div className="h-4 w-px bg-border/40 shrink-0" />

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {featuresExplored.map((feature, i) => {
            const typeConfig = feature.challengeType
              ? challengeTypeConfig[feature.challengeType]
              : null
            const TypeIcon = typeConfig?.icon

            return (
              <Badge
                key={`${feature.featureKey}-${i}`}
                variant="outline"
                className={`whitespace-nowrap text-xs shrink-0 gap-1 ${
                  feature.correct
                    ? "bg-chart-4/10 text-chart-4 border-chart-4/30"
                    : "bg-chart-3/10 text-chart-3 border-chart-3/30"
                }`}
              >
                {TypeIcon && <TypeIcon className="h-3 w-3" />}
                {feature.featureName}
              </Badge>
            )
          })}
        </div>
      </div>

      {/* Type distribution dots */}
      {typeCounts.size > 0 && (
        <div className="flex items-center gap-1 pl-0.5">
          {Array.from(typeCounts.entries()).map(([type, count]) => {
            const config = challengeTypeConfig[type]
            if (!config) return null
            return Array.from({ length: count }, (_, i) => (
              <div
                key={`${type}-${i}`}
                className={`w-2 h-2 rounded-full ${config.borderColor.replace('border-l-', 'bg-')}`}
                title={`${config.label} (${count})`}
              />
            ))
          })}
        </div>
      )}
    </div>
  )
}

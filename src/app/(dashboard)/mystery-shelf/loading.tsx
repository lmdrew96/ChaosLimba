import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <Skeleton className="h-16 w-32 rounded-xl" />
        <Skeleton className="h-16 w-32 rounded-xl" />
        <Skeleton className="h-16 w-32 rounded-xl" />
      </div>

      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-[500px] rounded-xl" />
      </div>
    </div>
  )
}

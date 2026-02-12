import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Content + Chat area */}
      <div className="grid md:grid-cols-2 gap-6">
        <Skeleton className="h-[500px] rounded-2xl" />
        <Skeleton className="h-[500px] rounded-2xl" />
      </div>
    </div>
  )
}

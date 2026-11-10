import { toolsContent } from "@/content/tools"
import { useCollections } from "@/lib/queries"
import { Skeleton } from "@/components/ui/skeleton"
import { MilvusGroup } from "./milvus-group"

export function RightSidebar() {
  const { data: collections, isPending, error } = useCollections()

  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto rounded-shell bg-card p-5 shadow-shell-soft">
      <p className="mb-4 text-sm font-semibold">{toolsContent.title}</p>
      {isPending && <Skeleton className="h-10 w-full" />}
      {error && <p className="text-sm text-error">{error.message}</p>}
      {collections && <MilvusGroup collections={collections} />}
    </aside>
  )
}
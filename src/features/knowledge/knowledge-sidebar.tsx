import { toolsContent } from "@/content/tools"
import { Skeleton } from "@/components/ui/skeleton"
import { CollectionList } from "./collection-list"
import { useCollections } from "./api/queries"

export function KnowledgeSidebar() {
  const { data: collections, isPending, error } = useCollections()

  return (
    <aside className="w-[280px] shrink-0 overflow-y-auto rounded-shell bg-card p-5 shadow-shell-soft">
      <p className="mb-4 text-sm font-semibold">{toolsContent.title}</p>
      {isPending && <Skeleton className="h-10 w-full" />}
      {error && <p className="text-sm text-error">{error.message}</p>}
      {collections && <CollectionList collections={collections} />}
    </aside>
  )
}
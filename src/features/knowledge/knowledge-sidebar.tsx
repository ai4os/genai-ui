import { toolsContent } from "@/content/tools";
import { Skeleton } from "@/components/ui/skeleton";
import { CollectionList } from "./collection-list";
import { useCollections } from "./api/queries";
import { useKnowledgeSelection } from "./use-knowledge-selection";

export function KnowledgeSidebar() {
  const { data: collections, isPending, error } = useCollections();
  const { milvusDisabled } = useKnowledgeSelection();

  return (
    <aside
      aria-label={toolsContent.title}
      className="w-[320px] shrink-0 overflow-y-auto rounded-shell bg-card shadow-shell-soft"
    >
      <header className="border-b border-border px-5 py-4">
        <h1 className="text-xl font-semibold tracking-tight text-center">
          {toolsContent.title}
        </h1>
      </header>

      <div
        className={`flex flex-col gap-6 px-3 py-5 ${
          milvusDisabled ? "cursor-not-allowed" : ""
        }`}
      >
        {isPending && (
          <>
            <section aria-labelledby="knowledge-heading">
              <h2
                id="knowledge-heading"
                className="mb-3 px-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"
              >
                {toolsContent.milvus.title}
              </h2>
              <Skeleton className="h-11 w-full rounded-[10px]" />
            </section>
          </>
        )}
        {error && <p className="px-2 text-sm text-error">{error.message}</p>}
        {collections && <CollectionList collections={collections} />}
      </div>
    </aside>
  );
}

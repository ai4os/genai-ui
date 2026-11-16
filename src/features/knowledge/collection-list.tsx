import { useState } from "react";
import { Check, ChevronDownIcon, Globe, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsContent } from "@/content/tools";
import { Button } from "@/components/ui/button";
import {
  CreateCollectionDialog,
  type CreateCollectionData,
} from "./dialogs/create-collection-dialog";
import { CollectionDocsDialog } from "./dialogs/collection-documents-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import type { Collection, CollectionCreate } from "@/lib/types";
import { useCreateCollection, useDeleteCollection } from "./api/queries";
import { useKnowledgeSelection } from "./use-knowledge-selection";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

function getCollectionId(collection: Collection) {
  return collection.id;
}

function CollectionCard({
  collection,
  selected,
  onToggle,
  onOpenFiles,
}: Readonly<{
  collection: Collection;
  selected: boolean;
  onToggle: () => void;
  onOpenFiles: () => void;
}>) {
  return (
    <div
      onClick={onOpenFiles}
      className={cn(
        "mb-2 flex w-full items-center gap-2.5 rounded-md border px-3 py-2.5 text-left text-sm transition-colors cursor-pointer bg-card",
        selected
          ? "border-primary-400 bg-primary-50"
          : "hover:border-primary-400",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary-50 text-primary-700">
        {collection.scope === "public" ? (
          <Globe className="size-3.5" />
        ) : (
          <Lock className="size-3.5" />
        )}
      </span>

      <span className="flex-1 truncate">{collection.name}</span>

      <div
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded border transition-colors cursor-pointer",
          selected
            ? "border-primary-600 bg-primary-600"
            : "border-border bg-background",
        )}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-checked={selected}
        role="checkbox"
      >
        {selected && <Check className="size-3 text-white" />}
      </div>
    </div>
  );
}

export function CollectionList({
  collections,
  onCollectionCreated,
}: Readonly<{
  collections: Collection[];
  onCollectionCreated?: (collection: Collection) => void;
}>) {
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();

  const { selectedIds, toggle, toggleAll, milvusDisabled } =
    useKnowledgeSelection();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [filesCollection, setFilesCollection] = useState<Collection | null>(
    null,
  );

  const allSelected =
    collections.length > 0 &&
    collections.every((c) => selectedIds.has(getCollectionId(c)));

  const handleCreateCollection = async (data: CreateCollectionData) => {
    const payload: CollectionCreate = {
      name: data.name,
      description: data.description,
      type: "knowledge_base",
    };

    const created = await createCollection.mutateAsync(payload);

    onCollectionCreated?.(created);
    toggle(getCollectionId(created));
  };

  const publicCollections = collections.filter((c) => c.scope === "public");
  const privateCollections = collections.filter((c) => c.scope !== "public");

  const body = (
    <div
      className={cn(
        milvusDisabled && "pointer-events-none select-none opacity-50",
      )}
      aria-disabled={milvusDisabled}
      inert={milvusDisabled}
    >
      <div className="mb-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
            {toolsContent.milvus.title}
          </p>

          {collections.length > 0 && (
            <button
              type="button"
              onClick={() => toggleAll(collections.map(getCollectionId))}
              className="text-[11px] font-medium text-primary-700 hover:underline cursor-pointer"
            >
              {allSelected
                ? toolsContent.milvus.unselectAll
                : toolsContent.milvus.selectAll}
            </button>
          )}
        </div>

        <Collapsible className="rounded-md data-open:bg-muted">
          <CollapsibleTrigger
            render={
              <Button variant="ghost" className="w-full">
                {toolsContent.milvus.collections.public}
                <ChevronDownIcon className="ml-auto group-data-panel-open/button:rotate-180" />
              </Button>
            }
          />
          <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            {publicCollections.map((c) => {
              const id = getCollectionId(c);
              return (
                <CollectionCard
                  key={id}
                  collection={c}
                  selected={selectedIds.has(id)}
                  onToggle={() => toggle(id)}
                  onOpenFiles={() => setFilesCollection(c)}
                />
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        {publicCollections.length > 0 && privateCollections.length > 0 && (
          <hr className="my-3 border-border" />
        )}

        <Collapsible className="rounded-md data-open:bg-muted">
          <CollapsibleTrigger
            render={
              <Button variant="ghost" className="w-full">
                {toolsContent.milvus.collections.private}
                <ChevronDownIcon className="ml-auto group-data-panel-open/button:rotate-180" />
              </Button>
            }
          />
          <CollapsibleContent className="flex flex-col items-start gap-2 p-2.5 pt-0 text-sm">
            {privateCollections.map((c) => {
              const id = getCollectionId(c);
              return (
                <CollectionCard
                  key={id}
                  collection={c}
                  selected={selectedIds.has(id)}
                  onToggle={() => toggle(id)}
                  onOpenFiles={() => setFilesCollection(c)}
                />
              );
            })}
          </CollapsibleContent>
        </Collapsible>

        <Button
          type="button"
          variant="brandOutline"
          onClick={() => setIsCreateOpen(true)}
          className="w-full mt-2"
        >
          + {toolsContent.milvus.collections.create}
        </Button>

        <CreateCollectionDialog
          open={isCreateOpen}
          onOpenChange={setIsCreateOpen}
          onCreate={handleCreateCollection}
        />

        <CollectionDocsDialog
          collection={filesCollection}
          onOpenChange={(open) => {
            if (!open) setFilesCollection(null);
          }}
          onDeleteCollection={async (id) => {
            await deleteCollection.mutateAsync(id);
          }}
        />
      </div>
    </div>
  );

  if (!milvusDisabled) return <div className="mb-5">{body}</div>;

  return (
    <Tooltip>
      <TooltipTrigger render={<div className="mb-5 cursor-not-allowed" />}>
        {body}
      </TooltipTrigger>
      <TooltipContent side="left">
        {toolsContent.milvus.unsupportedByModel}
      </TooltipContent>
    </Tooltip>
  );
}

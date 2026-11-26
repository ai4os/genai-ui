import { useEffect, useState } from "react";
import { ChevronDownIcon, Info, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { toolsContent } from "@/content/tools";
import { Button } from "@/components/ui/button";
import {
  CreateCollectionDialog,
  type CreateCollectionData,
} from "./dialogs/create-collection-dialog";
import { CollectionDocsDialog } from "./dialogs/collection-documents-dialog";
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

function CollectionRow({
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
    <li className="flex h-11 items-center gap-1 rounded-[10px] pr-1 pl-2 hover:bg-soft">
      <label
        className="flex h-full min-w-0 flex-1 cursor-pointer items-center gap-2.5 text-sm"
        title={collection.name ?? collection.id}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          className="m-0 size-[18px] shrink-0 cursor-pointer accent-primary"
        />
        <span className="truncate">{collection.name ?? collection.id}</span>
      </label>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label={toolsContent.milvus.viewDetails.replace(
          "{name}",
          collection.name ?? collection.id,
        )}
        onClick={onOpenFiles}
        className="text-muted-foreground"
      >
        <Info strokeWidth={1.75} />
      </Button>
    </li>
  );
}

function CollectionGroup({
  label,
  collections,
  selectedIds,
  onToggle,
  onOpenFiles,
}: Readonly<{
  label: string;
  collections: Collection[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  onOpenFiles: (collection: Collection) => void;
}>) {
  return (
    <Collapsible defaultOpen>
      <CollapsibleTrigger className="group/trigger flex h-9 w-full cursor-pointer items-center justify-between rounded-lg px-2 text-xs font-semibold tracking-[0.06em] text-muted-foreground uppercase outline-none hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
        <span>{label}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="size-4 transition-transform group-data-panel-open/trigger:rotate-180"
          strokeWidth={2}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="m-0 list-none p-0">
          {collections.map((c) => {
            const id = getCollectionId(c);
            return (
              <CollectionRow
                key={id}
                collection={c}
                selected={selectedIds.has(id)}
                onToggle={() => onToggle(id)}
                onOpenFiles={() => onOpenFiles(c)}
              />
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
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

  const {
    selectedIds,
    toggle,
    toggleAll,
    removeSelectedId,
    milvusDisabled,
    clearSelection,
  } = useKnowledgeSelection();
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

  const selectedCount = collections.filter((c) =>
    selectedIds.has(getCollectionId(c)),
  ).length;

  useEffect(() => {
    if (milvusDisabled) {
      clearSelection();
    }
  }, [milvusDisabled, clearSelection]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 pb-1 pl-2">
        <div>
          <h2 className="text-base font-semibold">
            {toolsContent.milvus.title}
          </h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">
            {toolsContent.milvus.selectedCount.replace(
              "{count}",
              String(selectedCount),
            )}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={milvusDisabled || collections.length === 0}
          onClick={() => toggleAll(collections.map(getCollectionId))}
        >
          {allSelected
            ? toolsContent.milvus.clear
            : toolsContent.milvus.selectAll}
        </Button>
      </div>

      {milvusDisabled && (
        <p className="mx-2 mb-1 rounded-[10px] bg-soft px-3 py-2 text-[13px] leading-snug text-muted-foreground">
          {toolsContent.milvus.unsupportedByModel}
        </p>
      )}

      <div
        className={cn(
          "flex flex-col gap-2",
          milvusDisabled && "pointer-events-none opacity-55 select-none",
        )}
        aria-disabled={milvusDisabled}
        inert={milvusDisabled}
      >
        <CollectionGroup
          label={toolsContent.milvus.collections.public}
          collections={publicCollections}
          selectedIds={selectedIds}
          onToggle={toggle}
          onOpenFiles={setFilesCollection}
        />
        <CollectionGroup
          label={toolsContent.milvus.collections.private}
          collections={privateCollections}
          selectedIds={selectedIds}
          onToggle={toggle}
          onOpenFiles={setFilesCollection}
        />

        <div className="px-2 pt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setIsCreateOpen(true)}
            className="w-full"
          >
            <Plus strokeWidth={2} />
            {toolsContent.milvus.collections.new}
          </Button>
        </div>
      </div>

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
          removeSelectedId(id);
        }}
      />
    </div>
  );
}

import { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { toolsContent } from "@/content/tools";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { toast } from "sonner";
import { sharedContent } from "@/content/shared";
import type { Collection } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { addDocument, deleteDocument, listDocuments } from "@/lib/knowledge";

/** Documents shown per page. Keep <= the backend max (200). */
const PAGE_SIZE = 25;

/** How long a page stays cached in the client before being refetched. */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedPage = { items: string[]; total: number; at: number };

interface CollectionFilesDialogProps {
  collection: Collection | null;
  onOpenChange: (open: boolean) => void;
  /**
   * Called when the user confirms deleting the whole collection.
   * Should throw/reject on failure. The modal closes itself on success.
   */
  onDeleteCollection: (collectionId: string) => Promise<void>;
}

export function CollectionDocsDialog({
  collection,
  onOpenChange,
  onDeleteCollection,
}: Readonly<CollectionFilesDialogProps>) {
  const api = useApi();

  // Files of the current page
  const [files, setFiles] = useState<string[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  // Bumped to force a reload of the current page (after upload/delete)
  const [reloadKey, setReloadKey] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingFileName, setDeletingFileName] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeletingCollection, setIsDeletingCollection] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  // Client-side cache of already fetched pages, keyed by `${collectionId}:${page}`.
  // Lets us show a visited page instantly, with no loader and no server call.
  const pageCacheRef = useRef(new Map<string, CachedPage>());
  const collectionId = collection?.id ?? collection?.name ?? null;
  const isPrivate = collection?.scope !== "public";
  const description = collection?.description?.trim() || null;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Reset local state synchronously when the collection changes
  // (avoids a wasted fetch with the previous collection's page number).
  const [prevCollectionId, setPrevCollectionId] = useState(collectionId);
  if (prevCollectionId !== collectionId) {
    setPrevCollectionId(collectionId);
    setPage(1);
    setFiles(null);
    setTotal(0);
    setError(null);
    setIsLoading(false);
    setIsConfirmingDelete(false);
  }

  useEffect(() => {
    if (!collectionId) return;

    // Cache hit: show the page right away, without loader or request.
    const cacheKey = `${collectionId}:${page}`;
    const cached = pageCacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      setFiles(cached.items);
      setTotal(cached.total);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    listDocuments(api, collectionId, page, PAGE_SIZE)
      .then((result) => {
        if (cancelled) return;

        // Current page no longer exists (e.g. last item of the last page was
        // deleted): jump to the new last page, which triggers a new fetch.
        const lastPage = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
        if (page > lastPage) {
          setPage(lastPage);
          return;
        }

        pageCacheRef.current.set(cacheKey, {
          items: result.items,
          total: result.total,
          at: Date.now(),
        });
        setFiles(result.items);
        setTotal(result.total);
      })
      .catch(() => {
        if (!cancelled) setError(toolsContent.milvus.toasts.loadFilesError);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [collectionId, page, reloadKey, api])

  // Called after upload/delete. Documents are sorted, so any change can shift
  // every page: drop all cached pages of this collection and refetch.
  const reloadCurrentPage = () => {
    if (collectionId) {
      for (const key of pageCacheRef.current.keys()) {
        if (key.startsWith(`${collectionId}:`)) {
          pageCacheRef.current.delete(key);
        }
      }
    }
    setReloadKey((k) => k + 1);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile || !collectionId) return;

    setIsUploading(true);
    try {
      await addDocument(api, collectionId, selectedFile);
      toast.success(toolsContent.milvus.toasts.uploadSuccess);
      reloadCurrentPage();
    } catch {
      toast.error(toolsContent.milvus.toasts.uploadError);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteDocument = async (filename: string) => {
    if (!collectionId) return;

    setDeletingFileName(filename);
    try {
      await deleteDocument(api, collectionId, filename);
      toast.success(toolsContent.milvus.toasts.deleteSuccess);
      reloadCurrentPage();
    } catch {
      toast.error(toolsContent.milvus.toasts.deleteError);
    } finally {
      setDeletingFileName(null);
    }
  };

  const handleDeleteCollection = async () => {
    if (!collectionId) return;

    setIsDeletingCollection(true);
    try {
      await onDeleteCollection(collectionId);
      toast.success(toolsContent.milvus.toasts.deleteCollectionSuccess);
      onOpenChange(false);
    } catch {
      toast.error(toolsContent.milvus.toasts.deleteCollectionError);
    } finally {
      setIsDeletingCollection(false);
      setIsConfirmingDelete(false);
    }
  };

  const countLabel =
    total > 0
      ? `${total} document${total === 1 ? "" : "s"}${toolsContent.milvus.files.numberOfDocs}`
      : "";

  const isBusy = isUploading || isDeletingCollection;
  // Spinner on every load (first open, page change, reload after upload/delete)
  const showSpinner = isLoading;

  return (
    <Dialog open={collection !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="truncate">
            {collection ? getCollectionId(collection) : ""}
          </DialogTitle>
          {/* Visible only when the collection has a description */}
          <DialogDescription className={cn(!description && "sr-only")}>
            {description ?? countLabel}
          </DialogDescription>

          {isPrivate && (
            <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy || isConfirmingDelete}
                onClick={() => fileInputRef.current?.click()}
                className="gap-1.5 text-xs cursor-pointer"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {toolsContent.milvus.files.uploading}
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    {toolsContent.milvus.files.upload}
                  </>
                )}
              </Button>

              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isBusy || isConfirmingDelete}
                onClick={() => setIsConfirmingDelete(true)}
                className="gap-1.5 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              >
                <Trash2 className="size-3.5" />
                {toolsContent.milvus.collections.delete}
              </Button>
            </div>
          )}
        </DialogHeader>

        {isPrivate && isConfirmingDelete && (
          <div
            role="alert"
            className="flex flex-row justify-between items-center gap-3 rounded-md border border-destructive/30 bg-destructive/10 p-3"
          >
            <p className="text-sm font-medium text-destructive">
              {toolsContent.milvus.collections.delete} {'"'}
              {collection ? getCollectionId(collection) : ""}&rdquo;?
            </p>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isDeletingCollection}
                onClick={() => setIsConfirmingDelete(false)}
                className="text-xs cursor-pointer"
              >
                {sharedContent.cancel}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="destructive"
                disabled={isDeletingCollection}
                onClick={handleDeleteCollection}
                className="gap-1.5 bg-destructive text-xs text-white hover:bg-destructive/90 cursor-pointer"
              >
                {isDeletingCollection ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    {sharedContent.deleting}
                  </>
                ) : (
                  sharedContent.delete
                )}
              </Button>
            </div>
          </div>
        )}

        {/* With several pages the height is fixed so the modal doesn't jump
            between loading and loaded states (or on a shorter last page). */}
        <div
          className={cn(
            "mt-2 overflow-x-hidden overflow-y-auto rounded-md border",
            totalPages > 1 ? "h-96" : "max-h-96",
          )}
        >
          {showSpinner && (
            <div className="flex h-full items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              {toolsContent.milvus.files.loading}
            </div>
          )}

          {!showSpinner && error && (
            <p className="px-3 py-6 text-center text-sm text-error">{error}</p>
          )}

          {!showSpinner && !error && files && total === 0 && (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {toolsContent.milvus.collections.empty}
            </p>
          )}

          {!showSpinner &&
            !error &&
            files &&
            files.length > 0 &&
            files.map((fileName, index) => (
              <div
                key={`${fileName}-${index}`}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 text-sm",
                  index !== files.length - 1 && "border-b border-border",
                )}
              >
                <FileText className="size-3.5 shrink-0 text-muted-foreground" />

                <FileName name={fileName} />

                {/* Delete document button (only for private collections) */}
                {isPrivate && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "shrink-0 cursor-pointer gap-1.5 text-xs text-muted-foreground hover:text-destructive",
                            deletingFileName === fileName
                              ? "h-7 w-auto px-2"
                              : "size-7",
                          )}
                          onClick={() => handleDeleteDocument(fileName)}
                          disabled={deletingFileName === fileName}
                        >
                          {deletingFileName === fileName ? (
                            <>
                              <Loader2 className="size-3.5 animate-spin" />
                              {sharedContent.deleting}
                            </>
                          ) : (
                            <Trash2 className="size-3.5" />
                          )}
                        </Button>
                      }
                    />
                    <TooltipContent>{sharedContent.delete}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            ))}
        </div>

        {(countLabel || totalPages > 1) && (
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">{countLabel}</p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  aria-label="Previous page"
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="min-w-14 text-center text-xs tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-7 cursor-pointer"
                  aria-label="Next page"
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function getCollectionId(collection: Collection) {
  return collection.name ?? collection.id;
}

/** File name that shows its full text in a tooltip only when it is truncated. */
function FileName({ name }: Readonly<{ name: string }>) {
  const ref = useRef<HTMLSpanElement>(null);
  const [isTruncated, setIsTruncated] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const check = () => setIsTruncated(el.scrollWidth > el.clientWidth);
    check();

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [name]);

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span ref={ref} className="min-w-0 flex-1 truncate">
            {name}
          </span>
        }
      />
      {isTruncated && (
        <TooltipContent className="max-w-xs break-all">{name}</TooltipContent>
      )}
    </Tooltip>
  );
}

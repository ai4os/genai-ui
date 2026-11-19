import { useEffect, useState, useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  Loader2,
  MoreHorizontal,
  Trash2,
  Upload,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

import { toolsContent } from "@/content/tools";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { sharedContent } from "@/content/shared";
import type { Collection } from "@/lib/types";
import { useApi } from "@/lib/use-api";
import { addDocument, deleteDocument, listDocuments } from "@/features/knowledge/api/documents";

/** Documents shown per page. Keep <= the backend max (200). */
const PAGE_SIZE = 25;

/** How long a page stays cached in the client before being refetched. */
const CACHE_TTL_MS = 5 * 60 * 1000;

type CachedPage = { items: string[]; total: number; at: number };

interface CollectionFilesDialogProps {
  collection: Collection | null;
  onOpenChange: (open: boolean) => void;
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
  const showSpinner = isLoading;

  const collectionName = collection ? getCollectionId(collection) : "";

  return (
    <Dialog open={collection !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader className="gap-0 pr-10">
          <DialogTitle className="truncate">{collectionName}</DialogTitle>

          {/* Visible only when the collection has a description */}
          <DialogDescription
            className={cn(
              "mt-2 leading-normal",
              !description && "sr-only",
            )}
          >
            {description ?? countLabel}
          </DialogDescription>
        </DialogHeader>

        {isPrivate && (
          <div className="mt-3 mb-2 flex items-center justify-end gap-2">
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              onChange={handleFileChange}
            />

            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={isBusy || isConfirmingDelete}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="animate-spin" />
                  {toolsContent.milvus.files.uploading}
                </>
              ) : (
                <>
                  <Upload strokeWidth={1.75} />
                  {toolsContent.milvus.files.upload}
                </>
              )}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                disabled={isBusy || isConfirmingDelete}
                aria-label={toolsContent.milvus.collections.options}
                className={buttonVariants({ variant: "ghost", size: "icon-sm" })}
              >
                <MoreHorizontal strokeWidth={1.75} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => setIsConfirmingDelete(true)}
                >
                  <Trash2 strokeWidth={1.75} />
                  {toolsContent.milvus.collections.delete}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}

        <div
          className={cn(
            "mt-2 overflow-x-hidden overflow-y-auto rounded-[14px] border border-border",
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
                  "flex h-12 items-center gap-3 py-0 pr-1.5 pl-3 text-sm",
                  index !== files.length - 1 && "border-b border-border",
                )}
              >
                <FileText
                  aria-hidden="true"
                  className="size-[18px] shrink-0 text-muted-foreground"
                  strokeWidth={1.75}
                />

                <FileName name={fileName} />

                {/* Delete document button (only for private collections) */}
                {isPrivate && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          type="button"
                          variant="ghost"
                          size={
                            deletingFileName === fileName ? "sm" : "icon-sm"
                          }
                          aria-label={toolsContent.milvus.files.remove.replace(
                            "{name}",
                            fileName,
                          )}
                          className="shrink-0 text-muted-foreground"
                          onClick={() => handleDeleteDocument(fileName)}
                          disabled={deletingFileName === fileName}
                        >
                          {deletingFileName === fileName ? (
                            <>
                              <Loader2 className="animate-spin" />
                              {sharedContent.deleting}
                            </>
                          ) : (
                            <Trash2 strokeWidth={1.75} />
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
          <div className="mt-1 flex items-center justify-between gap-2">
            <p className="text-[13px] text-muted-foreground">{countLabel}</p>

            {totalPages > 1 && (
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={toolsContent.milvus.files.previousPage}
                  disabled={page <= 1 || isLoading}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft />
                </Button>
                <span className="min-w-14 text-center text-[13px] tabular-nums text-muted-foreground">
                  {page} / {totalPages}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={toolsContent.milvus.files.nextPage}
                  disabled={page >= totalPages || isLoading}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight />
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Delete confirmation */}
        <Dialog
          open={isPrivate && isConfirmingDelete}
          onOpenChange={(open) => {
            if (!open && !isDeletingCollection) setIsConfirmingDelete(false);
          }}
        >
          <DialogContent showCloseButton={false} className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {toolsContent.milvus.collections.deleteConfirmTitle.replace(
                  "{name}",
                  collectionName,
                )}
              </DialogTitle>
              <DialogDescription>
                {toolsContent.milvus.collections.deleteConfirmDesc.replace(
                  "{count}",
                  String(total),
                )}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="secondary"
                disabled={isDeletingCollection}
                onClick={() => setIsConfirmingDelete(false)}
              >
                {sharedContent.cancel}
              </Button>
              <Button
                type="button"
                variant="destructiveSolid"
                disabled={isDeletingCollection}
                onClick={handleDeleteCollection}
              >
                {isDeletingCollection ? (
                  <>
                    <Loader2 className="animate-spin" />
                    {sharedContent.deleting}
                  </>
                ) : (
                  toolsContent.milvus.collections.delete
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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

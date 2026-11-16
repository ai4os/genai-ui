import { toolsContent } from "@/content/tools";
import { formatFileSize } from "@/features/chat/api/chat-files";
import type { MessageImage, MessageFileView } from "@/lib/types";
import { Loader2, Paperclip } from "lucide-react";
import { useState } from "react";

export function MessageImages({
  images,
}: Readonly<{ images?: MessageImage[] | null }>) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images?.length) return null;

  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2 justify-end">
        {images.map((img, i) => {
          const src = `data:${img.mime_type};base64,${img.data}`;
          return (
            <img
              key={i}
              src={src}
              className="h-40 w-40 rounded-lg border object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedImage(src)}
            />
          );
        })}
      </div>

      {/* Modal to view image */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            className="max-h-full max-w-full rounded-md object-contain shadow-2xl"
          />
        </div>
      )}
    </>
  );
}

export function MessageFiles({
  files,
}: Readonly<{ files?: MessageFileView[] | null }>) {
  if (!files?.length) return null;
  return (
    <div className="mb-2 flex flex-wrap justify-end gap-2">
      {files.map((f, i) => (
        <div
          key={`${f.filename}-${i}`}
          className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
        >
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
            {f.uploading ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : (
              <Paperclip className="size-4 text-muted-foreground" />
            )}
          </div>
          <div className="flex min-w-0 max-w-[160px] flex-col">
            <span className="truncate font-medium text-foreground">
              {f.filename}
            </span>
            <span className="text-[10px] text-muted-foreground">
              {[
                f.uploading ? toolsContent.milvus.files.uploading : null,
                f.size != null ? formatFileSize(f.size) : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
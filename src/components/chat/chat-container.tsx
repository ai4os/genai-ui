"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatsContent } from "@/content/chats";
import { cn } from "@/lib/utils";
import type { ChatImageAttachment } from "@/lib/api/types";

type ChatContainerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** If passed together with sending=true, shows the stop button instead of send. */
  onStop?: () => void;
  /** Streaming in progress: swaps the send button for the stop button (only if onStop is provided). */
  sending?: boolean;
  /** Disables the input and button without changing style (e.g. isPending in the new chat form). */
  disabled?: boolean;
  /** Connection error blocked variant */
  blocked?: boolean;
  placeholder?: string;
  /** Optional text below the composer. */
  hint?: string | null;
  /**
   * "error": red using --color-error* tokens (connection block).
   * "destructive": normal text-destructive (validation, e.g. empty message).
   */
  hintTone?: "error" | "destructive";
  /** Enables add image button */
  imagesEnabled?: boolean;
  /** Image button tooltip when it is disabled. */
  imagesDisabledReason?: string;
  images?: ChatImageAttachment[];
  onImagesChange?: (images: ChatImageAttachment[]) => void;
  maxImages?: number;
  maxTotalBytes?: number;
};

function readImageAsAttachment(file: File): Promise<ChatImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: crypto.randomUUID(),
        name: file.name,
        mimeType: file.type,
        dataUrl: reader.result as string,
        sizeBytes: file.size,
      });
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function formatMB(bytes: number) {
  return `${(bytes / 1_000_000).toFixed(0)}MB`;
}

export function ChatContainer({
  value,
  onChange,
  onSend,
  onStop,
  sending = false,
  disabled = false,
  blocked = false,
  placeholder,
  hint,
  hintTone = "destructive",
  imagesEnabled = false,
  imagesDisabledReason,
  images = [],
  onImagesChange,
  maxImages = 4,
  maxTotalBytes = 15_000_000, // 15 MB - if this variable changes, update the corresponding API variable
}: Readonly<ChatContainerProps>) {
  const isInputDisabled = disabled || blocked;
  const showStop = sending && !!onStop;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canAttach = imagesEnabled && !isInputDisabled && !!onImagesChange;
  const [imageError, setImageError] = useState<string | null>(null);

  const currentTotalBytes = images.reduce((sum, img) => sum + img.sizeBytes, 0);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || !onImagesChange) return;
    const files = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, maxImages - images.length));
    if (!files.length) return;

    const incomingBytes = files.reduce((sum, f) => sum + f.size, 0);
    if (currentTotalBytes + incomingBytes > maxTotalBytes) {
      setImageError(
        chatsContent.chat.imagesTooLarge.replace(
          "{max}",
          formatMB(maxTotalBytes),
        ),
      );
      return;
    }

    setImageError(null);
    const attachments = await Promise.all(files.map(readImageAsAttachment));
    onImagesChange([...images, ...attachments]);
  }

  function removeImage(id: string) {
    setImageError(null);
    onImagesChange?.(images.filter((img) => img.id !== id));
  }

  return (
    <div className="border-t bg-background px-4 py-3 md:px-8">
      <div className="mx-auto max-w-3xl">
        {images.length > 0 && (
          <div className="mb-2">
            <div className="flex flex-wrap gap-2">
              {images.map((img) => (
                <div key={img.id} className="group relative">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-14 w-14 rounded-md border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    title={chatsContent.chat.removeImage}
                    className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center cursor-pointer rounded-full border bg-background text-muted-foreground shadow-1 hover:text-foreground"
                  >
                    <X className="size-3" />
                  </button>
                </div>
              ))}
            </div>
            {imageError && images.length === 0 && (
              <p className="mx-auto mt-1 max-w-3xl text-[11px] text-destructive">
                {imageError}
              </p>
            )}
          </div>
        )}

        <div
          className={cn(
            "flex items-center gap-2 rounded-full border bg-background px-2 py-1.5 shadow-2",
            blocked &&
              "border-[var(--color-error-border)] bg-[var(--color-error-surface)]",
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <span
            title={
              imagesEnabled
                ? chatsContent.chat.attachImage
                : imagesDisabledReason
            }
            className="inline-block cursor-not-allowed"
          >
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={!canAttach || images.length >= maxImages}
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 rounded-full disabled:opacity-40 disabled:pointer-events-none"
            >
              <ImagePlus className="size-4" />
            </Button>
          </span>

          <Input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isInputDisabled}
            placeholder={blocked ? chatsContent.chat.blocked : placeholder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isInputDisabled) onSend();
            }}
            className="border-none shadow-none focus-visible:ring-0 disabled:text-muted-foreground"
          />
          {showStop ? (
            <Button
              variant="outline"
              size="icon"
              onClick={onStop}
              className="rounded-full"
            >
              ■
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={isInputDisabled}
              onClick={onSend}
              className="rounded-full bg-primary-600 hover:bg-primary-700 disabled:opacity-50"
            >
              ↑
            </Button>
          )}
        </div>
      </div>
      {hint && (
        <p
          className={cn(
            "mx-auto mt-2 max-w-3xl text-[11px]",
            hintTone === "error"
              ? "text-[var(--color-error)]"
              : "text-sm text-destructive",
          )}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

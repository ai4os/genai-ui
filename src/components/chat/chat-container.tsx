import { useLayoutEffect, useRef, useState } from "react";
import { ImagePlus, Paperclip, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { chatsContent } from "@/content/chats";
import { cn } from "@/lib/utils";
import { v4 as uuidv4 } from "uuid";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatFileSize } from "@/lib/chat-files";
import type { ChatImageAttachment } from "@/lib/types";

const MAX_TEXTAREA_HEIGHT = 160;

type ChatContainerProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  /** If passed together with sending=true, shows the stop button instead of send. */
  onStop?: () => void;
  sending?: boolean;
  /** Disables the input and button without changing style (e.g. isPending in the new chat form). */
  disabled?: boolean;
  /** Connection error blocked variant */
  blocked?: boolean;
  placeholder?: string;
  hint?: string | null;
  hintTone?: "error" | "destructive";
  imagesEnabled?: boolean;
  imagesDisabledReason?: string;
  filesEnabled?: boolean;
  filesDisabledReason?: string;
  images?: ChatImageAttachment[];
  onImagesChange?: (images: ChatImageAttachment[]) => void;
  maxImages?: number;
  maxTotalBytes?: number;
  files?: File[];
  onFilesChange?: (files: File[]) => void;
  maxFiles?: number;
};

function readImageAsAttachment(file: File): Promise<ChatImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({
        id: uuidv4(),
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
  filesEnabled = false,
  filesDisabledReason,
  images = [],
  onImagesChange,
  maxImages = 4,
  maxTotalBytes = 15_000_000, // 15 MB - if this variable changes, update the corresponding API variable
  files = [],
  onFilesChange,
  maxFiles = 5,
}: Readonly<ChatContainerProps>) {
  const isInputDisabled = disabled || blocked;

  const showStop = sending && !!onStop;

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const canAttachImages = imagesEnabled && !isInputDisabled && !!onImagesChange;
  const isImageDisabled = !canAttachImages || images.length >= maxImages;

  const canAttachFiles = filesEnabled && !isInputDisabled && !!onFilesChange;
  const isFileDisabled = !canAttachFiles || files.length >= maxFiles;

  const [imageError, setImageError] = useState<string | null>(null);

  const currentTotalBytes = images.reduce((sum, img) => sum + img.sizeBytes, 0);

  // Auto-grow the textarea with its content (and shrink back after sending)
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [value]);

  async function handleImageFiles(fileList: FileList | null) {
    if (!fileList || !onImagesChange) return;
    const picked = Array.from(fileList)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, maxImages - images.length));
    if (!picked.length) return;

    const incomingBytes = picked.reduce((sum, f) => sum + f.size, 0);
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
    const attachments = await Promise.all(picked.map(readImageAsAttachment));
    onImagesChange([...images, ...attachments]);
  }

  function handleGenericFiles(fileList: FileList | null) {
    if (!fileList || !onFilesChange) return;
    const incoming = Array.from(fileList).slice(
      0,
      Math.max(0, maxFiles - files.length),
    );
    if (incoming.length) onFilesChange([...files, ...incoming]);
  }

  function removeImage(id: string) {
    setImageError(null);
    onImagesChange?.(images.filter((img) => img.id !== id));
  }

  function removeGenericFile(index: number) {
    onFilesChange?.(files.filter((_, i) => i !== index));
  }

  return (
    <div className="border-t bg-background px-4 py-3 md:px-8">
      <div className="mx-auto max-w-3xl">
        {/* Attached images preview */}
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

        {/* Attached files preview */}
        {files.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {files.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 rounded-lg border bg-muted/40 px-3 py-2 text-xs"
              >
                <div className="flex size-7 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Paperclip className="size-4 text-muted-foreground" />
                </div>
                <div className="flex flex-col min-w-0 max-w-[140px]">
                  <span className="truncate font-medium text-foreground">
                    {file.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {formatFileSize(file.size)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeGenericFile(idx)}
                  className="ml-1 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          className={cn(
            "flex items-end gap-2 rounded-3xl border bg-background px-2 py-1.5 shadow-2",
            blocked &&
              "border-[var(--color-error-border)] bg-[var(--color-error-surface)]",
          )}
        >
          {/* Hidden input for images */}
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => {
              handleImageFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Hidden input for files */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            hidden
            onChange={(e) => {
              handleGenericFiles(e.target.files);
              e.target.value = "";
            }}
          />

          {/* Dropdown menu to attach files */}
          <DropdownMenu>
            <DropdownMenuTrigger
              type="button"
              disabled={isInputDisabled}
              className={cn(
                "inline-flex items-center justify-center rounded-full border border-input bg-background cursor-pointer size-9 shrink-0 shadow-sm hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <Plus className="size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start" sideOffset={15} className="w-48">
              {/* Images button */}
              {isImageDisabled ? (
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="w-full cursor-not-allowed" />}
                  >
                    <DropdownMenuItem
                      disabled={isImageDisabled}
                      onClick={() => imageInputRef.current?.click()}
                      className="w-full gap-2 cursor-pointer"
                    >
                      <ImagePlus className="size-4" />
                      <span>{chatsContent.chat.attachImage}</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>{imagesDisabledReason}</TooltipContent>
                </Tooltip>
              ) : (
                <DropdownMenuItem
                  disabled={isImageDisabled}
                  onClick={() => imageInputRef.current?.click()}
                  className="w-full gap-2 cursor-pointer"
                >
                  <ImagePlus className="size-4" />
                  <span>{chatsContent.chat.attachImage}</span>
                </DropdownMenuItem>
              )}

              {/* Files button */}
              {isFileDisabled ? (
                <Tooltip>
                  <TooltipTrigger
                    render={<span className="w-full cursor-not-allowed" />}
                  >
                    <DropdownMenuItem
                      disabled={isFileDisabled}
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full gap-2 cursor-pointer"
                    >
                      <Paperclip className="size-4" />
                      <span>Add file</span>
                    </DropdownMenuItem>
                  </TooltipTrigger>
                  <TooltipContent>{filesDisabledReason}</TooltipContent>
                </Tooltip>
              ) : (
                <DropdownMenuItem
                  disabled={isFileDisabled}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full gap-2 cursor-pointer"
                >
                  <Paperclip className="size-4" />
                  <span>Add file</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <textarea
            ref={textareaRef}
            rows={1}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={isInputDisabled}
            placeholder={blocked ? chatsContent.chat.blocked : placeholder}
            onKeyDown={(e) => {
              // Enter sends; Shift+Enter falls through and inserts a line break.
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !e.nativeEvent.isComposing
              ) {
                e.preventDefault();
                if (!isInputDisabled) onSend();
              }
            }}
            className="min-h-9 flex-1 resize-none bg-transparent px-3 py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
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

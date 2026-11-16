import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogFooter,
  Dialog,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toolsContent } from "@/content/tools";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sharedContent } from "@/content/shared";

export interface CreateCollectionData {
  name: string;
  description?: string;
}

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: CreateCollectionData) => void | Promise<void>;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onCreate,
}: Readonly<CreateCollectionDialogProps>) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName("");
    setDescription("");
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (isSubmitting) return;
    onOpenChange(nextOpen);
    if (!nextOpen) resetForm();
  };

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();

    const trimmedName = name.trim();
    setError(null);
    setIsSubmitting(true);
    try {
      await onCreate({
        name: trimmedName,
        description: description.trim() || undefined,
      });
      toast.success(toolsContent.milvus.toasts.createCollectionSuccess);
      handleOpenChange(false);
    } catch {
      toast.error(toolsContent.milvus.toasts.createCollectionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{toolsContent.milvus.collections.create}</DialogTitle>
            <DialogDescription>
              {toolsContent.milvus.collections.createDesc}{" "}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="collection-name">{toolsContent.milvus.name}</Label>
              <Input
                id="collection-name"
                autoFocus
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={toolsContent.milvus.namePlaceholder}
                disabled={isSubmitting}
                maxLength={70}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="collection-description">
                {toolsContent.milvus.desc}{" "}
                <span className="font-normal text-muted-foreground">
                  ({toolsContent.milvus.optional})
                </span>
              </Label>
              <Textarea
                id="collection-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={toolsContent.milvus.descPlaceholder}
                rows={3}
                disabled={isSubmitting}
                maxLength={256}
              />
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
          </div>

          <DialogFooter className="mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              {sharedContent.cancel}
            </Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  {toolsContent.creating}
                </>
              ) : (
                toolsContent.milvus.collections.create
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

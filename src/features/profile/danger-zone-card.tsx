import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { profileContent } from "@/content/profile";
import { useDeleteAllChats } from "./api/queries";
import { sharedContent } from "@/content/shared";

const c = profileContent.danger.deleteAll;

export function DangerZoneCard() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const deleteAll = useDeleteAllChats();

  async function handleConfirm() {
    try {
      await deleteAll.mutateAsync();
      setOpen(false);
      navigate("/chat");
    } catch {
      // The mutation query owns the error toast.
    }
  }

  return (
    <>
      <div className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">{c.title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{c.description}</p>
        </div>
        <Button
          variant="secondary"
          className="shrink-0 rounded-full border-destructive/40 text-destructive hover:bg-destructive/10"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="size-4" />
          {c.button}
        </Button>
      </div>

      <Dialog
        open={open}
        onOpenChange={(o) => !deleteAll.isPending && setOpen(o)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{c.confirmTitle}</DialogTitle>
            <DialogDescription>{c.confirmDescription}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="secondary"
              disabled={deleteAll.isPending}
              onClick={() => setOpen(false)}
            >
              {c.cancel}
            </Button>
            <Button
              variant="destructiveSolid"
              disabled={deleteAll.isPending}
              onClick={handleConfirm}
            >
               {deleteAll.isPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  {sharedContent.deleting}
                </>
              ) : (
                c.confirm
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

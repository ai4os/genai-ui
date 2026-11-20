import { useCallback } from "react";
import { toast } from "sonner";

import { sharedContent } from "@/content/shared";

export function useCopyToClipboard() {
  return useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(sharedContent.copied);
      return true;
    } catch {
      toast.error(sharedContent.copyError);
      return false;
    }
  }, []);
}
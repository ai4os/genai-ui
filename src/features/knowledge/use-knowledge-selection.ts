import { createContext, useContext } from "react";

export type KnowledgeSelectionContextValue = {
  selectedIds: Set<string>;
  toggle: (id: string) => void;
  toggleAll: (ids: string[]) => void;
  clearSelection: () => void;
  milvusDisabled: boolean;
  setMilvusDisabled: (disabled: boolean) => void;
};

export const KnowledgeSelectionContext =
  createContext<KnowledgeSelectionContextValue | null>(null);

export function useKnowledgeSelection() {
  const context = useContext(KnowledgeSelectionContext);
  if (!context) {
    throw new Error("useKnowledgeSelection must be used within provider");
  }
  return context;
}
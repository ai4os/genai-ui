import { useState, type ReactNode } from "react";
import { KnowledgeSelectionContext } from "./knowledge-selection";

export function KnowledgeSelectionProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [milvusDisabled, setMilvusDisabled] = useState(false);

  function toggle(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll(ids: string[]) {
    setSelectedIds((prev) =>
      ids.every((id) => prev.has(id)) ? new Set() : new Set(ids),
    );
  }

  return (
    <KnowledgeSelectionContext.Provider
      value={{ selectedIds, toggle, toggleAll, milvusDisabled, setMilvusDisabled }}
    >
      {children}
    </KnowledgeSelectionContext.Provider>
  );
}
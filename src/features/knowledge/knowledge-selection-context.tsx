import { useCallback, useState, type ReactNode } from "react";
import { KnowledgeSelectionContext } from "./use-knowledge-selection";

export function KnowledgeSelectionProvider({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
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

  function removeSelectedId(id: string) {
    setSelectedIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  return (
    <KnowledgeSelectionContext.Provider
      value={{
        selectedIds,
        toggle,
        toggleAll,
        removeSelectedId,
        clearSelection,
        milvusDisabled,
        setMilvusDisabled,
      }}
    >
      {children}
    </KnowledgeSelectionContext.Provider>
  );
}

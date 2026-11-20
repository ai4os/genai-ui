export const toolsContent = {
  title: "Tools and connections",
  creating: "Creating",
  milvus: {
    title: "Knowledge sources",
    selectAll: "Select all",
    unselectAll: "Deselect all",
    clear: "Clear",
    selectedCount: "{count} selected",
    viewDetails: "View details of {name}",
    name: "Name",
    namePlaceholder: "E.g.: project documentation",
    desc: "Description",
    descPlaceholder: "What sort of content will this collection contain?",
    optional: "Optional",
    unsupportedByModel:
      "Some models and agents do not support the usage of knowledge sources.",
    collections: {
      public: "Public collections",
      private: "Private collections",
      create: "Create collection",
      new: "New collection",
      createDesc: "Add a new collection to organise your knowledge.",
      delete: "Delete collection",
      deleteConfirmTitle: "Delete “{name}”?",
      deleteConfirmDesc:
        "This permanently removes the collection and its {count} document(s). This can’t be undone.",
      options: "Collection options",
      publicReadOnly: "Public collection · read only",
      empty: "This collection is empty",
    },
    files: {
      numberOfDocs: " in this collection",
      upload: "Upload file",
      previousPage: "Previous page",
      nextPage: "Next page",
      loading: "Loading files",
      uploading: "Uploading",
      deleteConfirmTitle: "Delete “{name}”?",
      deleteConfirmDesc:
        "This permanently removes the file from the collection. This can’t be undone.",
    },
  },
} as const;

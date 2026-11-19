export const toolsContent = {
  title: "Tools and connections",
  creating: "Creating",
  milvus: {
    title: "Knowledge bases",
    selectAll: "Select all",
    unselectAll: "Deselect all",
    name: "Name",
    namePlaceholder: "E.g.: project documentation",
    desc: "Description",
    descPlaceholder: "What sort of content will this collection contain?",
    optional: "Optional",
    unsupportedByModel:
      "The selected model does not support tools, so it cannot use knowledge bases.",
    collections: {
      public: "Public collections",
      private: "Private collections",
      create: "Create collection",
      createDesc: "Add a new collection to organise your knowledge.",
      delete: "Delete collection",
      empty: "This collection is empty",
    },
    files: {
      numberOfDocs: " in this collection",
      upload: "Upload file",
      loading: "Loading files",
      uploading: "Uploading",
    },
  },
} as const;

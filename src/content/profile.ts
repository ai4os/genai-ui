export const profileContent = {
  title: "Profile",
  userId: "User ID",
  logout: "Log out",
  backToChat: "Back to chat",
  nav: {
    credits: "Credit usage",
    danger: "Danger zone",
  },
  credits: {
    title: "Credit usage",
    subtitle: "Credits used today. Your budget resets every day.",
    of: "of",
    usedPercent: "used",
    remaining: "remaining",
    unlimited: "No limit",
    resetsOn: "Resets on",
    loadError: "Could not load your credit usage.",
  },
  danger: {
    title: "Danger zone",
    subtitle: "Actions here can't be undone.",
    deleteAll: {
      title: "Delete all chats",
      description:
        "Permanently removes every conversation and its messages from your account.",
      button: "Delete all chats",
      confirmTitle: "Delete all chats?",
      confirmDescription:
        "Every conversation, message and attached file will be permanently deleted. This can't be undone.",
      cancel: "Cancel",
      confirm: "Yes, delete everything",
      success: "All chats deleted",
    },
  },
} as const;

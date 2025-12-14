import { Middleware } from "@reduxjs/toolkit";

export const persistChatMiddleware: Middleware = (store) => (next) => (action) => {
  const result = next(action);

  // Only persist when chat slice changes
  if (action.type.startsWith("chat/")) {
    const state = store.getState();
    try {
      localStorage.setItem("chatState", JSON.stringify(state.chat));
    } catch (err) {
      console.error("⚠️ Failed to save chat state:", err);
    }
  }

  return result;
};

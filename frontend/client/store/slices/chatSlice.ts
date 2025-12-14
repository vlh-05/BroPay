import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ChatMessage {
  id?: string;
  sender: string;
  receiver: string;
  message: string;
  content?: string;
  timestamp?: string;
  delivered?: boolean;
  seen?: boolean;
}

interface ChatState {
  conversations: { [key: string]: ChatMessage[] };
  activeConversation: string | null;
  isLoading: boolean;
  error: string | null;
  newMessages: { [key: string]: number };
}

const loadPersistedChatState = (): ChatState => {
  try {
    const saved = localStorage.getItem("chatState");
    if (saved) return JSON.parse(saved);
  } catch {}
  return {
    conversations: {},
    activeConversation: null,
    isLoading: false,
    error: null,
    newMessages: {},
  };
};

const initialState: ChatState = loadPersistedChatState();

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage: (state, action) => {
      let { key, message } = action.payload;

      // Normalize backend → Redux shape
      message = {
        ...message,
        message: message.message || message.content || "",
      };

      if (!state.conversations[key]) {
        state.conversations[key] = [];
      }

      const exists = state.conversations[key].some(
        (m) =>
          m.timestamp === message.timestamp &&
          m.message === message.message &&
          m.sender === message.sender
      );

      if (!exists) {
        state.conversations[key].push(message);
      }

      localStorage.setItem("chatState", JSON.stringify(state));
    },

    setConversation: (
      state,
      action: PayloadAction<{ key: string; messages: ChatMessage[] }>
    ) => {
      const { key, messages } = action.payload;
      const existing = state.conversations[key] || [];

      const incoming = (messages || []).map((msg) => ({
        ...msg,
        message: msg.message || msg.content || "",
      }));

      const merged = [...existing];

      incoming.forEach((msg) => {
        const duplicate = merged.some(
          (m) =>
            m.sender === msg.sender &&
            m.receiver === msg.receiver &&
            m.message === msg.message &&
            m.timestamp === msg.timestamp
        );

        if (!duplicate) merged.push(msg);
      });

      state.conversations[key] = merged;
      localStorage.setItem("chatState", JSON.stringify(state));
    },

    setActiveConversation: (state, action: PayloadAction<string>) => {
      state.activeConversation = action.payload;
      state.newMessages[action.payload] = 0;
    },

    addNewMessageCount: (state, action: PayloadAction<string>) => {
      const key = action.payload;
      state.newMessages[key] = (state.newMessages[key] || 0) + 1;
    },

    clearConversations: (state) => {
      state.conversations = {};
      state.activeConversation = null;
      state.newMessages = {};
      localStorage.setItem("chatState", JSON.stringify(state));
    },
  },
});

export const {
  addMessage,
  setConversation,
  setActiveConversation,
  addNewMessageCount,
  clearConversations,
} = chatSlice.actions;

export default chatSlice.reducer;

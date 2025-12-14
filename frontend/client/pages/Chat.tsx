import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch, store } from "@/store";
import Navigation from "@/components/Navigation";
import { chatAPI, friendAPI } from "@/services/api";
import { formatChatTimestamp } from "@/lib/utils";

import {
  addMessage,
  setConversation,
  setActiveConversation,
  ChatMessage, // <-- import here
} from "@/store/slices/chatSlice";

import { getSocket, sendChatMessage } from "@/services/websocket";

import "./Chat.css";

const Chat: React.FC = () => {
  const { user } = useAuth();
  const dispatch = useDispatch<AppDispatch>();

  const { conversations, activeConversation } = useSelector(
    (state: RootState) => state.chat
  );

  const [friends, setFriends] = useState<any[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [messageText, setMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll
  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation, conversations]);

  // Load friends
  useEffect(() => {
    if (!user) return;
    friendAPI
      .getFriends(user.email)
      .then((res) => setFriends(res.data))
      .catch(() => console.log("❌ Friends fetch error"));
  }, [user]);

  // Load conversation from backend
  const handleLoadConversation = async (other: string) => {
    if (!user) return;

    const key = [user.email, other].sort().join(":");

    try {
      const res = await chatAPI.getConversation(user.email, other);

      dispatch(setConversation({ key, messages: res.data || [] }));
      dispatch(setActiveConversation(key));

      setSelectedUser(other);

      getSocket()?.emit("message:seen", {
        viewer: user.email,
        otherUser: other,
      });

      setSearchEmail("");
    } catch (err) {
      console.error("Chat load error", err);
    }
  };

  const handleStartNewChat = (email: string) => {
    if (!email || !user || email === user.email) return;
    handleLoadConversation(email);
  };

  // Send message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!user || !selectedUser || !messageText.trim()) return;

    sendChatMessage({
      sender: user.email,
      receiver: selectedUser,
      content: messageText,
    });

    setMessageText("");
  };

  // Detect current conversation
  const currentMessages =
    activeConversation && conversations[activeConversation]
      ? conversations[activeConversation]
      : [];

  const visibleMessages = currentMessages.filter(
    (m: ChatMessage) => (m.content || m.message || "").trim() !== ""
  );

  // Determine message state
  const getState = (msg: ChatMessage) => {
    if (msg.seen) return "seen";
    if (msg.delivered) return "delivered";
    return "pending";
  };

  // *** UPDATED: simplified status text with ONE tick ***
  const renderStatus = (msg: ChatMessage) => {
    if (msg.seen) return "✓ Seen";
    if (msg.delivered) return "✓ Delivered";
    return "✓ Sent";
  };

  // ===============================
  //  SOCKET EVENTS FOR REAL TIME
  // ===============================
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !user) return;

    console.log("🔗 Chat socket listeners set (single instance)");

    const handleReceived = (msg: ChatMessage) => {
      const key = [msg.sender, msg.receiver].sort().join(":");
      dispatch(addMessage({ key, message: msg }));

      if (selectedUser === msg.sender) {
        socket.emit("message:seen", {
          viewer: user.email,
          otherUser: msg.sender,
        });
      }
    };

    const handleSent = (msg: ChatMessage) => {
      const key = [msg.sender, msg.receiver].sort().join(":");
      dispatch(addMessage({ key, message: msg }));
    };

    const handleOffline = (list: ChatMessage[]) => {
      list.forEach((msg) => {
        const key = [msg.sender, msg.receiver].sort().join(":");
        dispatch(addMessage({ key, message: msg }));
      });
      scrollToBottom();
    };

    const handleSeenUpdate = (payload: any) => {
      const key = [payload.viewer, payload.otherUser].sort().join(":");

      const updated = (store.getState().chat.conversations[key] || []).map(
        (m: ChatMessage) => {
          if (m.sender === payload.otherUser) return { ...m, seen: true };
          return m;
        }
      );

      dispatch(setConversation({ key, messages: updated }));
    };

    socket.on("message:received", handleReceived);
    socket.on("message:sent", handleSent);
    socket.on("offline:messages", handleOffline);
    socket.on("message:seen:update", handleSeenUpdate);

    return () => {
      socket.off("message:received", handleReceived);
      socket.off("message:sent", handleSent);
      socket.off("offline:messages", handleOffline);
      socket.off("message:seen:update", handleSeenUpdate);
    };
  }, [user.email, selectedUser]);

  // UI ===================================================================

  return (
    <>
      <Navigation />

      <div className="chat-container">
        <div className="chat-wrapper">
          {/* SIDEBAR ===================================================== */}
          <div className="chat-sidebar">
            <div className="chat-header">
              <h2>Messages</h2>
            </div>

            {/* Search */}
            <div style={{ padding: "10px" }}>
              <input
                type="email"
                placeholder="Search…"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                className="search-input"
              />
              {searchEmail &&
                friends
                  .filter((f) => f.email.includes(searchEmail))
                  .map((f) => (
                    <div
                      key={f.email}
                      onClick={() => handleStartNewChat(f.email)}
                      style={{
                        padding: "8px",
                        background: "#f0f0f0",
                        marginTop: "5px",
                        cursor: "pointer",
                      }}
                    >
                      {f.name} ({f.email})
                    </div>
                  ))}
            </div>

            {/* Conversations */}
            <div className="conversations-list">
              {Object.keys(conversations).map((key) => {
                const [u1, u2] = key.split(":");
                const other = user?.email === u1 ? u2 : u1;

                return (
                  <button
                    key={key}
                    className={`conversation-item ${
                      activeConversation === key ? "active" : ""
                    }`}
                    onClick={() => handleLoadConversation(other)}
                  >
                    <div className="conversation-name">{other}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* MAIN CHAT PANEL ============================================== */}
          <div className="chat-main">
            {selectedUser ? (
              <>
                <div className="chat-header">
                  <h2>{selectedUser}</h2>
                </div>

                <div className="messages-container">
                  {visibleMessages.map((msg, idx) => {
                    const isMe = user?.email === msg.sender;
                    const state = isMe ? getState(msg) : undefined;

                    return (
                      <div
                        key={idx}
                        className={`message ${isMe ? "sent" : "received"}`}
                      >
                        {/* UPDATED: Removed bubble state classes */}
                        <div className="message-content">
                          {msg.content || msg.message}
                        </div>

                        {/* TIME + STATUS */}
                        <div className="message-meta">
                          <span className="message-time">
                            {formatChatTimestamp(msg.timestamp)}
                          </span>

                          {isMe && (
                            <span className={`message-status status-${state}`}>
                              {renderStatus(msg)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}

                  <div ref={messagesEndRef} />
                </div>

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    className="message-input"
                    placeholder="Type message…"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                  />
                  <button className="btn btn-primary" disabled={!messageText}>
                    Send
                  </button>
                </form>
              </>
            ) : (
              <div className="no-chat-selected">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Chat;

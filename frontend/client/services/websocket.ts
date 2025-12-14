import io from "socket.io-client";
import type { Socket } from "socket.io-client";

export let socketInstance: Socket | null = null;

const SOCKET_URL = "http://localhost:9092";

/* ------------------------------------------------------------------
 * 🔌 CONNECT SOCKET.IO
 * ------------------------------------------------------------------ */
export const connectSocket = (token: string, userEmail: string): Promise<Socket> => {
  return new Promise((resolve, reject) => {
    if (socketInstance?.connected) {
      console.log("⚡ Reusing existing socket for:", userEmail);
      resolve(socketInstance);
      return;
    }

    console.log("🔌 Creating NEW socket connection...");

    socketInstance = io(SOCKET_URL, {
      query: { token, email: userEmail },
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      forceNew: true,
    });

    socketInstance.on("connect", () => {
      console.log("🟢 Socket connected:", socketInstance?.id);
      (window as any).socket = socketInstance;
      resolve(socketInstance!);
    });

    socketInstance.on("connect_error", (err) => {
      console.error("❌ Socket connect error:", err.message);
      reject(err);
    });

    socketInstance.on("disconnect", () => {
      console.warn("⚠️ Socket disconnected");
    });
  });
};

/* ------------------------------------------------------------------
 * 🔌 DISCONNECT
 * ------------------------------------------------------------------ */
export const disconnectSocket = () => {
  if (socketInstance?.connected) {
    console.log("🔌 Disconnecting socket...");
    socketInstance.disconnect();
    socketInstance = null;
  }
};

/* ------------------------------------------------------------------
 * 🔄 GET SOCKET INSTANCE
 * ------------------------------------------------------------------ */
export const getSocket = (): Socket | null => socketInstance;

/* ------------------------------------------------------------------
 * 💬 CHAT EVENTS
 * ------------------------------------------------------------------ */
export const onMessageReceived = (callback: (data: any) => void) => {
  socketInstance?.on("message:received", (msg) => {
    console.log("📩 [FE] Message received:", msg);
    callback(msg);
  });
};

export const sendChatMessage = (data: {
  sender: string;
  receiver: string;
  content: string;
}) => {
  if (!socketInstance?.connected) {
    console.warn("⚠️ Cannot send message — socket not connected");
    return;
  }
  console.log("📤 [FE] Sending message:", data);
  socketInstance.emit("chat:send", data);
};

/* ------------------------------------------------------------------
 * 🔔 NOTIFICATION EVENTS
 * ------------------------------------------------------------------ */
export const onNotificationReceived = (callback: (data: any) => void) => {
  socketInstance?.on("notification:received", callback);
};

export const onFriendRequestReceived = (callback: (data: any) => void) => {
  socketInstance?.on("friendRequest:received", callback);
};

export const onPaymentNotification = (callback: (data: any) => void) => {
  socketInstance?.on("payment:notification", callback);
};

/* ------------------------------------------------------------------
 * 👥 USER STATUS
 * ------------------------------------------------------------------ */
export const onUserOnline = (callback: (data: any) => void) => {
  socketInstance?.on("user:online", callback);
};

export const onUserOffline = (callback: (data: any) => void) => {
  socketInstance?.on("user:offline", callback);
};

export const emitUserStatus = (data: { email: string; status: "online" | "offline" }) => {
  if (!socketInstance?.connected) return;
  socketInstance.emit("user:status", data);
};

/* ------------------------------------------------------------------
 * 🧹 CLEANUP
 * ------------------------------------------------------------------ */
export const removeListener = (event: string) => {
  socketInstance?.off(event);
  console.log(`🧹 Removed listener: ${event}`);
};

export const removeAllListeners = () => {
  socketInstance?.removeAllListeners();
  console.log("🧹 Removed ALL listeners");
};

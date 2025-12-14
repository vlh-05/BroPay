import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "@/store";

import {
  connectSocket,
  disconnectSocket,
  socketInstance,
  removeAllListeners,
} from "@/services/websocket";

import { addMessage } from "@/store/slices/chatSlice";
import { addNotification } from "@/store/slices/notificationSlice";
import { addReceivedRequest } from "@/store/slices/friendSlice";

/**
 * WebSocket Hook
 * Ensures:
 *  - Single socket instance
 *  - Listeners attach ONLY once
 *  - No duplicate messages
 *  - Fetch offline messages only once
 */
export const useWebSocket = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((state: RootState) => state.auth);

  const listenersAttached = useRef(false);
  const offlineFetched = useRef(false);

  useEffect(() => {
    // 🔴 If logout: clear everything + disconnect
    if (!token || !user) {
      console.log("❌ No auth → clearing socket + listeners");
      removeAllListeners();
      listenersAttached.current = false;
      offlineFetched.current = false;
      disconnectSocket();
      return;
    }

    let cancelled = false;

    const setup = async () => {
      // 1️⃣ Create or reuse socket connection
      try {
        if (!socketInstance || !socketInstance.connected) {
          console.log("🌐 Connecting socket for", user.email);
          await connectSocket(token, user.email);
        } else {
          console.log("⚠️ Reusing existing socket instance");
        }
      } catch (err) {
        console.error("❌ Failed to connect socket:", err);
        return;
      }

      if (cancelled || !socketInstance) return;

      // 2️⃣ Fetch offline messages ONCE per login session
      if (!offlineFetched.current) {
        offlineFetched.current = true;

        try {
          const res = await fetch(
            `http://localhost:8080/api/chat/offline/${user.email}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          ).then((r) => r.json());

          const offlineList = Array.isArray(res)
            ? res
            : Array.isArray(res?.messages)
            ? res.messages
            : [];

          if (offlineList.length) {
            console.log("📥 Restored offline messages:", offlineList.length);

            offlineList.forEach((msg: any) => {
              const key = [msg.sender, msg.receiver].sort().join(":");

              dispatch(
                addMessage({
                  key,
                  message: {
                    sender: msg.sender,
                    receiver: msg.receiver,
                    message: msg.message || msg.content || "",
                    timestamp: msg.timestamp,
                    delivered: msg.delivered,
                    seen: msg.seen,
                  },
                })
              );
            });
          }
        } catch (err) {
          console.error("❌ Failed to fetch offline messages:", err);
        }
      }

      if (cancelled || !socketInstance) return;

      // 3️⃣ Attach all listeners ONCE
      if (!listenersAttached.current) {
        listenersAttached.current = true;
        console.log("🔗 WebSocket listeners attached (once)");

        /** ===========================================
         *  MESSAGE SENT (sender receives confirmation)
         * =========================================== */
        socketInstance.on("message:sent", (data: any) => {
          const key = [data.sender, data.receiver].sort().join(":");

          dispatch(
            addMessage({
              key,
              message: {
                sender: data.sender,
                receiver: data.receiver,
                message: data.message || data.content || "",
                timestamp: data.timestamp,
                delivered: data.delivered,
                seen: data.seen,
              },
            })
          );
        });

        /** ===========================================
         *  MESSAGE RECEIVED (incoming real-time message)
         * =========================================== */
        socketInstance.on("message:received", (data: any) => {
          const key = [data.sender, data.receiver].sort().join(":");

          dispatch(
            addMessage({
              key,
              message: {
                sender: data.sender,
                receiver: data.receiver,
                message: data.message || data.content || "",
                timestamp: data.timestamp,
                delivered: data.delivered,
                seen: data.seen,
              },
            })
          );
        });

        /** ===========================================
         *         FRIEND REQUEST EVENTS
         * =========================================== */
        socketInstance.on("friendRequest:received", (data: any) => {
          dispatch(
            addReceivedRequest({
              senderEmail: data.senderEmail,
              receiverEmail: data.receiverEmail,
              status: "pending",
              timestamp: data.timestamp,
            })
          );

          dispatch(
            addNotification({
              id: `fr-${Date.now()}`,
              type: "friend_request",
              title: "Friend Request",
              message: `${data.senderName} sent you a friend request`,
              read: false,
              timestamp: new Date().toISOString(),
              data,
            })
          );
        });

        /** ===========================================
         *              GENERAL NOTIFICATIONS
         * =========================================== */
        socketInstance.on("notification:received", (data: any) => {
          dispatch(
            addNotification({
              id: `notif-${Date.now()}`,
              type: data.type || "system",
              title: data.title,
              message: data.message,
              read: false,
              timestamp: new Date().toISOString(),
              data,
            })
          );
        });

        /** ===========================================
         *              PAYMENT NOTIFICATIONS
         * =========================================== */
        socketInstance.on("payment:notification", (data: any) => {
          dispatch(
            addNotification({
              id: `pay-${Date.now()}`,
              type: "payment",
              title: "Payment Notification",
              message: data.message || `${data.payer} sent you ₹${data.amount}`,
              read: false,
              timestamp: new Date().toISOString(),
              data,
            })
          );
        });

        /** ===========================================
         *          ONLINE / OFFLINE STATUS
         * =========================================== */
        socketInstance.on("user:online", (data: any) =>
          console.log("🟢 ONLINE:", data.email)
        );

        socketInstance.on("user:offline", (data: any) =>
          console.log("🔴 OFFLINE:", data.email)
        );
      }
    };

    setup();

    return () => {
      cancelled = true;
      console.log("🧹 useWebSocket cleanup (marks cancelled only)");
    };
  }, [token, user, dispatch]);

  return socketInstance;
};

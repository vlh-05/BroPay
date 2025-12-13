package com.bropay.broPayApi.websocket;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import com.bropay.broPayApi.model.ChatMessage;
import com.bropay.broPayApi.service.ChatService;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;

@Component
public class ChatSocketHandler {

    private final ChatService chatService;
    private SocketIOServer server;

    @Autowired
    public ChatSocketHandler(ChatService chatService) {
        this.chatService = chatService;
    }

    // setter injection to avoid circular dependency
    public void setServer(SocketIOServer server) {
        this.server = server;
    }

    // OnConnect, OnDisconnect, OnEvent methods stay the same

    @OnConnect
    public void onConnect(SocketIOClient client) {
        String email = client.getHandshakeData().getSingleUrlParam("email");
        client.set("email", email);
        client.joinRoom(email);

        System.out.println("🟢 Connected: " + email + " | session=" + client.getSessionId());

        // send offline messages to this user
        List<ChatMessage> offline = chatService.getOfflineMessages(email);
        if (!offline.isEmpty()) {
            System.out.println("📤 Delivering " + offline.size() + " offline messages to: " + email);

            offline.forEach(m -> m.setDelivered(true));

            client.sendEvent("offline:messages", offline);

            chatService.markOfflineMessagesDelivered(email);
        }
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        System.out.println("🔴 Disconnected: " + client.get("email"));
    }

    @OnEvent("chat:send")
    public void onChat(SocketIOClient client, ChatMessage message) {

        System.out.println("💬 Incoming message: " +
                message.getSender() + " → " + message.getReceiver() +
                " | " + message.getContent());

        message.setTimestamp(LocalDateTime.now());
        message.setSeen(false);

        boolean receiverOnline = false;

        for (SocketIOClient c : server.getAllClients()) {
            String email = c.get("email");
            if (email != null && email.equals(message.getReceiver())) {
                receiverOnline = true;
                break;
            }
        }

        message.setDelivered(receiverOnline);

        ChatMessage saved = chatService.saveMessage(message);

        // send back to sender for local echo
        client.sendEvent("message:sent", saved);

        // if receiver online, send to that room
        if (receiverOnline) {
            server.getRoomOperations(saved.getReceiver())
                    .sendEvent("message:received", saved);
            System.out.println("🟢 Marked as delivered");
        } else {
            System.out.println("🔴 Stored as offline message");
        }

        System.out.println("💾 Message saved (delivered=" + saved.isDelivered() + ")");
    }

    // viewer opens chat screen with other user
    @OnEvent("message:seen")
    public void onMessagesSeen(SocketIOClient client, SeenPayload payload) {
        if (payload == null) return;

        chatService.markMessagesSeen(payload.getViewer(), payload.getOtherUser());

        System.out.println("👁️ Messages marked as seen: "
                + payload.getOtherUser() + " → " + payload.getViewer());

        // notify both sides to update UI
        server.getAllClients().forEach(c -> {
            String email = c.get("email");
            if (email == null) return;

            if (email.equals(payload.getViewer()) || email.equals(payload.getOtherUser())) {
                c.sendEvent("message:seen:update", payload);
            }
        });
    }

    // simple inner class for seen event payload
    public static class SeenPayload {
        private String viewer;
        private String otherUser;

        public String getViewer() {
            return viewer;
        }

        public void setViewer(String viewer) {
            this.viewer = viewer;
        }

        public String getOtherUser() {
            return otherUser;
        }

        public void setOtherUser(String otherUser) {
            this.otherUser = otherUser;
        }
    }
}

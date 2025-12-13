package com.bropay.broPayApi.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bropay.broPayApi.model.ChatMessage;
import com.bropay.broPayApi.service.ChatService;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "*")
public class ChatController {

    @Autowired
    private ChatService chatService;

    @PostMapping("/send")
    public ChatMessage sendMessage(@RequestBody ChatMessage msg) {
        if (msg.getTimestamp() == null) {
            msg.setTimestamp(LocalDateTime.now());
        }
        return chatService.saveMessage(msg);
    }

    @GetMapping("/history")
    public List<ChatMessage> getRecentMessages() {
        return chatService.getRecentMessages();
    }

    @GetMapping("/conversation/{user1}/{user2}")
    public List<ChatMessage> getConversation(
            @PathVariable String user1,
            @PathVariable String user2) {
        return chatService.getConversationBetween(user1, user2);
    }

    @GetMapping("/offline/{email}")
    public List<ChatMessage> getOfflineMessages(@PathVariable String email) {
        return chatService.getOfflineMessages(email);
    }
}

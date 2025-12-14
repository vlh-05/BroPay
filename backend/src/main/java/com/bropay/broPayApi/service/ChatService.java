package com.bropay.broPayApi.service;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.model.ChatMessage;
import com.bropay.broPayApi.repository.ChatMessageRepository;

@Service
public class ChatService {

    private final ChatMessageRepository repository;
    private final MongoTemplate mongoTemplate;

    @Autowired
    public ChatService(ChatMessageRepository repository, MongoTemplate mongoTemplate) {
        this.repository = repository;
        this.mongoTemplate = mongoTemplate;
    }

    public ChatMessage saveMessage(ChatMessage msg) {
        return repository.save(msg);
    }

    public List<ChatMessage> getRecentMessages() {
        return repository.findTop50ByOrderByTimestampDesc();
    }

    public List<ChatMessage> getConversationBetween(String user1, String user2) {
        return repository.findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
                user1, user2, user2, user1);
    }

    public List<ChatMessage> getOfflineMessages(String email) {
        return repository.findByReceiverAndDeliveredFalseOrderByTimestampAsc(email);
    }

    public void markOfflineMessagesDelivered(String receiver) {
        Query query = new Query(
                Criteria.where("receiver").is(receiver)
                        .and("delivered").is(false));
        Update update = new Update().set("delivered", true);
        mongoTemplate.updateMulti(query, update, ChatMessage.class);
    }

    public void markMessagesSeen(String viewer, String otherUser) {
        // viewer opened chat with otherUser, so all messages that
        // were sent to viewer by otherUser become seen
        Query query = new Query(
                Criteria.where("sender").is(otherUser)
                        .and("receiver").is(viewer)
                        .and("seen").is(false));
        Update update = new Update().set("seen", true);
        mongoTemplate.updateMulti(query, update, ChatMessage.class);
    }
}

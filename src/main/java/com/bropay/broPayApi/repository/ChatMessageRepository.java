package com.bropay.broPayApi.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bropay.broPayApi.model.ChatMessage;

public interface ChatMessageRepository extends MongoRepository<ChatMessage, String> {

    List<ChatMessage> findTop50ByOrderByTimestampDesc();

    List<ChatMessage> findBySenderAndReceiverOrReceiverAndSenderOrderByTimestampAsc(
            String sender1,
            String receiver1,
            String sender2,
            String receiver2
    );

    List<ChatMessage> findByReceiverAndDeliveredFalseOrderByTimestampAsc(String receiver);
}

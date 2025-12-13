package com.bropay.broPayApi.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bropay.broPayApi.model.RecurringEntry;

public interface RecurringEntryRepository extends MongoRepository<RecurringEntry, String> {

    // Outgoing for a user (user is payer)
    List<RecurringEntry> findByPayerEmailOrderByCreatedAtDesc(String payerEmail);

    // Incoming for a user (user is receiver)
    List<RecurringEntry> findByReceiverEmailOrderByCreatedAtDesc(String receiverEmail);

    // For scheduler
    List<RecurringEntry> findByActiveTrue();

    List<RecurringEntry> findByStatus(String status);
}

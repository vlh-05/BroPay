package com.bropay.broPayApi.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.bropay.broPayApi.model.ExpenseSplit;

public interface ExpenseSplitRepository extends MongoRepository<ExpenseSplit, String> {

    List<ExpenseSplit> findByInitiatorEmail(String initiatorEmail);

    // ✅ Explicit query to map participantShares.email correctly
    @Query("{ 'participantShares.email': ?0 }")
    List<ExpenseSplit> findByParticipantsEmail(String participantEmail);

    @Query("{ '$or': [ { 'initiatorEmail': ?0 }, { 'participantShares.email': ?0 } ] }")
    List<ExpenseSplit> findCanonicalForUser(String email);

    List<ExpenseSplit> findByInitiatorEmailOrParticipantSharesEmail(String initiatorEmail, String participantEmail);
}

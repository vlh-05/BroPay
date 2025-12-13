package com.bropay.broPayApi.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.mongodb.repository.Query;

import com.bropay.broPayApi.model.LineItem;

public interface LineItemRepository extends MongoRepository<LineItem, String> {

    @Query("{ 'splitDetails.participantId': ?0 }")
    List<LineItem> findByParticipantId(String participantId);
}

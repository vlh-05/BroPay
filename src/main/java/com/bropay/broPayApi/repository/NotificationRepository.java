package com.bropay.broPayApi.repository;

import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
import com.bropay.broPayApi.model.Notification;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientEmailOrderByTimestampDesc(String email);
}

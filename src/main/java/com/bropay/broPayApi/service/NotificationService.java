package com.bropay.broPayApi.service;

import com.bropay.broPayApi.model.Notification;
import com.bropay.broPayApi.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    @Autowired
    private NotificationRepository notificationRepo;

    public void createNotification(String recipientEmail, String title, String message) {
        Notification n = new Notification();
        n.setRecipientEmail(recipientEmail);
        n.setTitle(title);
        n.setMessage(message);
        n.setRead(false);
        n.setTimestamp(System.currentTimeMillis());
        notificationRepo.save(n);
    }
}

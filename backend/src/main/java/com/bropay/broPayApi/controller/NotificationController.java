package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.model.Notification;
import com.bropay.broPayApi.repository.NotificationRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    // ✅ Fetch notifications for a user by email
    @GetMapping("/{email}")
    public List<Notification> getNotifications(@PathVariable String email) {
        return notificationRepository.findByRecipientEmailOrderByTimestampDesc(email);
    }
}

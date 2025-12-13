package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.dto.FriendDTO;
import com.bropay.broPayApi.dto.FriendRequestDTO;
import com.bropay.broPayApi.service.UserConnectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/friends")
public class UserConnectionController {

    @Autowired
    private UserConnectionService connectionService;

    @PostMapping("/send")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> sendFriendRequest(@RequestBody FriendRequestDTO request) {
        String senderEmail = request.getSenderEmail();
        String receiverEmail = request.getReceiverEmail();

        String response = connectionService.sendFriendRequestByEmail(senderEmail, receiverEmail);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/respond")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> respondToFriendRequest(@RequestBody FriendRequestDTO request,
            @RequestParam boolean accept) {
        String response = connectionService.respondToFriendRequestByEmail(
                request.getSenderEmail(),
                request.getReceiverEmail(),
                accept);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{userEmail}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<FriendDTO>> getFriends(@PathVariable String userEmail) {
        List<FriendDTO> friends = connectionService.getFriendsByEmail(userEmail);
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/received/{userEmail}")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<List<FriendRequestDTO>> getReceivedRequests(@PathVariable String userEmail) {
        List<FriendRequestDTO> requests = connectionService.getReceivedRequestsByEmail(userEmail);
        return ResponseEntity.ok(requests);
    }
}

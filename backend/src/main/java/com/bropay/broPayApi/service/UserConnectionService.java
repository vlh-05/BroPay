package com.bropay.broPayApi.service;

import com.bropay.broPayApi.dto.FriendDTO;
import com.bropay.broPayApi.dto.FriendRequestDTO;
import com.bropay.broPayApi.model.ConnectionStatus;
import com.bropay.broPayApi.model.Customer;
import com.bropay.broPayApi.model.UserConnection;
import com.bropay.broPayApi.repository.CustomerRepository;
import com.bropay.broPayApi.repository.UserConnectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class UserConnectionService {

    @Autowired
    private UserConnectionRepository userConnectionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    public String sendFriendRequestByEmail(String senderEmail, String receiverEmail) {
        if (senderEmail.equals(receiverEmail))
            return "❌ You cannot send a friend request to yourself.";

        Customer requester = customerRepository.findByEmail(senderEmail).orElse(null);
        Customer recipient = customerRepository.findByEmail(receiverEmail).orElse(null);

        if (requester == null || recipient == null)
            return "❌ One or both users not found.";

        if (userConnectionRepository.findByRequesterAndRecipient(requester, recipient).isPresent()) {
            return "❌ Friend request already exists.";
        }

        UserConnection connection = new UserConnection(requester, recipient, ConnectionStatus.PENDING);
        userConnectionRepository.save(connection);
        return "✅ Friend request sent.";
    }

    public String respondToFriendRequestByEmail(String senderEmail, String receiverEmail, boolean accept) {
        Customer requester = customerRepository.findByEmail(senderEmail).orElse(null);
        Customer recipient = customerRepository.findByEmail(receiverEmail).orElse(null);

        if (requester == null || recipient == null)
            return "❌ Invalid user emails.";

        Optional<UserConnection> connOpt = userConnectionRepository.findByRequesterAndRecipient(requester, recipient);
        if (connOpt.isEmpty())
            return "❌ No pending friend request found.";

        UserConnection conn = connOpt.get();
        conn.setStatus(accept ? ConnectionStatus.ACCEPTED : ConnectionStatus.REJECTED);
        userConnectionRepository.save(conn);

        return accept ? "✅ Friend request accepted." : "✅ Friend request rejected.";
    }

    public List<FriendDTO> getFriendsByEmail(String userEmail) {
        Customer user = customerRepository.findByEmail(userEmail).orElse(null);
        if (user == null)
            return List.of();

        List<UserConnection> allConnections = userConnectionRepository.findByRequesterOrRecipient(user, user);

        return allConnections.stream()
                .filter(conn -> conn.getStatus() == ConnectionStatus.ACCEPTED)
                .map(conn -> {
                    Customer friend = conn.getRequester().getId().equals(user.getId())
                            ? conn.getRecipient()
                            : conn.getRequester();
                    return new FriendDTO(
                            friend.getId(),
                            friend.getName(),
                            friend.getEmail());
                })
                .collect(Collectors.toList());
    }

    public List<FriendRequestDTO> getReceivedRequestsByEmail(String userEmail) {
        Customer recipient = customerRepository.findByEmail(userEmail).orElse(null);
        if (recipient == null) {
            return Collections.emptyList(); // ✅ Safe, type-matched empty list
        }

        // Find all pending requests where this user is the recipient
        List<UserConnection> pendingRequests = userConnectionRepository.findByRecipientAndStatus(recipient,
                ConnectionStatus.PENDING);

        // Convert each connection into FriendRequestDTO
        return pendingRequests.stream()
                .map(conn -> new FriendRequestDTO(
                        conn.getRequester().getEmail(),
                        conn.getRecipient().getEmail()))
                .collect(Collectors.toList());
    }

}

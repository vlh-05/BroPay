package com.bropay.broPayApi.repository;

import com.bropay.broPayApi.model.Customer;
import com.bropay.broPayApi.model.UserConnection;
import com.bropay.broPayApi.model.ConnectionStatus;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserConnectionRepository extends MongoRepository<UserConnection, String> {

    Optional<UserConnection> findByRequesterAndRecipient(Customer requester, Customer recipient);

    Optional<UserConnection> findByRequesterAndRecipientAndStatus(Customer requester, Customer recipient,
            ConnectionStatus status);

    List<UserConnection> findByRequesterOrRecipient(Customer requester, Customer recipient);

    Optional<UserConnection> findByRequester_IdAndRecipient_IdAndStatus(String requesterId, String recipientId,
            ConnectionStatus status);

    List<UserConnection> findByRecipientAndStatus(Customer recipient, ConnectionStatus status);
}

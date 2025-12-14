package com.bropay.broPayApi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.DBRef;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "user_connections")
public class UserConnection {

    @Id
    private String id;

    @DBRef
    private Customer requester;

    @DBRef
    private Customer recipient;

    private ConnectionStatus status;

    public UserConnection() {
    }

    public UserConnection(Customer requester, Customer recipient, ConnectionStatus status) {
        this.requester = requester;
        this.recipient = recipient;
        this.status = status;
    }

    // Getters and Setters

    public String getId() {
        return id;
    }

    public Customer getRequester() {
        return requester;
    }

    public void setRequester(Customer requester) {
        this.requester = requester;
    }

    public Customer getRecipient() {
        return recipient;
    }

    public void setRecipient(Customer recipient) {
        this.recipient = recipient;
    }

    public ConnectionStatus getStatus() {
        return status;
    }

    public void setStatus(ConnectionStatus status) {
        this.status = status;
    }
}

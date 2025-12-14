package com.bropay.broPayApi.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.DBRef;

import java.util.List;

@Document(collection = "customers")
public class Customer {

    @Id
    private String id;

    private String email;
    private String phone;
    private String username;
    private String name;
    private String password;
    private String status;

    // Use @DBRef to handle references (optional, can use manual queries too)
    @DBRef
    private List<UserConnection> sentRequests;

    @DBRef
    private List<UserConnection> receivedRequests;

    public Customer() {
    }

    public Customer(String id, String email, String phone, String username, String name, String password, String status, List<UserConnection> sentRequests, List<UserConnection> receivedRequests) {
        this.id = id;
        this.email = email;
        this.phone = phone;
        this.username = username;
        this.name = name;
        this.password = password;
        this.status = status;
        this.sentRequests = sentRequests;
        this.receivedRequests = receivedRequests;
    }

    // Getters
    public String getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getPhone() {
        return phone;
    }

    public String getUsername() {
        return username;
    }

    public String getName() {
        return name;
    }

    public String getPassword() {
        return password;
    }

    public String getStatus() {
        return status;
    }

    public List<UserConnection> getSentRequests() {
        return sentRequests;
    }

    public List<UserConnection> getReceivedRequests() {
        return receivedRequests;
    }

    // Setters
    public void setId(String id) {
        this.id = id;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setSentRequests(List<UserConnection> sentRequests) {
        this.sentRequests = sentRequests;
    }

    public void setReceivedRequests(List<UserConnection> receivedRequests) {
        this.receivedRequests = receivedRequests;
    }
}

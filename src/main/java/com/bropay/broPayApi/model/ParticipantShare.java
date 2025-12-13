package com.bropay.broPayApi.model;

public class ParticipantShare {

    private String name;
    private String email;
    private String amount; // ✅ stored as String for consistency

    public ParticipantShare() {
    }

    public ParticipantShare(String name, String email, String amount) {
        this.name = name;
        this.email = email;
        this.amount = amount;
    }

    // Getters and Setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }
}

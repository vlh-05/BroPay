package com.bropay.broPayApi.dto;

public class FriendRequestDTO {
    private String senderEmail;
    private String receiverEmail;

    // Constructors
    public FriendRequestDTO() {
    }

    public FriendRequestDTO(String senderEmail, String receiverEmail) {
        this.senderEmail = senderEmail;
        this.receiverEmail = receiverEmail;
    }

    // Getters and Setters
    public String getSenderEmail() {
        return senderEmail;
    }

    public void setSenderEmail(String senderEmail) {
        this.senderEmail = senderEmail;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }
}

package com.bropay.broPayApi.dto;

public class ChatMessageDTO {

    private String sender;
    private String receiver;
    private String message;

    // Constructor
    public ChatMessageDTO() {}

    // Getters
    public String getSender() {
        return sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public String getMessage() {
        return message;
    }

    // Setters
    public void setSender(String sender) {
        this.sender = sender;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

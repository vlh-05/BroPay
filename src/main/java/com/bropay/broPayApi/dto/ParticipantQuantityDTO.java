package com.bropay.broPayApi.dto;

public class ParticipantQuantityDTO {

    private String participantId;
    private String participantEmail;  // ✅ added
    private String participantName;   // optional if you already have it
    private Double quantity;

    public ParticipantQuantityDTO() {}

    public ParticipantQuantityDTO(String participantId, Double quantity) {
        this.participantId = participantId;
        this.quantity = quantity;
    }

    // ✅ new getter for email, with fallback
    public String getParticipantEmail() {
        // fallback in case email not sent separately
        return participantEmail != null && !participantEmail.isBlank()
                ? participantEmail
                : participantId;
    }

    public void setParticipantEmail(String participantEmail) {
        this.participantEmail = participantEmail;
    }

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }

    public String getParticipantName() {
        return participantName;
    }

    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }
}

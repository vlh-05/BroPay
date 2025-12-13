package com.bropay.broPayApi.dto;

public class SplitRequestDTO {
    private String participantName;
    private Double sharePercentage;
    private Double quantity;
    private String participantId;
    private String participantEmail; // ✅ Added field

    public SplitRequestDTO() {}

    public SplitRequestDTO(String participantName, Double sharePercentage, Double quantity) {
        this.participantName = participantName;
        this.sharePercentage = sharePercentage;
        this.quantity = quantity;
    }

    // ✅ Added constructor (optional)
    public SplitRequestDTO(String participantName, Double sharePercentage, Double quantity, String participantId) {
        this.participantName = participantName;
        this.sharePercentage = sharePercentage;
        this.quantity = quantity;
        this.participantId = participantId;
    }

    // ✅ Fully backward-compatible fallback getter
    public String getParticipantEmail() {
        // If email not provided, fallback to participantId (since it’s often an email itself)
        return participantEmail != null && !participantEmail.isBlank()
                ? participantEmail
                : participantId;
    }

    public void setParticipantEmail(String participantEmail) {
        this.participantEmail = participantEmail;
    }

    // ✅ Existing Getters & Setters
    public String getParticipantName() {
        return participantName;
    }

    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    public Double getSharePercentage() {
        return sharePercentage;
    }

    public void setSharePercentage(Double sharePercentage) {
        this.sharePercentage = sharePercentage;
    }

    public Double getQuantity() {
        return quantity;
    }

    public void setQuantity(Double quantity) {
        this.quantity = quantity;
    }

    public String getParticipantId() {
        return participantId;
    }

    public void setParticipantId(String participantId) {
        this.participantId = participantId;
    }
}

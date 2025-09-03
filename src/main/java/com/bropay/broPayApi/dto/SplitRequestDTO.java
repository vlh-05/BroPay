package com.bropay.broPayApi.dto;

public class SplitRequestDTO {
    private String participantName;
    private Double sharePercentage; // Used in percentage split
    private Double quantity;        // Used in quantity-based split

    public SplitRequestDTO() {}

    public SplitRequestDTO(String participantName, Double sharePercentage, Double quantity) {
        this.participantName = participantName;
        this.sharePercentage = sharePercentage;
        this.quantity = quantity;
    }

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
}

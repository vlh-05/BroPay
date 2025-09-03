package com.bropay.broPayApi.dto;

public class SplitSummaryDTO {
    private String participantName;
    private Double amountOwed;

    public SplitSummaryDTO() {}

    public SplitSummaryDTO(String participantName, Double amountOwed) {
        this.participantName = participantName;
        this.amountOwed = amountOwed;
    }

    public String getParticipantName() {
        return participantName;
    }

    public void setParticipantName(String participantName) {
        this.participantName = participantName;
    }

    public Double getAmountOwed() {
        return amountOwed;
    }

    public void setAmountOwed(Double amountOwed) {
        this.amountOwed = amountOwed;
    }
}

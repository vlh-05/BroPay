package com.bropay.broPayApi.dto;

public class SplitSummaryDTO {

    private String participantEmail;
    private String amountOwed;

    public SplitSummaryDTO() {
    }

    public SplitSummaryDTO(String participantEmail, String amountOwed) {
        this.participantEmail = participantEmail;
        this.amountOwed = amountOwed;
    }

    public SplitSummaryDTO(String participantEmail, double amountOwed) {
        this.participantEmail = participantEmail;
        this.amountOwed = String.format("%.2f", amountOwed);
    }

    public String getParticipantEmail() {
        return participantEmail;
    }

    public void setParticipantEmail(String participantEmail) {
        this.participantEmail = participantEmail;
    }

    public String getAmountOwed() {
        return amountOwed;
    }

    public void setAmountOwed(String amountOwed) {
        this.amountOwed = amountOwed;
    }

}

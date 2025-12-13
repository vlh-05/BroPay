package com.bropay.broPayApi.dto;

import java.util.List;

import com.bropay.broPayApi.model.SplitType;

public class SplitComputeRequestDTO {

    private String initiatorId;
    private List<LineItemDTO> lineItems;
    private List<SplitRequestDTO> participants;
    private SplitType splitType;
    private String tax;

    // ✅ Getters and Setters
    public String getInitiatorId() {
        return initiatorId;
    }

    public void setInitiatorId(String initiatorId) {
        this.initiatorId = initiatorId;
    }

    public List<LineItemDTO> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<LineItemDTO> lineItems) {
        this.lineItems = lineItems;
    }

    public List<SplitRequestDTO> getParticipants() {
        return participants;
    }

    public void setParticipants(List<SplitRequestDTO> participants) {
        this.participants = participants;
    }

    public SplitType getSplitType() {
        return splitType;
    }

    public void setSplitType(SplitType splitType) {
        this.splitType = splitType;
    }

    public String getTax() {
        return tax;
    }

    public void setTax(String tax) {
        this.tax = tax;
    }
}

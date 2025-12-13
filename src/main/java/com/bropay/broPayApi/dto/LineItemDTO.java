package com.bropay.broPayApi.dto;

import java.util.List;

public class LineItemDTO {

    private String description;
    private String price;
    private String quantity;
    private List<ParticipantQuantityDTO> splitDetails;

    // 🧱 Default constructor (needed for JSON deserialization)
    public LineItemDTO() {
    }

    // ✅ Constructor used in your unit tests
    public LineItemDTO(String description, String price, String quantity) {
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    // ✅ All Getters
    public String getDescription() {
        return description;
    }

    public String getPrice() {
        return price == null ? "0" : price;
    }

    public String getQuantity() {
        return quantity;
    }

    public List<ParticipantQuantityDTO> getSplitDetails() {
        return splitDetails;
    }

    // ✅ All Setters
    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public void setSplitDetails(List<ParticipantQuantityDTO> splitDetails) {
        this.splitDetails = splitDetails;
    }
}

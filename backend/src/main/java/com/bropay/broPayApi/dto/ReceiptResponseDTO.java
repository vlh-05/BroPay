package com.bropay.broPayApi.dto;

import java.util.List;

public class ReceiptResponseDTO {
    private double totalAmount;
    private int totalItems;
    private int extractedItems;
    private String message;
    private List<LineItemDTO> items;

    public ReceiptResponseDTO(List<LineItemDTO> items, double totalAmount, int totalItems) {
        this.items = items;
        this.totalAmount = totalAmount;
        this.totalItems = totalItems;
    }

    public List<LineItemDTO> getItems() {
        return items;
    }

    public void setItems(List<LineItemDTO> items) {
        this.items = items;
    }

    public double getTotalAmount() {
        return totalAmount;
    }

    public void setTotalAmount(double totalAmount) {
        this.totalAmount = totalAmount;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public int getExtractedItems() {
        return extractedItems;
    }

    public void setExtractedItems(int extractedItems) {
        this.extractedItems = extractedItems;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

}

package com.bropay.broPayApi.model;

// ❌ Remove @Document and @Id — this will now be embedded inside ExpenseSplit
public class LineItem {

    private String description;
    private String quantity; // store as String to match frontend and DTO flow
    private String price; // store as String to avoid conversion issues

    public LineItem() {
    }

    public LineItem(String description, String price, String quantity) {
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    // ✅ Getters and Setters
    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getQuantity() {
        return quantity;
    }

    public void setQuantity(String quantity) {
        this.quantity = quantity;
    }

    public String getPrice() {
        return price;
    }

    public void setPrice(String price) {
        this.price = price;
    }
}

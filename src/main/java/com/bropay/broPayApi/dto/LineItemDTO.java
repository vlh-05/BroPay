package com.bropay.broPayApi.dto;

public class LineItemDTO {
    private String description;
    private String price;
    private String quantity;

    public LineItemDTO() {}
    public LineItemDTO(String description, String price, String quantity) {
        this.description = description;
        this.price = price;
        this.quantity = quantity;
    }

    public String getDescription() {
        return description;
    }

    public String getPrice() {
        return price;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(String price) {
        this.price = price;
    }

    public String getQuantity() {
         return quantity;
        }
    public void setQuantity(String quantity) 
    { 
        this.quantity = quantity; 
    }

}

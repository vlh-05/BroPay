package com.bropay.broPayApi.model;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.Id;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.mongodb.core.mapping.Document;

import com.fasterxml.jackson.annotation.JsonProperty;

@Document(collection = "expense_splits")
public class ExpenseSplit {

    @Id
    private String id;

    // 🧍‍♂️ Split creator
    private String initiatorEmail;

    // ⚙️ Split metadata
    private String splitType;
    private String status;
    private String amount; // total split amount as String
    private String tax;

    // 👥 All participants and their shares
    private List<ParticipantShare> participantShares;

    // 🧾 Optional: detailed breakdown of each item
    private List<LineItem> lineItems;

    @CreatedDate
    private LocalDateTime createdAt;

    @LastModifiedDate
    private LocalDateTime updatedAt;

    // --------------------------------------------------
    // ✅ Constructors
    // --------------------------------------------------

    public ExpenseSplit() {
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public ExpenseSplit(String initiatorEmail, String amount, String splitType,
                        List<ParticipantShare> participantShares) {
        this.initiatorEmail = initiatorEmail;
        this.amount = amount;
        this.splitType = splitType;
        this.participantShares = participantShares;
        this.status = "PENDING";
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    public ExpenseSplit(String initiatorEmail,
                        String amount,
                        String splitType,
                        String status,
                        List<ParticipantShare> participantShares,
                        List<LineItem> lineItems,
                        LocalDateTime createdAt,
                        LocalDateTime updatedAt) {
        this.initiatorEmail = initiatorEmail;
        this.amount = amount;
        this.splitType = splitType;
        this.status = status != null ? status : "PENDING";
        this.participantShares = participantShares;
        this.lineItems = lineItems;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.updatedAt = updatedAt != null ? updatedAt : LocalDateTime.now();
    }

    // --------------------------------------------------
    // ✅ Getters & Setters
    // --------------------------------------------------

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getInitiatorEmail() {
        return initiatorEmail;
    }

    public void setInitiatorEmail(String initiatorEmail) {
        this.initiatorEmail = initiatorEmail;
    }

    public String getSplitType() {
        return splitType;
    }

    public void setSplitType(String splitType) {
        this.splitType = splitType;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getAmount() {
        return amount;
    }

    public void setAmount(String amount) {
        this.amount = amount;
    }

    // 🧩 Expose participantShares as "participants" in JSON
    @JsonProperty("participants")
    public List<ParticipantShare> getParticipants() {
        return participantShares;
    }

    @JsonProperty("participants")
    public void setParticipants(List<ParticipantShare> participants) {
        this.participantShares = participants;
    }

    public List<LineItem> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<LineItem> lineItems) {
        this.lineItems = lineItems;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getTax() {
        return tax;
    }

    public void setTax(String tax) {
        this.tax = tax;
    }

}

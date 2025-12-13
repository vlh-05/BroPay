package com.bropay.broPayApi.model;

import java.time.LocalDate;
import java.time.LocalDateTime;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("recurring_entries")
public class RecurringEntry {

    @Id
    private String id;

    // Who will actually pay
    private String payerEmail;

    // Who will receive the money
    private String receiverEmail;

    // For tracking who created the schedule (could be same as payer or receiver)
    private String createdBy;

    private String description;      // Optional: “Rent”, “Netflix”, etc.
    private double amount;
    private String frequency;        // DAILY, WEEKLY, MONTHLY, QUARTERLY, YEARLY, etc.

    // Schedule window
    private LocalDate startDate;     // When recurring starts
    private LocalDate endDate;       // Null = no fixed end date

    // For “After N payments” mode (null = unlimited)
    private Integer remainingPayments;

    // Next execution time
    private LocalDateTime nextRun;

    // Status: ACTIVE, PAUSED, ENDED
    private String status;

    private boolean active;          // convenient flag
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    // ========= Getters =========

    public String getId() {
        return id;
    }

    public String getPayerEmail() {
        return payerEmail;
    }

    public String getReceiverEmail() {
        return receiverEmail;
    }

    public String getCreatedBy() {
        return createdBy;
    }

    public String getDescription() {
        return description;
    }

    public double getAmount() {
        return amount;
    }

    public String getFrequency() {
        return frequency;
    }

    public LocalDate getStartDate() {
        return startDate;
    }

    public LocalDate getEndDate() {
        return endDate;
    }

    public Integer getRemainingPayments() {
        return remainingPayments;
    }

    public LocalDateTime getNextRun() {
        return nextRun;
    }

    public String getStatus() {
        return status;
    }

    public boolean isActive() {
        return active;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // ========= Setters =========

    public void setId(String id) {
        this.id = id;
    }

    public void setPayerEmail(String payerEmail) {
        this.payerEmail = payerEmail;
    }

    public void setReceiverEmail(String receiverEmail) {
        this.receiverEmail = receiverEmail;
    }

    public void setCreatedBy(String createdBy) {
        this.createdBy = createdBy;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setAmount(double amount) {
        this.amount = amount;
    }

    public void setFrequency(String frequency) {
        this.frequency = frequency;
    }

    public void setStartDate(LocalDate startDate) {
        this.startDate = startDate;
    }

    public void setEndDate(LocalDate endDate) {
        this.endDate = endDate;
    }

    public void setRemainingPayments(Integer remainingPayments) {
        this.remainingPayments = remainingPayments;
    }

    public void setNextRun(LocalDateTime nextRun) {
        this.nextRun = nextRun;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}

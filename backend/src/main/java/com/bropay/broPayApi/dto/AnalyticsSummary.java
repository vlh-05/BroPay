package com.bropay.broPayApi.dto;

public class AnalyticsSummary {
    private int totalReceipts;
    private int totalPayments;
    private double totalSpent;
    private int totalSplits;
    private int activeRecurringEntries;

    // Constructor
    public AnalyticsSummary(int totalReceipts, int totalPayments, double totalSpent, int totalSplits,
            int activeRecurringEntries) {
        this.totalReceipts = totalReceipts;
        this.totalPayments = totalPayments;
        this.totalSpent = totalSpent;
        this.totalSplits = totalSplits;
        this.activeRecurringEntries = activeRecurringEntries;
    }

    // Getters and Setters
    public int getTotalReceipts() {
        return totalReceipts;
    }

    public void setTotalReceipts(int totalReceipts) {
        this.totalReceipts = totalReceipts;
    }

    public int getTotalPayments() {
        return totalPayments;
    }

    public void setTotalPayments(int totalPayments) {
        this.totalPayments = totalPayments;
    }

    public double getTotalSpent() {
        return totalSpent;
    }

    public void setTotalSpent(double totalSpent) {
        this.totalSpent = totalSpent;
    }

    public int getTotalSplits() {
        return totalSplits;
    }

    public void setTotalSplits(int totalSplits) {
        this.totalSplits = totalSplits;
    }

    public int getActiveRecurringEntries() {
        return activeRecurringEntries;
    }

    public void setActiveRecurringEntries(int activeRecurringEntries) {
        this.activeRecurringEntries = activeRecurringEntries;
    }
}

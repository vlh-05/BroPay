package com.bropay.broPayApi.service;

import com.bropay.broPayApi.dto.AnalyticsSummary;
import com.bropay.broPayApi.model.Payment;
import com.bropay.broPayApi.model.RecurringEntry;
import com.bropay.broPayApi.model.Receipt;
import com.bropay.broPayApi.repository.ExpenseSplitRepository;
import com.bropay.broPayApi.repository.LineItemRepository;
import com.bropay.broPayApi.repository.PaymentRepository;
import com.bropay.broPayApi.repository.ReceiptRepository;
import com.bropay.broPayApi.repository.RecurringEntryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AnalyticsService {

    @Autowired
    private ExpenseSplitRepository expenseSplitRepo;

    @Autowired
    private PaymentRepository paymentRepo;

    @Autowired
    private LineItemRepository lineItemRepo;

    @Autowired
    private ReceiptRepository receiptRepo;

    @Autowired
    private RecurringEntryRepository recurringRepo;

    public AnalyticsSummary getSummary(String userEmail) {
        List<Payment> payments = paymentRepo.findByPayer(userEmail);
        double totalSpent = payments.stream().mapToDouble(Payment::getAmount).sum();

        List<Receipt> userReceipts = receiptRepo.findByCreatedBy(userEmail);
        int totalReceipts = userReceipts.size();

        // 🔧 OLD (double-counted)
        // int splitsInitiated =
        // expenseSplitRepo.findByInitiatorEmail(userEmail).size();
        // int splitsParticipated =
        // expenseSplitRepo.findByParticipantEmail(userEmail).size();
        // int totalSplits = splitsInitiated + splitsParticipated;

        // ✅ NEW — each split counted once per pair
        int totalSplits = expenseSplitRepo.findCanonicalForUser(userEmail).size();

        long activeRecurringEntries = recurringRepo.count();

        return new AnalyticsSummary(
                totalReceipts,
                payments.size(),
                totalSpent,
                totalSplits,
                (int) activeRecurringEntries);
    }

}

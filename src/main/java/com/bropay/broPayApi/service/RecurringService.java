package com.bropay.broPayApi.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.model.Payment;
import com.bropay.broPayApi.model.RecurringEntry;
import com.bropay.broPayApi.repository.PaymentRepository;
import com.bropay.broPayApi.repository.RecurringEntryRepository;

@Service
public class RecurringService {

    @Autowired
    private RecurringEntryRepository repository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private NotificationService notificationService;

    // ========= CRUD / Query methods =========

    public RecurringEntry create(RecurringEntry entry) {
        // safety: we control server-side fields
        entry.setId(null);
        entry.setStatus("ACTIVE");
        entry.setActive(true);

        LocalDate today = LocalDate.now();

        if (entry.getStartDate() == null) {
            entry.setStartDate(today);
        }

        // default: no hard end date & unlimited payments unless frontend sends values
        // (if frontend sends endDate / remainingPayments, they’ll be respected)
        // Next run at 9 AM on start date (you can change time if you want)
        entry.setNextRun(entry.getStartDate().atTime(9, 0));

        LocalDateTime now = LocalDateTime.now();
        entry.setCreatedAt(now);
        entry.setUpdatedAt(now);

        return repository.save(entry);
    }

    public List<RecurringEntry> getOutgoingForUser(String email) {
        return repository.findByPayerEmailOrderByCreatedAtDesc(email);
    }

    public List<RecurringEntry> getIncomingForUser(String email) {
        return repository.findByReceiverEmailOrderByCreatedAtDesc(email);
    }

    public Optional<RecurringEntry> pause(String id) {
        Optional<RecurringEntry> opt = repository.findById(id);
        if (opt.isEmpty()) return opt;

        RecurringEntry entry = opt.get();
        if (!"ENDED".equalsIgnoreCase(entry.getStatus())) {
            entry.setActive(false);
            entry.setStatus("PAUSED");
            entry.setUpdatedAt(LocalDateTime.now());
            repository.save(entry);
        }
        return Optional.of(entry);
    }

    public Optional<RecurringEntry> resume(String id) {
        Optional<RecurringEntry> opt = repository.findById(id);
        if (opt.isEmpty()) return opt;

        RecurringEntry entry = opt.get();
        if (!"ENDED".equalsIgnoreCase(entry.getStatus())) {
            entry.setActive(true);
            entry.setStatus("ACTIVE");
            entry.setUpdatedAt(LocalDateTime.now());
            repository.save(entry);
        }
        return Optional.of(entry);
    }

    public void delete(String id) {
        repository.deleteById(id);
    }

    // ========= Scheduler =========
    // Runs every day at 2 AM
    @Scheduled(cron = "0 0 2 * * ?")
    public void processRecurringPayments() {
        List<RecurringEntry> activeEntries = repository.findByActiveTrue();
        LocalDateTime now = LocalDateTime.now();

        for (RecurringEntry entry : activeEntries) {
            if (entry.getNextRun() == null) continue;

            // Only trigger if due
            if (entry.getNextRun().isAfter(now)) continue;

            // Check end date
            LocalDate start = entry.getStartDate();
            LocalDate endDate = entry.getEndDate();
            LocalDate today = now.toLocalDate();

            if (start != null && today.isBefore(start)) {
                continue;
            }

            if (endDate != null && today.isAfter(endDate)) {
                markAsEnded(entry);
                continue;
            }

            // Check remaining payments
            Integer remaining = entry.getRemainingPayments();
            if (remaining != null && remaining <= 0) {
                markAsEnded(entry);
                continue;
            }

            // 1) Create Payment record
            Payment payment = new Payment();
            payment.setAmount(entry.getAmount());
            payment.setPayer(entry.getPayerEmail());
            payment.setReceiver(entry.getReceiverEmail());
            payment.setStatus("RECURRING");
            payment.setTimestamp(now);
            paymentRepository.save(payment);

            // 2) Notify payer (and optionally receiver)
            try {
                notificationService.createNotification(
                        entry.getPayerEmail(),
                        "Recurring payment processed",
                        "A recurring payment of $" + entry.getAmount() +
                                " to " + entry.getReceiverEmail() +
                                " (" + entry.getFrequency() + ") has been processed."
                );
            } catch (Exception ex) {
                // don’t break scheduler on notification failure
                ex.printStackTrace();
            }

            // 3) Decrement remaining payments
            if (remaining != null) {
                remaining -= 1;
                entry.setRemainingPayments(remaining);
                if (remaining <= 0) {
                    markAsEnded(entry);
                    continue; // no need to compute nextRun
                }
            }

            // 4) Compute nextRun
            LocalDateTime next = getNextRun(entry.getNextRun(), entry.getFrequency());
            // If next run goes beyond end date, end it
            if (endDate != null && next.toLocalDate().isAfter(endDate)) {
                markAsEnded(entry);
            } else {
                entry.setNextRun(next);
                entry.setUpdatedAt(LocalDateTime.now());
                repository.save(entry);
            }
        }
    }

    private LocalDateTime getNextRun(LocalDateTime current, String frequency) {
        if (current == null) {
            return LocalDateTime.now().plusDays(1);
        }
        if (frequency == null) {
            return current.plusMonths(1);
        }

        switch (frequency.toUpperCase()) {
            case "DAILY":
                return current.plusDays(1);
            case "WEEKLY":
                return current.plusWeeks(1);
            case "BIWEEKLY":
                return current.plusWeeks(2);
            case "MONTHLY":
                return current.plusMonths(1);
            case "QUARTERLY":
                return current.plusMonths(3);
            case "YEARLY":
                return current.plusYears(1);
            default:
                return current.plusMonths(1);
        }
    }

    private void markAsEnded(RecurringEntry entry) {
        entry.setActive(false);
        entry.setStatus("ENDED");
        entry.setUpdatedAt(LocalDateTime.now());
        repository.save(entry);
    }
}

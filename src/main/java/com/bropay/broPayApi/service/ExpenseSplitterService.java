package com.bropay.broPayApi.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.dto.ParticipantQuantityDTO;
import com.bropay.broPayApi.dto.SplitRequestDTO;
import com.bropay.broPayApi.dto.SplitSummaryDTO;
import com.bropay.broPayApi.model.ConnectionStatus;
import com.bropay.broPayApi.model.Customer;
import com.bropay.broPayApi.model.SplitType;
import com.bropay.broPayApi.repository.CustomerRepository;
import com.bropay.broPayApi.repository.ExpenseSplitRepository;
import com.bropay.broPayApi.repository.UserConnectionRepository;

@Service
public class ExpenseSplitterService {

    @Autowired
    private UserConnectionRepository userConnectionRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private ExpenseSplitRepository expenseSplitRepository;

    @Autowired
    private NotificationService notificationService;

    public List<SplitSummaryDTO> calculateSplits(
            String initiatorId,
            List<LineItemDTO> lineItems,
            List<SplitRequestDTO> participants,
            SplitType splitType,
            String tax) {

        double totalAmount = 0.0;

        // ✅ Step 1: Calculate base total (price × quantity)
        for (LineItemDTO item : lineItems) {
            totalAmount += parseDouble(item.getPrice());
        }

        // ✅ Step 2: Add tax once
        double taxValue = parseDouble(tax);
        totalAmount += taxValue;

        // ✅ Step 3: Validate participants (friend check)
        for (SplitRequestDTO p : participants) {
            String participantEmail = p.getParticipantId(); // using participantId as email
            if (participantEmail == null || participantEmail.isBlank())
                continue;

            if (!participantEmail.equalsIgnoreCase(initiatorId)
                    && !areUsersFriends(initiatorId, participantEmail)) {
                throw new IllegalArgumentException("❌ Cannot split with non-friend user: " + participantEmail);
            }
        }

        List<SplitSummaryDTO> result = new ArrayList<>();

        // ✅ Step 4: Compute splits
        switch (splitType) {
            case EQUAL -> {
                double perHead = totalAmount / participants.size();
                for (SplitRequestDTO p : participants) {
                    result.add(new SplitSummaryDTO(p.getParticipantId(), round2(perHead)));
                }
            }

            case PERCENTAGE -> {
                for (SplitRequestDTO p : participants) {
                    double percent = p.getSharePercentage() != null ? p.getSharePercentage() : 0.0;
                    double share = (percent / 100.0) * totalAmount;
                    result.add(new SplitSummaryDTO(p.getParticipantId(), round2(share)));
                }
            }

            case QUANTITY -> {
                Map<String, Double> participantTotals = new HashMap<>();

                // ✅ Step 1: totalAmount already includes tax
                double subtotal = 0.0;

                for (LineItemDTO item : lineItems) {
                    // 🟢 Take price as total entered by user (not per item * qty)
                    double itemTotalPrice = parseDouble(item.getPrice());

                    // 🟢 Sum of all participant quantities for this item
                    double totalQty = item.getSplitDetails() == null ? 0.0
                            : item.getSplitDetails().stream()
                                    .mapToDouble(ParticipantQuantityDTO::getQuantity)
                                    .sum();

                    if (itemTotalPrice <= 0 || totalQty <= 0)
                        continue;

                    subtotal += itemTotalPrice;

                    // 🟢 Split based on relative quantity
                    for (ParticipantQuantityDTO q : item.getSplitDetails()) {
                        double share = (q.getQuantity() / totalQty) * itemTotalPrice;
                        participantTotals.merge(q.getParticipantId(), share, Double::sum);
                    }
                }

                taxValue = parseDouble(tax);
                double totalBeforeTax = participantTotals.values().stream().mapToDouble(Double::doubleValue).sum();

                for (Map.Entry<String, Double> entry : participantTotals.entrySet()) {
                    double base = entry.getValue();
                    // proportionally distribute tax
                    double taxShare = totalBeforeTax > 0 ? (base / totalBeforeTax) * taxValue : 0;
                    double finalShare = base + taxShare;
                    result.add(new SplitSummaryDTO(entry.getKey(), round2(finalShare)));
                }
                System.out.println("Subtotal=" + subtotal + ", Tax=" + tax + ", Total=" + totalAmount);
                System.out.println("Participant totals before tax: " + participantTotals);

            }

        }

        // ✅ Step 5: Fix any rounding mismatch (sum of shares == total)
        double computedTotal = result.stream()
                .mapToDouble(r -> parseDouble(r.getAmountOwed()))
                .sum();
        if (computedTotal != 0 && Math.abs(computedTotal - totalAmount) >= 0.01) {
            double diffPerPerson = (totalAmount - computedTotal) / result.size();
            for (SplitSummaryDTO r : result) {
                double adjusted = parseDouble(r.getAmountOwed()) + diffPerPerson;
                r.setAmountOwed(String.format("%.2f", adjusted));
            }
        }

        return result;
    }

    // ✅ Create and save ExpenseSplit record
    // ExpenseSplit splitRecord = new ExpenseSplit();
    // splitRecord.setInitiatorEmail(initiatorId);
    // splitRecord.setAmount(String.valueOf(totalAmount));
    // splitRecord.setSplitType(splitType.name());
    // splitRecord.setParticipants(participantShares);
    // splitRecord.setStatus("PENDING");
    // splitRecord.setCreatedAt(java.time.LocalDateTime.now());
    // splitRecord.setUpdatedAt(java.time.LocalDateTime.now());

    // if (lineItems != null && !lineItems.isEmpty()) {
    // List<LineItem> items = new ArrayList<>();
    // for (LineItemDTO dto : lineItems) {
    // LineItem li = new LineItem(
    // String.valueOf(dto.getDescription()),
    // String.valueOf(dto.getPrice()),
    // String.valueOf(dto.getQuantity()));
    // items.add(li);
    // }
    // splitRecord.setLineItems(items);
    // }

    // expenseSplitRepository.save(splitRecord);

    // ✅ Notify participants
    // for (ParticipantShare ps : participantShares) {
    // if (!ps.getEmail().equalsIgnoreCase(initiatorId)) {
    // notificationService.createNotification(
    // ps.getEmail(),
    // "Split Added",
    // "New split created by " + initiatorId
    // + " — Amount: ₹" + ps.getAmount()
    // + " (" + splitType.name() + ")");
    // }
    // }

    // -------------------- Helpers --------------------
    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }

    private double parseDouble(String val) {
        if (val == null)
            return 0.0;
        try {
            val = val.trim().replaceAll("[^0-9.\\-]", "");
            return val.isEmpty() ? 0.0 : Double.parseDouble(val);
        } catch (Exception e) {
            return 0.0;
        }
    }

    public boolean areUsersFriends(String email1, String email2) {
        Customer user1 = customerRepository.findByEmail(email1).orElse(null);
        Customer user2 = customerRepository.findByEmail(email2).orElse(null);
        if (user1 == null || user2 == null)
            return false;

        return userConnectionRepository
                .findByRequesterAndRecipientAndStatus(user1, user2, ConnectionStatus.ACCEPTED).isPresent()
                || userConnectionRepository
                        .findByRequesterAndRecipientAndStatus(user2, user1, ConnectionStatus.ACCEPTED).isPresent();
    }
}

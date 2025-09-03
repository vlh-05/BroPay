package com.bropay.broPayApi.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.dto.SplitRequestDTO;
import com.bropay.broPayApi.dto.SplitSummaryDTO;
import com.bropay.broPayApi.model.SplitType;

@Service
public class ExpenseSplitterService {

    public List<SplitSummaryDTO> calculateSplits(
            List<LineItemDTO> lineItems,
            List<SplitRequestDTO> participants,
            SplitType splitType) {

        double totalAmount = 0.0;

        // Compute total receipt amount
        for (LineItemDTO item : lineItems) {
            try {
                String priceStr = item.getPrice().replaceAll("[^\\d.]", "");
                totalAmount += Double.parseDouble(priceStr);
            } catch (Exception e) {
                // Skip invalid price
            }
        }

        List<SplitSummaryDTO> result = new ArrayList<>();

        switch (splitType) {

            case EQUAL -> {
                double perHead = totalAmount / participants.size();
                for (SplitRequestDTO p : participants) {
                    result.add(new SplitSummaryDTO(p.getParticipantName(), round2(perHead)));
                }
            }

            case PERCENTAGE -> {
                for (SplitRequestDTO p : participants) {
                    double share = (p.getSharePercentage() / 100.0) * totalAmount;
                    result.add(new SplitSummaryDTO(p.getParticipantName(), round2(share)));
                }
            }

            case QUANTITY -> {
                double totalQty = 0.0;
                for (SplitRequestDTO p : participants) {
                    totalQty += p.getQuantity();
                }
                for (SplitRequestDTO p : participants) {
                    double share = (p.getQuantity() / totalQty) * totalAmount;
                    result.add(new SplitSummaryDTO(p.getParticipantName(), round2(share)));
                }
            }
        }

        return result;
    }

    private double round2(double val) {
        return Math.round(val * 100.0) / 100.0;
    }
}

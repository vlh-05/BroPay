package com.bropay.broPayApi.service;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.junit.jupiter.api.Test;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.dto.SplitRequestDTO;
import com.bropay.broPayApi.dto.SplitSummaryDTO;
import com.bropay.broPayApi.model.SplitType;

class ExpenseSplitterServiceTest {

    private final ExpenseSplitterService splitterService = new ExpenseSplitterService();

    @Test
    void testEqualSplit() {
        List<LineItemDTO> items = List.of(
            new LineItemDTO("Apple", "$6.00", "1"),
            new LineItemDTO("Orange", "$4.00", "1")
        );

        List<SplitRequestDTO> participants = List.of(
            new SplitRequestDTO("Alice", null, null),
            new SplitRequestDTO("Bob", null, null)
        );

        List<SplitSummaryDTO> result = splitterService.calculateSplits(items, participants, SplitType.EQUAL);

        assertEquals(2, result.size());
        assertEquals(5.0, result.get(0).getAmountOwed());
        assertEquals(5.0, result.get(1).getAmountOwed());
    }

    @Test
    void testPercentageSplit() {
        List<LineItemDTO> items = List.of(
            new LineItemDTO("Mango", "$10.00", "1")
        );

        List<SplitRequestDTO> participants = List.of(
            new SplitRequestDTO("Alice", 60.0, null),
            new SplitRequestDTO("Bob", 40.0, null)
        );

        List<SplitSummaryDTO> result = splitterService.calculateSplits(items, participants, SplitType.PERCENTAGE);

        assertEquals(6.0, result.get(0).getAmountOwed());
        assertEquals(4.0, result.get(1).getAmountOwed());
    }

    @Test
    void testQuantitySplit() {
        List<LineItemDTO> items = List.of(
            new LineItemDTO("Rice", "$15.00", "1")
        );

        List<SplitRequestDTO> participants = List.of(
            new SplitRequestDTO("Alice", null, 2.0),
            new SplitRequestDTO("Bob", null, 3.0)
        );

        List<SplitSummaryDTO> result = splitterService.calculateSplits(items, participants, SplitType.QUANTITY);

        assertEquals(6.0, result.get(0).getAmountOwed()); // 2/5 of 15
        assertEquals(9.0, result.get(1).getAmountOwed()); // 3/5 of 15
    }

    @Test
    void testEmptyParticipants() {
        List<LineItemDTO> items = List.of(
            new LineItemDTO("Bread", "$3.00", "1")
        );

        List<SplitRequestDTO> participants = List.of();

        List<SplitSummaryDTO> result = splitterService.calculateSplits(items, participants, SplitType.EQUAL);

        assertEquals(0, result.size());
    }

    @Test
    void testZeroPriceItems() {
        List<LineItemDTO> items = List.of(
            new LineItemDTO("Free Sample", "$0.00", "1")
        );

        List<SplitRequestDTO> participants = List.of(
            new SplitRequestDTO("Alice", null, null),
            new SplitRequestDTO("Bob", null, null)
        );

        List<SplitSummaryDTO> result = splitterService.calculateSplits(items, participants, SplitType.EQUAL);

        assertEquals(0.0, result.get(0).getAmountOwed());
        assertEquals(0.0, result.get(1).getAmountOwed());
    }
}

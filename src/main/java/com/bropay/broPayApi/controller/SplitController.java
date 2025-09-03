package com.bropay.broPayApi.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.dto.SplitRequestDTO;
import com.bropay.broPayApi.dto.SplitSummaryDTO;
import com.bropay.broPayApi.model.SplitType;
import com.bropay.broPayApi.service.ExpenseSplitterService;

@RestController
@RequestMapping("/api/split")
public class SplitController {

    @Autowired
    private ExpenseSplitterService expenseSplitterService;

    // Define a DTO to wrap the input
    public static class SplitComputeRequest {
        public List<LineItemDTO> lineItems;
        public List<SplitRequestDTO> participants;
        public SplitType splitType;
    }

    @PostMapping("/compute")
    public List<SplitSummaryDTO> computeSplit(@RequestBody SplitComputeRequest request) {
        return expenseSplitterService.calculateSplits(
                request.lineItems,
                request.participants,
                request.splitType
        );
    }
}

package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.dto.AnalyticsSummary;
import com.bropay.broPayApi.service.AnalyticsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    @Autowired
    private AnalyticsService analyticsService;

    @GetMapping("/summary/{userEmail}")
    public AnalyticsSummary getSummary(@PathVariable String userEmail) {
        return analyticsService.getSummary(userEmail);
    }

}

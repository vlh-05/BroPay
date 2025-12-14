package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {

    @Autowired
    private OcrService ocrService;

    @PostMapping(value = "/upload", consumes = "multipart/form-data")
public ResponseEntity<Map<String, Object>> uploadReceipt(@RequestParam("file") MultipartFile file) {
    try {
        Map<String, Object> result = ocrService.extractLineItems(file);
        return ResponseEntity.ok(result);
    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError().build();
    }
}

}

package com.bropay.broPayApi.controller;


import java.io.File;
import java.util.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.service.OcrService;

@RestController
@RequestMapping("/api/receipts")
public class ReceiptController {
    
    @Autowired
    private OcrService ocrService;

    @PostMapping("/upload")
    public ResponseEntity<List<LineItemDTO>> uploadReceipt(@RequestParam("file") MultipartFile file) {
        try {
            File tempFile = File.createTempFile("receipt", file.getOriginalFilename());
            file.transferTo(tempFile);

            List<LineItemDTO> items = ocrService.extractLineItems(tempFile);
            tempFile.delete();

            return ResponseEntity.ok(items);

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}

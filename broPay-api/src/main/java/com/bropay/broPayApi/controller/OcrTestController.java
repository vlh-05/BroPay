package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.service.OcrService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.util.*;

@RestController
@RequestMapping("/api/ocr")
public class OcrTestController {

    @Autowired
    private OcrService ocrService;

    @GetMapping("/test")
    public String testOcr() {
        try (InputStream inputStream = getClass().getResourceAsStream("/Receipt1.png")) {
            if (inputStream == null) {
                return "OCR Failed: Image file not found in resources!";
            }

            // Copy resource to temporary file
            File tempFile = File.createTempFile("ocr-image", ".png");
            try (OutputStream outStream = new FileOutputStream(tempFile)) {
                inputStream.transferTo(outStream);
            }

            return ocrService.extractTextFromImage(tempFile);

        } catch (IOException e) {
            e.printStackTrace();
            return "OCR Failed: " + e.getMessage();
        }
    }

    @PostMapping("/test")
    public ResponseEntity<List<LineItemDTO>> uploadAndOcr(@RequestParam("file") MultipartFile file) {
    try {
        // Save uploaded file to temp location
        File tempFile = File.createTempFile("upload", file.getOriginalFilename());
        file.transferTo(tempFile);

        // Use your OCR + parsing logic
        List<LineItemDTO> items = ocrService.extractLineItems(tempFile);

        // Clean up
        tempFile.delete();

        return ResponseEntity.ok(items);

    } catch (Exception e) {
        e.printStackTrace();
        return ResponseEntity.internalServerError().build();
    }
}
}

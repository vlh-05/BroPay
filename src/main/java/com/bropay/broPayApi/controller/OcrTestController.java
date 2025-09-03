package com.bropay.broPayApi.controller;

import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.bropay.broPayApi.dto.Base64ImageDTO;
import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.service.OcrService;

@RestController
@RequestMapping("/api/ocr")
public class OcrTestController {

    @Autowired
    private OcrService ocrService;

    // @GetMapping("/test")
    // public String testOcr() throws Exception {
    //     try (InputStream inputStream = getClass().getResourceAsStream("/Receipt1.png")) {
    //         if (inputStream == null) {
    //             return "OCR Failed: Image file not found in resources!";
    //         }

    //         // Copy resource to temporary file
    //         File tempFile = File.createTempFile("ocr-image", ".png");
    //         try (OutputStream outStream = new FileOutputStream(tempFile)) {
    //             inputStream.transferTo(outStream);
    //         }

    //         // Convert File to MultipartFile
    //         try (InputStream fileInputStream = new FileInputStream(tempFile)) {
    //             MultipartFile multipartFile = new MockMultipartFile(
    //                 tempFile.getName(),
    //                 tempFile.getName(),
    //                 "image/png",
    //                 fileInputStream
    //             );

    //             return ocrService.extractTextFromImage(multipartFile);
    //         }

    //     } catch (IOException e) {
    //         e.printStackTrace();
    //         return "OCR Failed: " + e.getMessage();
    //     }
    // }

    @GetMapping("/test")
public ResponseEntity<Map<String, String>> testOcr() throws Exception{
    Map<String, String> result = new HashMap<>();
    try (InputStream inputStream = getClass().getResourceAsStream("/Receipt1.png")) {
        if (inputStream == null) {
            result.put("error", "OCR Failed: Image file not found in resources!");
            return ResponseEntity.badRequest().body(result);
        }

        File tempFile = File.createTempFile("ocr-image", ".png");
        try (OutputStream outStream = new FileOutputStream(tempFile)) {
            inputStream.transferTo(outStream);
        }

        try (InputStream fileInputStream = new FileInputStream(tempFile)) {
            MultipartFile multipartFile = new MockMultipartFile(
                tempFile.getName(),
                tempFile.getName(),
                "image/png",
                fileInputStream
            );

            String text = ocrService.extractTextFromImage(multipartFile);
            result.put("text", text);
            return ResponseEntity.ok(result);
        }

    } catch (IOException e) {
        e.printStackTrace();
        result.put("error", "OCR Failed: " + e.getMessage());
        return ResponseEntity.internalServerError().body(result);
    }
}


    @PostMapping("/test")
    public ResponseEntity<Map<String, Object>> uploadAndOcr(@RequestParam("file") MultipartFile file) {
        try {
            Map<String, Object> result = ocrService.extractLineItems(file);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            e.printStackTrace();
            Map<String, Object> error = new HashMap<>();
            error.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(error);
        }
    }

    @PostMapping("/base64")
    public ResponseEntity<?> extractFromBase64(@RequestBody Map<String, String> payload) {
        try {
            String base64String = payload.get("base64");
            if (base64String == null || base64String.isBlank()) {
                return ResponseEntity.badRequest().body("Missing 'base64' field in request");
            }

            // Decode base64 string
            byte[] imageBytes = Base64.getDecoder().decode(base64String);

            // Create MultipartFile from byte array
            MultipartFile multipartFile = new MockMultipartFile(
                "file",
                "uploaded-image.png",
                "image/png",
                new ByteArrayInputStream(imageBytes)
            );

            // OCR processing
            Map<String, Object> result = ocrService.extractLineItems(multipartFile);

            return ResponseEntity.ok(result);

        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Invalid Base64 input: " + e.getMessage());
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("OCR Error: " + e.getMessage());
        }
    }
    // @PostMapping("/parseBase64")
    // public ResponseEntity<Map<String, Object>> parseBase64(@RequestBody Base64ImageDTO input) {
    //     String filename = input.getFilename() != null ? input.getFilename() : "image.jpg";
    //     String contentType = "image/jpeg";

    //     List<LineItemDTO> items = ocrService.extractLineItemsFromBase64(
    //         input.getBase64Image(), filename, contentType
    //     );

    //     Map<String, Object> result = new HashMap<>();
    //     result.put("items", items);
    //     result.put("totalItems", items != null ? items.size() : 0);
    //     result.put("extractedItems", items != null ? items.size() : 0);

    //     // ✅ Add totalAmount calculation here
    //     double totalAmount = 0.0;
    //     for (LineItemDTO item : items) {
    //         try {
    //             String price = item.getPrice().replaceAll("[^0-9.]", "");
    //             if (!price.isBlank()) {
    //                 totalAmount += Double.parseDouble(price);
    //             }
    //         } catch (Exception ignored) {}
    //     }
    //     result.put("totalAmount", totalAmount);

    //     if (items == null || items.isEmpty()) {
    //         result.put("message", "No line items extracted from the receipt.");
    //     } else {
    //         result.put("message", "Line items extracted successfully.");
    //     }

    //     return ResponseEntity.ok(result);
    // }
    @PostMapping("/parseBase64")
    public ResponseEntity<Map<String, Object>> parseBase64(@RequestBody Base64ImageDTO input) {
    String filename = input.getFilename() != null ? input.getFilename() : "image.jpg";
    String contentType = "image/jpeg";

    // ✅ Let service return everything, including totalAmount
    Map<String, Object> result = ocrService.extractLineItemsFromBase64Full(input.getBase64Image(), filename, contentType);
    return ResponseEntity.ok(result);
}

}

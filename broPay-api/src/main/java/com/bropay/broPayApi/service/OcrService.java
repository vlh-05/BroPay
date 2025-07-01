package com.bropay.broPayApi.service;

import net.sourceforge.tess4j.Tesseract;
import net.sourceforge.tess4j.TesseractException;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.dto.LineItemDTO;

import java.io.File;
import java.util.*;

@Service
public class OcrService {

    public String extractTextFromImage(File imageFile) {
        Tesseract tesseract = new Tesseract();

        // Step 1: Set path to trained data
        tesseract.setDatapath("/opt/homebrew/Cellar/tesseract/5.5.1/share/tessdata");

        // Step 2: Fix for native library
        System.setProperty("jna.library.path", "/opt/homebrew/Cellar/tesseract/5.5.1/lib");

        try {
            return tesseract.doOCR(imageFile);
        } catch (TesseractException e) {
            e.printStackTrace();
            return "OCR Failed: " + e.getMessage();
        }
    }
    public List<LineItemDTO> extractLineItems(File imageFile) {
        List<LineItemDTO> items = new ArrayList<>();

        try {
            String text = extractTextFromImage(imageFile);
            String[] lines = text.split("\\r?\\n");

            for (String line : lines) {
                line = line.trim();

                // Skip empty or irrelevant lines
                if (line.isEmpty()) continue;

                // Match lines ending in price like "$1.75"
                if (line.matches(".*\\$\\d+(\\.\\d{2})?$")) {
                    String[] parts = line.split("\\$");
                    String pricePart = parts[parts.length - 1].trim();
                    String descPart = line.replaceAll("\\$" + pricePart + "$", "").trim();

                    // Skip non-item lines
                    if (descPart.matches("(?i).*(amount|total|tax|savings|summary).*")) continue;

                    // Fix common OCR issues
                    descPart = descPart.replaceAll("[|]", "l");
                    descPart = descPart.replaceAll("(?i)Ib", "lb");

                    try {
                        double price = Double.parseDouble(pricePart);
                        items.add(new LineItemDTO(descPart, price));
                    } catch (NumberFormatException ignored) {}
                }
            }

        } catch (Exception e) {
            e.printStackTrace();
        }

        return items;
    }


}

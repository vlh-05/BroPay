package com.bropay.broPayApi.service;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.util.Base64DecodedMultipartFile;
import com.google.api.gax.core.FixedCredentialsProvider;
import com.google.auth.oauth2.GoogleCredentials;
import com.google.cloud.vision.v1.AnnotateImageRequest;
import com.google.cloud.vision.v1.BatchAnnotateImagesResponse;
import com.google.cloud.vision.v1.Feature;
import com.google.cloud.vision.v1.Image;
import com.google.cloud.vision.v1.ImageAnnotatorClient;
import com.google.cloud.vision.v1.ImageAnnotatorSettings;
import com.google.protobuf.ByteString;






@Service
public class OcrService {

   

    // Enhanced regex patterns for different receipt formats
        private static final Pattern WALMART_WEIGHT_PATTERN = Pattern.compile("(\\d+\\.\\d+)\\s*lb\\s*@\\s*\\d+\\.\\d+\\s*lb\\s*/(\\d+\\.\\d{2})");
    private static final Pattern WALMART_QUANTITY_PATTERN = Pattern.compile("(\\d+)\\s*AT\\s*\\d+\\s*FOR\\s*(\\d+\\.\\d{2})");
    private static final Pattern GROCERY_WEIGHT_PATTERN = Pattern.compile("(\\d+\\.\\d+)lb");
    private static final Pattern SIMPLE_PRICE_PATTERN = Pattern.compile("\\$?(\\d+\\.\\d{2})");
    private static final Pattern QUANTITY_PRICE_PATTERN = Pattern.compile("(\\d+)\\s+\\$?(\\d+\\.\\d{2})");
    private static final Pattern TOTAL_PATTERN = Pattern.compile("(?i)(?:total|amount|sum)\\s*:?\\s*\\$?(\\d+\\.\\d{2})");
    private static final Pattern PRICE_WITH_QUANTITY_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*@\\s*\\$?(\\d+\\.\\d{2})");
    private static final Pattern SINGLE_LINE_ITEM_PATTERN = Pattern.compile("^(.+?)\\s+\\$?(\\d+\\.\\d{2})$");

   @Autowired
private OpenAIChatClient openAIChatClient;

    public Map<String, Object> extractLineItems(MultipartFile file) {
    System.out.println("🔥 extractLineItems() method was called");
    List<LineItemDTO> items = new ArrayList<>();
    double totalAmount = 0.0;
    Map<String, Object> result = new HashMap<>();

    try {
        // Load credentials for Google Vision API
        GoogleCredentials credentials = GoogleCredentials.fromStream(
            new FileInputStream(System.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
        );
        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
            .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
            .build();

        // OCR processing using Vision API
        try (ImageAnnotatorClient vision = ImageAnnotatorClient.create(settings)) {
            ByteString imgBytes = ByteString.readFrom(file.getInputStream());
            Image img = Image.newBuilder().setContent(imgBytes).build();
            Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();

            BatchAnnotateImagesResponse response = vision.batchAnnotateImages(List.of(request));
            if (response.getResponses(0).hasError()) {
                throw new RuntimeException("OCR Error: " + response.getResponses(0).getError().getMessage());
            }

            // Extract OCR text
            String ocrText = response.getResponses(0).getFullTextAnnotation().getText();
            String[] rawLines = ocrText.split("\\r?\\n");

            // Debug: print sample OCR output
            System.out.println("OCR Text Preview:\n" + ocrText.substring(0, Math.min(300, ocrText.length())));

            // Try OpenAI GPT extraction first
            items = openAIChatClient.extractLineItemsFromText(ocrText);
            System.out.println("AI Extracted Items: " + (items == null ? "null" : items.size()));

            totalAmount = openAIChatClient.extractTotalAmountFromText(ocrText);
            System.out.println("✅ Extracted or Calculated Total Amount: " + totalAmount);

            // ✅ Run fallback only if AI failed
            if (items == null || items.isEmpty()) {
                System.out.println("⚠️ AI returned empty — running fallback parser...");

                List<String> cleanLines = preprocessLines(rawLines);
                items = new ArrayList<>();

                String pendingDesc = null;
                Double pendingPrice = null;
                Double pendingQty = null;

                for (String line : cleanLines) {
                    line = line.trim();
                    if (line.isEmpty()) continue;

                    // ❌ Skip common noise lines
                    if (line.equalsIgnoreCase("Regular Price") ||
                        line.toLowerCase().endsWith("/each") ||
                        line.toLowerCase().endsWith("/lb") ||
                        line.equalsIgnoreCase("QTY") ||
                        line.equalsIgnoreCase("FINAL PRICE") ||
                        line.equalsIgnoreCase("ITEM NAME") ||
                        line.equalsIgnoreCase("PRODUCE") ||
                        line.equalsIgnoreCase("BAG") ||
                        line.equalsIgnoreCase("YELLOW") ||
                        line.equalsIgnoreCase("M")) {
                        continue;
                    }

                    // 📌 Detect description
                    if (line.matches(".*[a-zA-Z].*") && !line.matches(".*\\$\\d.*")) {
                        if (pendingDesc != null && (pendingPrice != null || pendingQty != null)) {
                            pendingDesc = null;
                            pendingPrice = null;
                            pendingQty = null;
                        }

                        pendingDesc = line;
                        continue;
                    }

                    // 📌 Detect price
                    if (line.matches("\\$?\\d+(\\.\\d{1,2})?")) {
                        try {
                            double price = Double.parseDouble(line.replace("$", ""));
                            if (pendingPrice == null) {
                                pendingPrice = price;
                            }
                        } catch (NumberFormatException ignored) {}
                        continue;
                    }

                    // 📌 Detect quantity
                    if (line.matches("\\d+(\\.\\d+)?")) {
                        try {
                            double qty = Double.parseDouble(line);
                            if (pendingQty == null) {
                                pendingQty = qty;
                            }
                        } catch (NumberFormatException ignored) {}
                        continue;
                    }

                    // ✅ Save item if all parts collected
                    if (pendingDesc != null && pendingPrice != null && pendingQty != null) {
                        System.out.println("✅ Found item: " + pendingDesc + " | $" + pendingPrice + " | qty=" + pendingQty);
                        LineItemDTO dto = new LineItemDTO();
                        dto.setDescription(pendingDesc);
                        dto.setPrice(String.valueOf(pendingPrice));
                        dto.setQuantity(String.valueOf(pendingQty));
                        items.add(dto);

                        pendingDesc = null;
                        pendingPrice = null;
                        pendingQty = null;
                    }
                }

                // 🧹 Save last item if loop ends with one
                if (pendingDesc != null && pendingPrice != null && pendingQty != null) {
                    LineItemDTO dto = new LineItemDTO();
                    dto.setDescription(pendingDesc);
                    dto.setPrice(String.valueOf(pendingPrice));
                    dto.setQuantity(String.valueOf(pendingQty));
                    items.add(dto);
                }
            }

           if ((totalAmount == 0.0 || Double.isNaN(totalAmount)) && items != null && !items.isEmpty()) {
    double fallbackAmount = calculateTotalAmount(items);
    System.out.println("🛠️ GPT failed, fallback total calculated manually: " + fallbackAmount);
    totalAmount = fallbackAmount;
}




            result.put("items", items);
            result.put("totalItems", items.size());
            result.put("extractedItems", items.size());
            result.put("message", "Line items extracted successfully.");
            result.put("totalAmount", totalAmount);

        }
    } catch (Exception e) {
        e.printStackTrace();
        result.put("message", "OCR or extraction failed: " + e.getMessage());
        result.put("items", List.of());
        result.put("totalItems", 0);
        result.put("extractedItems", 0);
        result.put("totalAmount", 0);
    }
    System.out.println("🧾 Final Result: " + result);

    return result;
}



    
private List<String> preprocessLines(String[] rawLines) {
        List<String> cleanLines = new ArrayList<>();
        boolean inItemSection = false;
        for (String line : rawLines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            if (!inItemSection && isHeaderLine(trimmed)) continue;
            if (!inItemSection && isPotentialItemLine(trimmed)) inItemSection = true;
            if (inItemSection && isFooterLine(trimmed)) break;
            if (inItemSection) {
                String cleanedLine = cleanItemLine(trimmed);
                if (!cleanedLine.isEmpty()) cleanLines.add(cleanedLine);
            }
        }
        return cleanLines;
    }
    
    private String cleanItemLine(String line) {
        // Remove extra spaces and normalize
        line = line.replaceAll("\\s+", " ");
        
        // Remove common receipt artifacts
        line = line.replaceAll("[*]{2,}", "");
        line = line.replaceAll("[=]{2,}", "");
        line = line.replaceAll("[-]{2,}", "");
        
        return line.trim();
    }
    
    private boolean isHeaderLine(String line) {
        String lowerLine = line.toLowerCase();
        return lowerLine.matches(".*(?:walmart|save money|live better|st#|te#|tr#|manager|cashier|refund|store|address|phone).*")
                || line.matches(".*\\d{5}(-\\d{4})?$") // ZIP codes
                || line.matches("^\\d{5,}$") // Store numbers
                || lowerLine.matches(".*(?:date|time|receipt|transaction).*");
    }
    
    private boolean isPotentialItemLine(String line) {
        // Must contain letters (product name) and should not be header/footer
        return line.matches(".*[a-zA-Z]{2,}.*") && 
               !isHeaderLine(line) && 
               !isFooterLine(line) &&
               !line.matches("^\\d+$") && // Not just numbers
               !line.matches("^\\$?\\d+\\.\\d{2}$"); // Not just a price
    }
    
    private boolean isFooterLine(String line) {
        String lowerLine = line.toLowerCase();
        return lowerLine.matches(".*(?:subtotal|total|tax|change|cash|credit|debit|visa|mastercard|amex|thank you|payment|balance|summary|items sold).*")
                || line.matches("^[=#*\\-]{3,}$")
                || lowerLine.matches(".*(?:card|authorization|reference).*");
    }
    
    private List<LineItemDTO> parseLineItems(List<String> lines) {
    List<LineItemDTO> items = new ArrayList<>();
    Set<Integer> usedIndices = new HashSet<>();

    for (int i = 0; i < lines.size(); i++) {
        String itemLine = lines.get(i);

        if (!isProductName(itemLine) || usedIndices.contains(i)) continue;

        for (int j = i + 1; j < Math.min(lines.size(), i + 6); j++) {
            String nextLine = lines.get(j);

            // Skip UPC-looking lines
            if (nextLine.matches("^\\d{10,}\\s*[F]?$")) continue;

            // Match price
            if (nextLine.matches("^\\$?\\d+\\.\\d{2}$") && !usedIndices.contains(j)) {
                try {
                    double price = Double.parseDouble(nextLine.replace("$", ""));
                    items.add(new LineItemDTO(cleanDescription(itemLine), String.valueOf(price), "1"));
                    usedIndices.add(i);
                    usedIndices.add(j);
                } catch (NumberFormatException ignored) {}
                break; // Found price for this item
            }
        }
    }

    return items;
}




    
    private LineItemDTO parseSingleLineItem(String line) {
        // Try to parse items that have name and price on the same line
        Matcher matcher = SINGLE_LINE_ITEM_PATTERN.matcher(line);
        
        if (matcher.find()) {
            String description = matcher.group(1).trim();
            String priceStr = matcher.group(2);
            
            // Validate it's a product name (not just numbers or codes)
            if (description.matches(".*[a-zA-Z]{2,}.*") && !description.matches("^\\d+$")) {
                try {
                    double price = Double.parseDouble(priceStr);
                    return new LineItemDTO(cleanDescription(description), String.valueOf(price), "1");
                } catch (NumberFormatException e) {
                    // Continue
                }
            }
        }
        
        return null;
    }
    
    private boolean shouldSkipLine(String line) {
        return line.matches("^\\d+$") || // Just numbers
               line.matches("^\\$?\\d+\\.\\d{2}$") || // Just price
               line.matches("^[A-Z0-9]{10,}\\s*[FT]?$") || // Product codes
               line.toLowerCase().matches(".*(?:regular price|sale price|you save|savings).*");
    }
    
    private int findNextItemStart(List<String> lines, int currentIndex) {
        for (int i = currentIndex + 1; i < lines.size(); i++) {
            if (isProductName(lines.get(i))) {
                return i;
            }
        }
        return lines.size();
    }
    
    private LineItemDTO parseItemFromContext(List<String> lines, int startIndex) {
    if (startIndex >= lines.size()) return null;
    String itemName = lines.get(startIndex);

    // ❌ Improved filter to block header-style lines like 'Tbd Mgr. Tbd'
    if (!isProductName(itemName)) return null;

    // 🔎 Try known structured patterns first
    for (int i = startIndex + 1; i < Math.min(startIndex + 6, lines.size()); i++) {
        String line = lines.get(i);

        LineItemDTO item;
        item = parseWalmartWeightPrice(itemName, line);
        if (item != null) return item;

        item = parseWalmartQuantityPrice(itemName, line);
        if (item != null) return item;

        item = parseGroceryStoreItem(itemName, lines, i);
        if (item != null) return item;

        item = parseSimplePrice(itemName, line);
        if (item != null) return item;

        item = parseQuantityPrice(itemName, line);
        if (item != null) return item;

        item = parsePriceWithQuantity(itemName, line);
        if (item != null) return item;
    }

    // ✅ Final fallback: look for UPC followed by price — but scoped only to this item
    for (int j = startIndex + 1; j < Math.min(startIndex + 6, lines.size() - 1); j++) {
        String upcCandidate = lines.get(j);
        String priceCandidate = lines.get(j + 1);

        if (upcCandidate.matches("^\\d{10,}\\s*[F]?$") && priceCandidate.matches("^\\$?\\d+\\.\\d{2}$")) {
            try {
                double price = Double.parseDouble(priceCandidate.replace("$", ""));
                return new LineItemDTO(cleanDescription(itemName), priceCandidate.replace("$", ""), "1");

            } catch (NumberFormatException ignored) {}
        }
    }

    return null;
}



    
    private boolean isProductName(String line) {
    if (line.length() <= 2 || !line.matches(".*[a-zA-Z]{2,}.*")) return false;

    String lower = line.toLowerCase();
    return !lower.matches(".*(?:walmart|wal\\*mart|save money|live better|mgr|manager|charleston|store|visa|tc#|tr#|st#|te#|op#|change due|thank you|payment).*")
        && !line.matches("^\\$?\\d+\\.\\d{2}$")
        && !line.matches("^\\d{5,}$")
        && !line.matches("^\\d{10,}\\s*[FT]?$");
}

    
    private LineItemDTO parseWalmartWeightPrice(String itemName, String priceLine) {
        Matcher matcher = WALMART_WEIGHT_PATTERN.matcher(priceLine);
        
        if (matcher.find()) {
            String description = cleanDescription(itemName);
            double weight = Double.parseDouble(matcher.group(1));
            double totalPrice = Double.parseDouble(matcher.group(2));
            
            System.out.println("  Found Walmart weight item: " + description + " - " + weight + "lb - $" + totalPrice);
            return new LineItemDTO(description, String.valueOf(totalPrice), String.valueOf(weight));


        }
        return null;
    }
    
    private LineItemDTO parseWalmartQuantityPrice(String itemName, String priceLine) {
        Matcher matcher = WALMART_QUANTITY_PATTERN.matcher(priceLine);
        
        if (matcher.find()) {
            String description = cleanDescription(itemName);
            double quantity = Double.parseDouble(matcher.group(1));
            double totalPrice = Double.parseDouble(matcher.group(2));
            
            System.out.println("  Found Walmart quantity item: " + description + " - qty:" + quantity + " - $" + totalPrice);
            return new LineItemDTO(description, String.valueOf(totalPrice), String.valueOf(quantity));

        }
        return null;
    }
    
    private LineItemDTO parseGroceryStoreItem(String itemName, List<String> lines, int weightIndex) {
        if (weightIndex >= lines.size()) return null;
        
        String weightLine = lines.get(weightIndex);
        Matcher weightMatcher = GROCERY_WEIGHT_PATTERN.matcher(weightLine);
        
        if (weightMatcher.find()) {
            double weight = Double.parseDouble(weightMatcher.group(1));
            
            // Look for price in next few lines
            for (int i = weightIndex + 1; i < Math.min(weightIndex + 3, lines.size()); i++) {
                String line = lines.get(i);
                if (line.matches("\\$\\d+\\.\\d{2}")) {
                    try {
                        double price = Double.parseDouble(line.substring(1));
                        System.out.println("  Found grocery store item: " + itemName + " - " + weight + "lb - $" + price);
                        return new LineItemDTO(cleanDescription(itemName), String.valueOf(price), String.valueOf(weight));

                    } catch (NumberFormatException e) {
                        // Continue looking
                    }
                }
            }
        }
        return null;
    }
    
    private LineItemDTO parseSimplePrice(String itemName, String priceLine) {
        Matcher matcher = SIMPLE_PRICE_PATTERN.matcher(priceLine);
        
        if (matcher.find() && priceLine.matches("^\\$?\\d+\\.\\d{2}$")) {
            String priceStr = matcher.group(1);
            try {
                double price = Double.parseDouble(priceStr);
                return new LineItemDTO(cleanDescription(itemName), String.valueOf(price), "1");

            } catch (NumberFormatException e) {
                // Continue
            }
        }
        return null;
    }
    
    private LineItemDTO parseQuantityPrice(String itemName, String priceLine) {
        Matcher matcher = QUANTITY_PRICE_PATTERN.matcher(priceLine);
        
        if (matcher.find()) {
            try {
                double quantity = Double.parseDouble(matcher.group(1));
                double price = Double.parseDouble(matcher.group(2));
                return new LineItemDTO(cleanDescription(itemName), String.valueOf(price), String.valueOf(quantity));

            } catch (NumberFormatException e) {
                // Continue
            }
        }
        return null;
    }
    
    private LineItemDTO parsePriceWithQuantity(String itemName, String priceLine) {
        Matcher matcher = PRICE_WITH_QUANTITY_PATTERN.matcher(priceLine);
        
        if (matcher.find()) {
            try {
                double quantity = Double.parseDouble(matcher.group(1));
                double unitPrice = Double.parseDouble(matcher.group(2));
                double totalPrice = quantity * unitPrice;
                return new LineItemDTO(cleanDescription(itemName), String.valueOf(totalPrice), String.valueOf(quantity));

            } catch (NumberFormatException e) {
                // Continue
            }
        }
        return null;
    }
    
    private String cleanDescription(String description) {
        // Remove product codes and clean up description
        description = description.replaceAll("\\d{10,}", ""); // Remove long numeric codes
        description = description.replaceAll("\\s+", " "); // Normalize spaces
        description = description.trim();
        
        // Capitalize first letter of each word
        String[] words = description.toLowerCase().split("\\s+");
        StringBuilder cleaned = new StringBuilder();
        for (String word : words) {
            if (!word.isEmpty()) {
                cleaned.append(Character.toUpperCase(word.charAt(0)))
                       .append(word.substring(1))
                       .append(" ");
            }
        }
        
        return cleaned.toString().trim();
    }
    
    private double extractTotalAmount(String[] rawLines) {
        double total = 0.0;
        double maxFound = 0.0;

        Pattern keywordPattern = Pattern.compile(
            "(?i)(total(?!\\s+(items|savings))|amount\\s*paid|amount|sale|visa\\s*credit\\s*tend|paid)[^\\d]{0,20}(\\d{1,3}(?:[.,]\\d{2}))"
        );
        Pattern fallbackAmountPattern = Pattern.compile("(\\d{1,3}(?:[.,]\\d{2}))");

        for (int i = rawLines.length - 1; i >= 0; i--) {
            String line = rawLines[i].trim();
            System.out.println("Checking line for total: " + line);

            // Smart match: ignore "Total Savings", "Total Items", etc.
            Matcher matcher = keywordPattern.matcher(line);
            if (matcher.find()) {
                try {
                    double matchedValue = Double.parseDouble(matcher.group(2).replace(",", ""));
                    System.out.println("✅ Smart match: " + matcher.group(1) + " = " + matchedValue + " from line: " + line);
                    if (matchedValue > maxFound) {
                        maxFound = matchedValue;
                    }
                } catch (NumberFormatException e) {
                    System.err.println("❌ Error parsing smart matched total: " + matcher.group(2));
                }
            }
        }

        if (maxFound > 0.0) {
            return maxFound;
        }

        // Fallback only if smart matching fails
        for (int i = rawLines.length - 1; i >= 0; i--) {
            String line = rawLines[i].trim();
            Matcher fallbackMatcher = fallbackAmountPattern.matcher(line);
            if (fallbackMatcher.find()) {
                try {
                    double fallbackVal = Double.parseDouble(fallbackMatcher.group(1).replace(",", ""));
                    if (fallbackVal > total) {
                        total = fallbackVal;
                        System.out.println("⚠️ Fallback matched possible total from line: " + line);
                    }
                } catch (NumberFormatException e) {
                    System.err.println("❌ Error parsing fallback total: " + fallbackMatcher.group(1));
                }
            }
        }

        return total;
    }
 
    private void validateExtractedData(List<LineItemDTO> items, double totalAmount) {
        if (items.isEmpty()) {
            System.out.println("Warning: No items extracted from receipt");
        }
        
        double calculatedTotal = items.stream()
                .mapToDouble(dto -> Double.parseDouble(dto.getPrice()))
                .sum();
        
        System.out.println("Calculated total from items: $" + calculatedTotal);
        System.out.println("Extracted total from receipt: $" + totalAmount);
        
        if (totalAmount > 0 && Math.abs(calculatedTotal - totalAmount) > 1.0) {
            System.out.println("Warning: Significant difference between calculated and extracted totals");
        }
    }
    
   private List<LineItemDTO> extractItemsFromUpcBlocks(List<String> lines) {
    List<LineItemDTO> items = new ArrayList<>();

    for (int i = 1; i < lines.size() - 1; i++) {
        String currentLine = lines.get(i);
        String nextLine = lines.get(i + 1);

        // Look for UPC followed by price
        if (currentLine.matches("^\\d{10,}\\s*[F]?$") && nextLine.matches("^\\$?\\d+\\.\\d{2}$")) {
            double price;
            try {
                price = Double.parseDouble(nextLine.replace("$", ""));
            } catch (NumberFormatException e) {
                continue;
            }

            // Search upwards for the item name before the UPC
            for (int back = i - 1; back >= Math.max(0, i - 3); back--) {
                String possibleName = lines.get(back);
                if (isProductName(possibleName)) {
                    LineItemDTO item = new LineItemDTO(cleanDescription(possibleName), String.valueOf(price), "1");

                    items.add(item);
                    break;
                }
            }
        }
    }

    return items;
}

private List<LineItemDTO> parseUpcCenteredLineItems(List<String> lines) {
    List<LineItemDTO> items = new ArrayList<>();

    for (int i = 0; i < lines.size() - 1; i++) {
        String upcLine = lines.get(i);
        String priceLine = lines.get(i + 1);

        // UPC followed by price
        if (upcLine.matches("^\\d{10,}\\s*[F]?$") && priceLine.matches("^\\$?\\d+\\.\\d{2}$")) {
            // Look upward for product name
            for (int j = i - 1; j >= Math.max(0, i - 3); j--) {
                String possibleItem = lines.get(j);
                if (isProductName(possibleItem)) {
                    try {
                        double price = Double.parseDouble(priceLine.replace("$", ""));
                        items.add(new LineItemDTO(cleanDescription(possibleItem), String.valueOf(price), "1"));


                    } catch (NumberFormatException ignored) {}
                    break; // Found the closest item above the UPC
                }
            }
        }
    }

    return items;
}
public String extractTextFromImage(MultipartFile file) throws Exception {
    String credentialsPath = System.getenv("GOOGLE_APPLICATION_CREDENTIALS");
if (credentialsPath == null || credentialsPath.isEmpty()) {
    throw new IllegalStateException("Missing GOOGLE_APPLICATION_CREDENTIALS environment variable.");
}
GoogleCredentials credentials = GoogleCredentials.fromStream(new FileInputStream(credentialsPath));

    ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
            .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
            .build();

    try (ImageAnnotatorClient vision = ImageAnnotatorClient.create(settings)) {
        ByteString imgBytes = ByteString.readFrom(file.getInputStream());
        Image img = Image.newBuilder().setContent(imgBytes).build();
        Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
        AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                .addFeatures(feat)
                .setImage(img)
                .build();

        BatchAnnotateImagesResponse response = vision.batchAnnotateImages(List.of(request));
        if (response.getResponses(0).hasError()) {
            throw new RuntimeException("OCR Error: " + response.getResponses(0).getError().getMessage());
        }

        return response.getResponses(0).getFullTextAnnotation().getText();
    }
}

public List<LineItemDTO> extractLineItemsFromBase64(String base64Image, String filename, String contentType) {
    try {
        byte[] imageBytes = java.util.Base64.getDecoder().decode(base64Image);
        MultipartFile multipartFile = new Base64DecodedMultipartFile(imageBytes, filename, contentType);

        Map<String, Object> resultMap = extractLineItems(multipartFile);

        @SuppressWarnings("unchecked")
        List<LineItemDTO> items = (List<LineItemDTO>) resultMap.get("items");

        if (items == null) {
            throw new RuntimeException("OCR extraction returned null items");
        }

        return items;
    } catch (Exception e) {
        throw new RuntimeException("Failed to decode base64 and extract items: " + e.getMessage(), e);
    }
}





public String extractTextFromBase64(String base64Image) {
    try {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

        GoogleCredentials credentials = GoogleCredentials.fromStream(
                new FileInputStream(System.getenv("GOOGLE_APPLICATION_CREDENTIALS"))
        );
        ImageAnnotatorSettings settings = ImageAnnotatorSettings.newBuilder()
                .setCredentialsProvider(FixedCredentialsProvider.create(credentials))
                .build();

        try (ImageAnnotatorClient vision = ImageAnnotatorClient.create(settings)) {
            ByteString imgBytes = ByteString.copyFrom(imageBytes);
            Image img = Image.newBuilder().setContent(imgBytes).build();
            Feature feat = Feature.newBuilder().setType(Feature.Type.TEXT_DETECTION).build();
            AnnotateImageRequest request = AnnotateImageRequest.newBuilder()
                    .addFeatures(feat)
                    .setImage(img)
                    .build();

            BatchAnnotateImagesResponse response = vision.batchAnnotateImages(List.of(request));
            if (response.getResponses(0).hasError()) {
                throw new RuntimeException("OCR Error: " + response.getResponses(0).getError().getMessage());
            }

            return response.getResponses(0).getFullTextAnnotation().getText();
        }

    } catch (Exception e) {
        throw new RuntimeException("Failed to process base64 image: " + e.getMessage(), e);
    }
}

 
public Map<String, Object> extractLineItemsFromBase64Full(String base64Image, String filename, String contentType) {
    try {
        byte[] imageBytes = Base64.getDecoder().decode(base64Image);

        MultipartFile multipartFile = new MockMultipartFile(
            "file",
            filename,
            contentType,
            new ByteArrayInputStream(imageBytes)
        );

        // ✅ Call the central method that includes AI-based totalAmount logic
        Map<String, Object> result = extractLineItems(multipartFile);

        return result;

    } catch (Exception e) {
        e.printStackTrace();
        Map<String, Object> error = new HashMap<>();
        error.put("error", "OCR Failed: " + e.getMessage());
        return error;
    }
}


private double calculateTotalAmount(List<LineItemDTO> items) {
    double total = 0.0;
    for (LineItemDTO item : items) {
        try {
            String price = item.getPrice().replaceAll("[^0-9.]", "");
            if (!price.isBlank()) {
                total += Double.parseDouble(price);
            }
        } catch (Exception ignored) {}
    }
    return Math.round(total * 100.0) / 100.0; // ✅ round to 2 decimals
}


}


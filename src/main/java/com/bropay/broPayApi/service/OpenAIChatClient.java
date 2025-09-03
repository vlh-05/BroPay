package com.bropay.broPayApi.service;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.dto.LineItemDTO;
import com.bropay.broPayApi.dto.ReceiptResponseDTO;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.theokanning.openai.completion.chat.ChatCompletionRequest;
import com.theokanning.openai.completion.chat.ChatCompletionResult;
import com.theokanning.openai.completion.chat.ChatMessage;
import com.theokanning.openai.service.OpenAiService;

import io.github.cdimascio.dotenv.Dotenv;

@Service
public class OpenAIChatClient {
    @Autowired
private OpenAiService openAiService;

    private static final Dotenv dotenv = Dotenv.load();
    private static final String API_KEY = System.getenv("OPENAI_API_KEY");

    private static final String ENDPOINT = "https://api.openai.com/v1/chat/completions";

    private final ObjectMapper mapper = new ObjectMapper();

    

    public List<LineItemDTO> extractLineItemsFromText(String rawText) {
    String prompt = """
                    You are an intelligent receipt parser.

                    Extract only the purchased line items from the following OCR receipt text. Each item may appear across multiple lines — for example:

                    Item Name  
                    $Price  
                    Quantity

                    Your goal is to return only purchased items, each with:
                    - "description": the full item name as-is (capitalize and combine multi-line names if needed)
                    - "price": numeric total item price (e.g., 2.99 — no $ sign)
                    - "quantity": numeric value (e.g., 1.0, 2.5). If missing, default to 1.0
                    - "totalAmount": The final amount paid by the customer. Look for fields like "Amount", "Total", "Bill", or similar that include **taxes and other charges**. 
                    - If multiple totals are found (e.g. subtotal and final amount), choose the **larger one**, indicating total with tax.
                    - For example, if "Total: $10.05" and "Tax: $0.23" are present, and "Amount: $10.28" appears later, then the correct totalAmount is **$10.28**.
                    ⚠️ If multiple monetary values appear, always use the **final payable amount** after all taxes, even if it’s labeled as "Amount", not "Total".

                    Example:
                    ...
                    Total: $10.05  
                    Tax: $0.23  
                    Amount: $10.28  
                    => totalAmount = 10.28


                    ❌ DO NOT include:
                    - Payment info (Visa, Mastercard, Debit, Credit)
                    - Barcode numbers, reference numbers, authorization codes
                    - Lines like: "Regular Price", "Subtotal", "Tax", "Total", "Summary"
                    - Lines like: "QTY", "FINAL PRICE", "ITEM NAME", "PRODUCE"
                    - ❗ Do not remove words like "YELLOW", "BAG", or other color/packaging descriptors if they are part of the item name
                    - ✅ Preserve item descriptions exactly as written in the receipt

                    ✅ Return only this exact JSON format:
                    {
                    "totalAmount": 5.75,
                    "totalItems": 2,
                    "items": [
                        {
                            "description": "Sunflower Seeds R/S Flat",
                            "price": 2.99,
                            "quantity": 1.0
                        },
                        {
                            "description": "Yellow Onions Bag",
                            "price": 2.76,
                            "quantity": 1.0
                        }
                    ]
                }

                Strict rule: Each item must be a separate entry with its own name, quantity (default 1.0), and price. Do not merge items. 
                If two known item names are combined on a single line (like "Toilet Paper Baby Wipes"), treat them as separate items and
                attempt to assign prices based on the line below or total.
                Examples:
                Input: "Toilet Paper Baby Wipes" and below it "8.84"
                Output:
                - Toilet Paper — Price: 8.84
                - Baby Wipes — Price: 2.99 (assumed or inferred from total)

                    Receipt:
                    %s
                    """.formatted(rawText);


    try {
            ChatCompletionRequest chatRequest = ChatCompletionRequest.builder()
                .model("gpt-4o")
                .messages(List.of(
                    new ChatMessage("system", "You are a strict JSON parser. Output only valid JSON objects."),
                    new ChatMessage("user", prompt)
                ))
                .temperature(0.2)
                .maxTokens(800)
                .build();

            ChatCompletionResult result = openAiService.createChatCompletion(chatRequest);
            String content = result.getChoices().get(0).getMessage().getContent();
            content = content.replaceAll("(?s)```json|```", "").trim();

            // ✅ Parse full response into DTO
            ReceiptResponseDTO dto = mapper.readValue(content, ReceiptResponseDTO.class);

// ✅ Add this block here
if (dto.getTotalAmount() == 0.0 && dto.getItems() != null) {
    double calculatedTotal = dto.getItems().stream()
        .mapToDouble(i -> Double.parseDouble(i.getPrice()))
        .sum();
    dto.setTotalAmount(calculatedTotal);
}

// Optional logging
System.out.println("✅ Extracted or Calculated Total Amount: " + dto.getTotalAmount());

return dto.getItems();  // still returning List<LineItemDTO> as per method signature


        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Double extractTotalAmountFromText(String rawText) {
    try {
        String prompt = """
        You are an intelligent OCR assistant. Extract the final payable amount from this receipt text. 
        Ignore subtotal, taxes, discounts, and only return the final amount to be paid. 
        The amount may be labeled as 'Total', 'Amount Due', 'Amount', 'Bill', etc. 
        Do not explain. Just return the number.

        Receipt:
        %s
        """.formatted(rawText);

        ChatCompletionRequest request = ChatCompletionRequest.builder()
            .model("gpt-4")
            .messages(List.of(new ChatMessage("user", prompt)))
            .temperature(0.0)
            .maxTokens(10)
            .build();

        ChatCompletionResult result = openAiService.createChatCompletion(request);
        String answer = result.getChoices().get(0).getMessage().getContent().trim();

        return Double.parseDouble(answer.replaceAll("[^\\d.]", ""));
    } catch (Exception e) {
        System.err.println("⚠️ Failed to extract total amount: " + e.getMessage());
        return 0.0;
    }
}
}

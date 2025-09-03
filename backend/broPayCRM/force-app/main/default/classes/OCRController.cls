public with sharing class OCRController {
    @AuraEnabled
    public static ReceiptWrapper createReceipt(String base64Image) {
        // 🔧 Simulated response for now — replace with real OCR API later
        ReceiptWrapper result = new ReceiptWrapper();
        result.message = 'Simulated OCR complete. (Base64 image received)';
        return result;
    }

    public class ReceiptWrapper {
        @AuraEnabled public String message;
    }
}

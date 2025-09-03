public with sharing class ChatMessageController {

    @AuraEnabled(cacheable=true)
    public static List<Chat_Message__c> getMessages(Id expenseSplitId) {
        return [
            SELECT Id, Message_Text__c, Timestamp__c, Sender__r.Name 
            FROM Chat_Message__c 
            WHERE Expense_Split__c = :expenseSplitId
            ORDER BY Timestamp__c ASC
        ];
    }

    @AuraEnabled
    public static void sendMessage(String messageText, Id expenseSplitId) {
        Chat_Message__c msg = new Chat_Message__c();
        msg.Message_Text__c = messageText;
        msg.Timestamp__c = System.now();
        msg.Sender__c = UserInfo.getUserId();
        msg.Expense_Split__c = expenseSplitId;

        insert msg;
    }
}
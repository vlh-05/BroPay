import { LightningElement, api, track } from 'lwc';
import sendMessage from '@salesforce/apex/ChatMessageController.sendMessage';
import getMessages from '@salesforce/apex/ChatMessageController.getMessages';

export default class ChatMessageBox extends LightningElement {
    @api expenseSplitId;
    @track newMessage = '';
    @track messages = [];

    connectedCallback() {
        this.loadMessages();
    }

    loadMessages() {
        getMessages({ expenseSplitId: this.expenseSplitId })
            .then(result => {
                this.messages = result;
            })
            .catch(error => {
                console.error('Error loading messages:', error);
            });
    }

    handleInputChange(event) {
        this.newMessage = event.target.value;
    }

    handleSend() {
        if (!this.newMessage) {
            console.log('No message entered.');
            return;
        }

        // FIXED: Call method with 2 arguments instead of 1 object
        sendMessage(this.newMessage, this.expenseSplitId)
            .then(() => {
                this.newMessage = '';
                this.loadMessages();
            })
            .catch(error => {
                console.error('Send failed:', error);
            });
    }
}

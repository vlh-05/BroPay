import { LightningElement, track } from 'lwc';
import createReceipt from '@salesforce/apex/OCRController.createReceipt';

export default class OcrReceiptUploader extends LightningElement {
    @track fileData;
    @track ocrResult;

    handleFileChange(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                this.fileData = {
                    filename: file.name,
                    base64: reader.result.split(',')[1]
                };
            };
            reader.readAsDataURL(file);
        }
    }

    async handleUpload() {
        if (!this.fileData) return;

        try {
            const result = await createReceipt({ base64Image: this.fileData.base64 });
            this.ocrResult = result.message;
        } catch (error) {
            console.error('Error:', error);
            this.ocrResult = 'Failed to process receipt.';
        }
    }
}

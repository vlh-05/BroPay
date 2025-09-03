package com.bropay.broPayApi.dto;

public class Base64ImageDTO {
    private String filename;
    private String base64Image;

    public String getFilename() { return filename; }
    public void setFilename(String filename) { this.filename = filename; }

    public String getBase64Image() { return base64Image; }
    public void setBase64Image(String base64Image) { this.base64Image = base64Image; }
}

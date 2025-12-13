package com.bropay.broPayApi.repository;

import com.bropay.broPayApi.model.Receipt;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ReceiptRepository extends MongoRepository<Receipt, String> {
    
    // Count how many receipts were created by a specific user
    int countByCreatedBy(String createdBy);

    // Optional: Retrieve all receipts by user if needed later
    List<Receipt> findByCreatedBy(String createdBy);
}

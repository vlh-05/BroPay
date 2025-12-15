package com.bropay.broPayApi.repository;

import java.util.List;

import org.springframework.data.mongodb.repository.MongoRepository;

import com.bropay.broPayApi.model.Payment;

public interface PaymentRepository extends MongoRepository<Payment, String> {
    List<Payment> findByPayer(String payer);

    List<Payment> findByReceiver(String receiver);

    List<Payment> findByPayerOrderByTimestampDesc(String payer);

    List<Payment> findByReceiverOrderByTimestampDesc(String receiver);
}

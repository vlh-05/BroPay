package com.bropay.broPayApi.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.bropay.broPayApi.model.Payment;
import com.bropay.broPayApi.repository.PaymentRepository;

@Service
public class PaymentService {

    @Autowired
    private PaymentRepository paymentRepository;

    /**
     * 💳 Process a payment based on its method.
     * Adds timestamp, status, and saves the record in DB.
     */
    public Payment processPayment(Payment payment) {
        if (payment.getPaymentMethod() == null || payment.getPaymentMethod().isBlank()) {
            payment.setStatus("FAILED");
            return paymentRepository.save(payment);
        }

        payment.setStatus("PENDING");
        payment.setTimestamp(LocalDateTime.now()); // ✅ ensure timestamp always set

        // ✅ Handle different payment methods
        switch (payment.getPaymentMethod().toUpperCase()) {
            case "GPAY":
                // Later: integrate UPI intent or Google Pay API
                payment.setStatus("SUCCESS");
                break;

            case "DEBIT_CARD":
            case "CREDIT_CARD":
                // Later: integrate Stripe, Razorpay, or PayPal API
                payment.setStatus("SUCCESS");
                break;

            case "ZELLE":
                // Later: integrate Plaid or bank API for Zelle
                payment.setStatus("SUCCESS");
                break;

            case "CASH":
                // Manual transaction
                payment.setStatus("SUCCESS");
                break;

            default:
                payment.setStatus("FAILED");
                break;
        }

        return paymentRepository.save(payment);
    }

    /**
     * 📤 Fetch all payments made by the payer
     */
    public List<Payment> getPaymentsByPayer(String payer) {
        return paymentRepository.findByPayer(payer);
    }

    /**
     * 📥 Fetch all payments received by the receiver
     */
    public List<Payment> getPaymentsByReceiver(String receiver) {
        return paymentRepository.findByReceiver(receiver);
    }
}

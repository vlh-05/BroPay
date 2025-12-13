package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.model.Payment;
import com.bropay.broPayApi.service.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payment")
@CrossOrigin(origins = "*")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    /**
     * 💳 Processes a new payment request
     * Example POST request:
     * {
     *   "payer": "arya@example.com",
     *   "receiver": "haindu@example.com",
     *   "amount": 150.75,
     *   "paymentMethod": "GPAY"
     * }
     *
     * @param payment - Payment object with payer, receiver, amount, paymentMethod
     * @return saved Payment object with generated ID, status, and timestamp
     */
    @PostMapping("/process")
    public Payment processPayment(@RequestBody Payment payment) {
        return paymentService.processPayment(payment);
    }

    /**
     * 📜 Fetches all payments made by a specific payer
     * Example: GET /api/payment/payer/arya@example.com
     */
    @GetMapping("/payer/{payer}")
    public List<Payment> getPaymentsByPayer(@PathVariable String payer) {
        return paymentService.getPaymentsByPayer(payer);
    }

    /**
     * 🧾 Fetch all payments received by a specific receiver (optional, but useful for UI)
     * Example: GET /api/payment/receiver/haindu@example.com
     */
    @GetMapping("/receiver/{receiver}")
    public List<Payment> getPaymentsByReceiver(@PathVariable String receiver) {
        return paymentService.getPaymentsByReceiver(receiver);
    }
}

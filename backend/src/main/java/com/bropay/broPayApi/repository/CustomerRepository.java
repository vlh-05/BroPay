package com.bropay.broPayApi.repository;

import com.bropay.broPayApi.model.Customer;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface CustomerRepository extends MongoRepository<Customer, String> {
    Optional<Customer> findByEmail(String email);

    Optional<Customer> findByPhone(String phone);

    Optional<Customer> findByUsername(String username);

    Optional<Customer> findById(String userId1);
}
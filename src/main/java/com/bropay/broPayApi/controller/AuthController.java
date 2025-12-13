package com.bropay.broPayApi.controller;

import com.bropay.broPayApi.dto.RegisterRequest;
import com.bropay.broPayApi.dto.LoginRequest;
import com.bropay.broPayApi.model.User;
import com.bropay.broPayApi.model.Customer;
import com.bropay.broPayApi.repository.UserRepository;
import com.bropay.broPayApi.repository.CustomerRepository;
import com.bropay.broPayApi.security.JwtTokenUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth") // 🔑 Auth endpoints
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CustomerRepository customerRepository;

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    // ✅ Register a new user with name, email, password
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("❌ Email already exists");
        }

        // ✅ Create user for authentication
        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole("USER");
        userRepository.save(user);

        // ✅ Create customer for friend system
        Customer customer = new Customer();
        customer.setName(request.getName());
        customer.setEmail(request.getEmail());
        customer.setStatus("ACTIVE");
        customerRepository.save(customer);

        return ResponseEntity.ok("✅ User registered successfully");
    }

    // ✅ Login and return JWT token
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        return userRepository.findByEmail(request.getEmail())
                .map(user -> {
                    if (passwordEncoder.matches(request.getPassword(), user.getPassword())) {

                        // ✅ Check if customer exists
                        customerRepository.findByEmail(user.getEmail())
                                .orElseGet(() -> {
                                    Customer newCustomer = new Customer();
                                    newCustomer.setName(user.getName());
                                    newCustomer.setEmail(user.getEmail());
                                    newCustomer.setStatus("ACTIVE");
                                    return customerRepository.save(newCustomer);
                                });

                        String token = jwtTokenUtil.generateToken(
                                Long.valueOf(user.getId().hashCode()),
                                user.getEmail(),
                                user.getRole());
                        return ResponseEntity.ok(Map.of(
                                "token", token,
                                "name", user.getName(),
                                "email", user.getEmail(),
                                "role", user.getRole()));
                    } else {
                        return ResponseEntity.status(401).body("❌ Invalid password");
                    }
                })
                .orElse(ResponseEntity.status(401).body("❌ User not found"));
    }

}

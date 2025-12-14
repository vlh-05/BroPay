package com.bropay.broPayApi.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bropay.broPayApi.model.RecurringEntry;
import com.bropay.broPayApi.service.RecurringService;

@RestController
@RequestMapping("/api/recurring")
public class RecurringController {

    @Autowired
    private RecurringService recurringService;

    // Create new recurring schedule
    @PostMapping("/create")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<RecurringEntry> create(@RequestBody RecurringEntry entry) {
        // You can optionally override createdBy from security context later
        RecurringEntry saved = recurringService.create(entry);
        return ResponseEntity.ok(saved);
    }

    // Outgoing recurring: user is payer
    @GetMapping("/outgoing/{email}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<RecurringEntry>> getOutgoing(@PathVariable String email) {
        return ResponseEntity.ok(recurringService.getOutgoingForUser(email));
    }

    // Incoming recurring: user is receiver
    @GetMapping("/incoming/{email}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<RecurringEntry>> getIncoming(@PathVariable String email) {
        return ResponseEntity.ok(recurringService.getIncomingForUser(email));
    }

    // Pause a recurring schedule
    @PutMapping("/pause/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> pause(@PathVariable String id) {
        return recurringService.pause(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Resume a recurring schedule
    @PutMapping("/resume/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<?> resume(@PathVariable String id) {
        return recurringService.resume(id)
                .<ResponseEntity<?>>map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Delete a recurring schedule
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        recurringService.delete(id);
        return ResponseEntity.noContent().build();
    }
}

package com.bropay.broPayApi.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bropay.broPayApi.dto.SplitComputeRequestDTO;
import com.bropay.broPayApi.dto.SplitSummaryDTO;
import com.bropay.broPayApi.model.ExpenseSplit;
import com.bropay.broPayApi.repository.ExpenseSplitRepository;
import com.bropay.broPayApi.service.ExpenseSplitterService;
import com.bropay.broPayApi.service.NotificationService;

@RestController
@RequestMapping("/api/split")
@CrossOrigin(origins = "*")
public class SplitController {

    @Autowired
    private ExpenseSplitterService expenseSplitterService;

    @Autowired
    private ExpenseSplitRepository expenseSplitRepo;

    @Autowired
    private NotificationService notificationService;

    // ------------------------------------------------------
    // ✅ 1. PREVIEW SPLIT (compute only, not saved)
    // ------------------------------------------------------
    @PostMapping("/preview")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<SplitSummaryDTO>> previewSplit(@RequestBody SplitComputeRequestDTO request) {
        List<SplitSummaryDTO> result = expenseSplitterService.calculateSplits(
                request.getInitiatorId(),
                request.getLineItems(),
                request.getParticipants(),
                request.getSplitType(),
                request.getTax());
        return ResponseEntity.ok(result);
    }

    // ------------------------------------------------------
    // ✅ 2. SAVE CONFIRMED SPLIT (from frontend after preview)
    // ------------------------------------------------------
    @PostMapping("/save")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ExpenseSplit> saveSplit(@RequestBody ExpenseSplit split) {

        System.out.println("🔥 Incoming Split Payload => " + split);
        if (split.getParticipants() == null) {
            System.out.println("⚠️ Participants is NULL in the request body!");
        } else {
            System.out.println("✅ Participants received: " + split.getParticipants().size());
        }

        split.setStatus(split.getStatus() != null ? split.getStatus() : "PENDING");
        split.setCreatedAt(java.time.LocalDateTime.now());
        split.setUpdatedAt(java.time.LocalDateTime.now());
        ExpenseSplit saved = expenseSplitRepo.save(split);

        // 🔔 Notify participants
        if (saved.getParticipants() != null) {
            for (var p : saved.getParticipants()) {
                if (!p.getEmail().equalsIgnoreCase(saved.getInitiatorEmail())) {
                    notificationService.createNotification(
                            p.getEmail(),
                            "Split Added",
                            "New split created by " + saved.getInitiatorEmail()
                                    + " — Amount: ₹" + p.getAmount()
                                    + " (" + saved.getSplitType() + ")");
                }
            }
        }

        return ResponseEntity.ok(saved);
    }

    // ------------------------------------------------------
    // ✅ 3. FETCH SPLITS CREATED BY USER (Split By Me)
    // ------------------------------------------------------
    @GetMapping("/by-me/{email}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<ExpenseSplit>> getSplitsByMe(@PathVariable String email) {
        List<ExpenseSplit> splits = expenseSplitRepo.findByInitiatorEmail(email);
        return ResponseEntity.ok(splits);
    }

    // ------------------------------------------------------
    // ✅ 4. FETCH SPLITS WHERE USER IS A PARTICIPANT (Split For Me)
    // ------------------------------------------------------
    @GetMapping("/for-me/{email}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<List<ExpenseSplit>> getSplitsForMe(@PathVariable String email) {
        List<ExpenseSplit> allSplits = expenseSplitRepo.findByParticipantsEmail(email);

        // 🚫 Filter out ones you created yourself
        List<ExpenseSplit> filtered = allSplits.stream()
                .filter(s -> !s.getInitiatorEmail().equalsIgnoreCase(email))
                .toList();

        return ResponseEntity.ok(filtered);
    }

    // ------------------------------------------------------
    // ✅ 5. FETCH SINGLE SPLIT BY ID
    // ------------------------------------------------------
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ExpenseSplit> getSplitById(@PathVariable String id) {
        ExpenseSplit split = expenseSplitRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Split not found with id " + id));
        return ResponseEntity.ok(split);
    }

    // ------------------------------------------------------
    // ✅ 6. UPDATE EXISTING SPLIT (Edit mode from frontend)
    // ------------------------------------------------------
    @PutMapping("/update/{id}")
    @PreAuthorize("hasAnyRole('USER','ADMIN')")
    public ResponseEntity<ExpenseSplit> updateSplit(
            @PathVariable String id,
            @RequestBody ExpenseSplit updatedSplit) {

        ExpenseSplit existing = expenseSplitRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Split not found with id " + id));

        // ✅ Update editable fields
        existing.setAmount(updatedSplit.getAmount());
        existing.setSplitType(updatedSplit.getSplitType());
        existing.setStatus(updatedSplit.getStatus() != null ? updatedSplit.getStatus() : existing.getStatus());
        existing.setLineItems(updatedSplit.getLineItems());
        existing.setParticipants(updatedSplit.getParticipants());
        existing.setTax(updatedSplit.getTax()); // 🔥 new tax field
        existing.setUpdatedAt(java.time.LocalDateTime.now());

        ExpenseSplit saved = expenseSplitRepo.save(existing);

        // 🔔 Notify participants about update
        if (saved.getParticipants() != null) {
            for (var p : saved.getParticipants()) {
                if (!p.getEmail().equalsIgnoreCase(saved.getInitiatorEmail())) {
                    notificationService.createNotification(
                            p.getEmail(),
                            "Split Updated",
                            "Split updated — Amount: ₹" + saved.getAmount()
                                    + " (" + saved.getSplitType() + ")");
                }
            }
        }

        return ResponseEntity.ok(saved);
    }

}

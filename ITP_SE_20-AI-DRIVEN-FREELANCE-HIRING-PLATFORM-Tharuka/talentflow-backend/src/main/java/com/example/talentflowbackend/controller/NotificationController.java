package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Notification;
import com.example.talentflowbackend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final com.example.talentflowbackend.service.JwtService jwtService;

    @GetMapping
    public ResponseEntity<List<Notification>> getMyNotifications(@RequestHeader("Authorization") String authHeader) {
        String email = jwtService.extractUsername(authHeader.substring(7));
        return ResponseEntity.ok(notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        String email = jwtService.extractUsername(authHeader.substring(7));
        long count = notificationRepository.countByRecipientEmailAndIsReadFalse(email);
        return ResponseEntity.ok(Map.of("count", count));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String id) {
        notificationRepository.findById(id).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
        return ResponseEntity.ok().build();
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String authHeader) {
        String email = jwtService.extractUsername(authHeader.substring(7));
        List<Notification> unread = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email)
                .stream().filter(n -> !n.isRead()).toList();
        unread.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(unread);
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteNotification(@PathVariable String id) {
        notificationRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}

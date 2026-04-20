package com.example.talentflowbackend.controller;

import com.example.talentflowbackend.entity.Notification;
import com.example.talentflowbackend.repository.NotificationRepository;
import com.example.talentflowbackend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationRepository notificationRepository;
    private final JwtService jwtService;

    @GetMapping("/my")
    public ResponseEntity<?> getMyNotifications(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            List<Notification> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);
            return ResponseEntity.ok(notifications);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadCount(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            long unreadCount = notificationRepository.countByRecipientEmailAndReadFalse(email);
            return ResponseEntity.ok(Map.of("unreadCount", unreadCount));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable String notificationId, @RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            Notification notification = notificationRepository.findById(notificationId)
                    .orElseThrow(() -> new RuntimeException("Notification not found"));

            if (!email.equals(notification.getRecipientEmail())) {
                return ResponseEntity.status(403).body(Map.of("message", "You do not have permission to update this notification"));
            }

            notification.setRead(true);
            notification.setReadAt(new Date());
            Notification updated = notificationRepository.save(notification);

            return ResponseEntity.ok(Map.of("message", "Notification marked as read", "notification", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }

    @PutMapping("/read-all")
    public ResponseEntity<?> markAllAsRead(@RequestHeader("Authorization") String authHeader) {
        try {
            String email = jwtService.extractUsername(authHeader.substring(7));
            List<Notification> notifications = notificationRepository.findByRecipientEmailOrderByCreatedAtDesc(email);

            for (Notification notification : notifications) {
                if (!notification.isRead()) {
                    notification.setRead(true);
                    notification.setReadAt(new Date());
                }
            }
            notificationRepository.saveAll(notifications);

            return ResponseEntity.ok(Map.of("message", "All notifications marked as read"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
        }
    }
}

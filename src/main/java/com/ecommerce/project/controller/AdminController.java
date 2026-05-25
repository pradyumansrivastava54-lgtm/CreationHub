package com.ecommerce.project.controller;

import com.ecommerce.project.model.User;
import com.ecommerce.project.repository.UserRepository;
import com.ecommerce.project.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private OrderService orderService;

    @Autowired
    private UserRepository userRepository;

    /**
     * GET /api/admin/analytics
     * Restricted to ROLE_ADMIN only.
     * Compiles sales and stock status dashboard.
     */
    @GetMapping("/analytics")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        Map<String, Object> analytics = orderService.getAnalytics();
        return ResponseEntity.ok(analytics);
    }

    /**
     * GET /api/admin/users
     * Fetches all registered users from the Database and returns them as a List.
     */
    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    /**
     * PUT /api/admin/users/{id}/role
     * Accepts a path variable for the User ID and updates that specific user's role in the database.
     */
    @PutMapping("/users/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<?> updateUserRole(
            @PathVariable Long id,
            @RequestParam(required = false) String role,
            @RequestBody(required = false) Map<String, String> body) {

        String newRole = role;
        if (newRole == null && body != null) {
            newRole = body.get("role");
        }

        if (newRole == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Role parameter or body field is required"));
        }

        // Standardize to ROLE_ format
        if (!newRole.startsWith("ROLE_")) {
            newRole = "ROLE_" + newRole.toUpperCase();
        } else {
            newRole = "ROLE_" + newRole.substring(5).toUpperCase();
        }

        Optional<User> userOptional = userRepository.findById(id);
        if (userOptional.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        User user = userOptional.get();
        user.setRole(newRole);
        userRepository.save(user);

        return ResponseEntity.ok(user);
    }
}

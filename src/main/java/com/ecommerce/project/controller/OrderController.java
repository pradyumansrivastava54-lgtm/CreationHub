package com.ecommerce.project.controller;

import com.ecommerce.project.model.Order;
import com.ecommerce.project.service.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/create")
    public ResponseEntity<Order> createOrder(Authentication authentication) {
        String username = authentication.getName();
        Order order = orderService.createOrder(username);
        return ResponseEntity.ok(order);
    }

    @PostMapping("/verify")
    public ResponseEntity<Order> verifyPayment(@RequestBody VerifyPaymentRequest request,
            Authentication authentication) {
        String username = authentication.getName();
        Order order = orderService.verifyPayment(username, request.getRazorpayOrderId(), request.getRazorpayPaymentId(),
                request.getRazorpaySignature());

        if ("FAILED".equals(order.getStatus())) {
            return ResponseEntity.badRequest().body(order);
        }

        return ResponseEntity.ok(order);
    }

    /**
     * GET /api/orders/my-orders
     * Retrieves the history of orders for the logged-in customer.
     */
    @GetMapping("/my-orders")
    public ResponseEntity<java.util.List<Order>> getMyOrders(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        String username = authentication.getName();
        java.util.List<Order> orders = orderService.getMyOrders(username);
        if (orders == null) {
            orders = java.util.Collections.emptyList();
        }
        return ResponseEntity.ok(orders);
    }

    /**
     * GET /api/orders/admin/all
     * Restricted to ROLE_ADMIN only. Tracks every order placed on the platform.
     */
    @GetMapping("/admin/all")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<java.util.List<Order>> getAllOrders() {
        java.util.List<Order> orders = orderService.getAllOrders();
        return ResponseEntity.ok(orders);
    }

    /**
     * PUT /api/orders/{id}/status
     * Restricted to ROLE_ADMIN only. Transition order status (PAID, SHIPPED,
     * DELIVERED).
     */
    @PutMapping("/{id}/status")
    @org.springframework.security.access.prepost.PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Order> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> payload) {
        String status = payload.get("status");
        if (status == null || status.trim().isEmpty()) {
            throw new IllegalArgumentException("status field is required");
        }
        Order updated = orderService.updateOrderStatus(id, status);
        return ResponseEntity.ok(updated);
    }

    /**
     * POST /api/orders/{orderId}/simulate-payment
     * Development-only endpoint: completes an order without Razorpay modal.
     * Deducts stock, clears cart, marks order as PAID.
     */
    @PostMapping("/{orderId}/simulate-payment")
    public ResponseEntity<Order> simulatePayment(@PathVariable Long orderId, Authentication authentication) {
        String username = authentication.getName();
        Order order = orderService.simulatePayment(orderId, username);
        return ResponseEntity.ok(order);
    }
}

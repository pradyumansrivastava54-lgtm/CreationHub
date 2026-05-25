package com.ecommerce.project.controller;

import com.ecommerce.project.model.CartItem;
import com.ecommerce.project.service.CartService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<List<CartItem>> getCartItems(Authentication authentication) {
        String username = authentication.getName();
        List<CartItem> cartItems = cartService.getCartItems(username);
        return ResponseEntity.ok(cartItems);
    }

    @PostMapping("/add")
    public ResponseEntity<CartItem> addToCart(@Valid @RequestBody CartRequest request, Authentication authentication) {
        String username = authentication.getName();
        CartItem cartItem = cartService.addToCart(username, request.getProductId(), request.getQuantity());
        return ResponseEntity.ok(cartItem);
    }

    @PutMapping("/{itemId}")
    public ResponseEntity<CartItem> updateQuantity(@PathVariable Long itemId, @Valid @RequestBody UpdateCartRequest request, Authentication authentication) {
        String username = authentication.getName();
        CartItem cartItem = cartService.updateQuantity(username, itemId, request.getQuantity());
        return ResponseEntity.ok(cartItem);
    }

    @DeleteMapping("/{itemId}")
    public ResponseEntity<Void> removeCartItem(@PathVariable Long itemId, Authentication authentication) {
        String username = authentication.getName();
        cartService.removeCartItem(username, itemId);
        return ResponseEntity.noContent().build();
    }
}

package com.ecommerce.project.service;

import com.ecommerce.project.model.Order;
import com.ecommerce.project.model.OrderItem;
import com.ecommerce.project.model.User;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.logging.Logger;

@Service
public class NotificationService {

    private static final Logger LOGGER = Logger.getLogger(NotificationService.class.getName());

    @Autowired(required = false)
    private JavaMailSender mailSender;

    /**
     * sendOrderConfirmationToUser
     * Compiles an upscale HTML template summarizing order status fields and tracking updates.
     */
    @Async
    public void sendOrderConfirmationToUser(User user, Order order) {
        String toEmail = user.getEmail();
        String subject = "CreationHub — Order Confirmation Details [#" + order.getId() + "]";
        
        StringBuilder htmlContent = new StringBuilder();
        htmlContent.append("<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #FAF6F0;'>");
        htmlContent.append("<h2 style='color: #0f172a; font-family: serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>Thank you for shopping with CreationHub!</h2>");
        htmlContent.append("<p style='font-size: 14px; color: #475569;'>Your order is successfully confirmed.</p>");
        htmlContent.append("<p style='font-size: 14px; color: #475569;'>Hi <strong>@").append(user.getUsername()).append("</strong>,</p>");
        htmlContent.append("<p style='font-size: 14px; color: #475569;'>Here is your premium structured checkout invoice & brief details:</p>");
        
        htmlContent.append("<div style='background-color: #ffffff; padding: 15px; border-radius: 12px; margin: 20px 0;'>");
        htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Order Reference:</strong> #").append(order.getId()).append("</p>");
        htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Placement Date:</strong> ").append(order.getOrderDate()).append("</p>");
        htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Fulfillment Stage:</strong> ").append(order.getOrderStatus()).append("</p>");
        htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Payment Status:</strong> ").append(order.getPaymentStatus()).append("</p>");
        
        if (order.getShippingFullName() != null) {
            htmlContent.append("<p style='font-size: 12px; margin: 10px 0 2px 0;'><strong>Recipient:</strong> ").append(order.getShippingFullName()).append("</p>");
        }
        String addressStr = order.getShippingAddress() != null ? order.getShippingAddress().toString() : "Address Not Provided";
        htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Shipping To:</strong> ").append(addressStr).append("</p>");
        if (order.getShippingPhone() != null) {
            htmlContent.append("<p style='font-size: 12px; margin: 2px 0;'><strong>Phone:</strong> ").append(order.getShippingPhone()).append("</p>");
        }
        htmlContent.append("</div>");

        htmlContent.append("<h4 style='font-size: 12px; color: #0f172a; margin-top: 15px;'>ITEM BRIEF SUMMARY:</h4>");
        htmlContent.append("<table style='width: 100%; border-collapse: collapse; font-size: 12px;'>");
        htmlContent.append("<tr style='border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b;'>");
        htmlContent.append("<th style='padding: 6px 0;'>Item Name</th><th style='padding: 6px 0;'>Qty</th><th style='padding: 6px 0; text-align: right;'>Total Price</th>");
        htmlContent.append("</tr>");
        
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                htmlContent.append("<tr style='border-bottom: 1px solid #f1f5f9;'>");
                htmlContent.append("<td style='padding: 6px 0;'>").append(item.getProduct() != null ? item.getProduct().getName() : "Unknown Product").append("</td>");
                htmlContent.append("<td style='padding: 6px 0;'>").append(item.getQuantity()).append("</td>");
                htmlContent.append("<td style='padding: 6px 0; text-align: right;'>?").append(item.getPrice().multiply(new BigDecimal(item.getQuantity()))).append("</td>");
                htmlContent.append("</tr>");
            }
        }
        htmlContent.append("</table>");
        
        htmlContent.append("<p style='font-size: 14px; margin-top: 10px; color: #4f46e5;'><strong>Amount Charged:</strong> ?").append(order.getTotalAmount()).append("</p>");
        
        htmlContent.append("<p style='font-size: 11px; color: #64748b;'>We are currently preparing your premium lifestyle gear. Dispatch notifications and vector tracking logs will follow shortly.</p>");
        htmlContent.append("<p style='font-size: 11px; color: #64748b; margin-top: 20px;'>Aesthetic curation via <em>Glowora Labs</em> &mdash; CreationHub Inc.</p>");
        htmlContent.append("</div>");

        dispatchEmail(toEmail, subject, htmlContent.toString());
    }

    /**
     * sendOrderAlertToAdmin
     * Dispatches an immediate high-priority payload straight to the corporate administrative inbox.
     */
    @Async
    public void sendOrderAlertToAdmin(Order order) {
        String adminEmail = "admin@creationhub.com";
        String subject = "URGENT FULFILLMENT ALERT: New Order Placed [#" + order.getId() + "]";
        
        StringBuilder htmlContent = new StringBuilder();
        htmlContent.append("<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #FAF6F0;'>");
        htmlContent.append("<h2 style='color: #ef4444; font-family: serif; border-bottom: 2px solid #fee2e2; padding-bottom: 10px;'>NEW ORDER FULFILLMENT NOTICE</h2>");
        
        htmlContent.append("<p style='font-size: 13px; color: #475569;'>Customer: <strong>").append(order.getUser() != null ? order.getUser().getUsername() : "Guest").append("</strong></p>");
        
        htmlContent.append("<div style='background-color: #ffffff; padding: 15px; border-radius: 12px; margin: 15px 0;'>");
        htmlContent.append("<h4 style='margin: 0 0 5px 0; font-size: 12px; color: #0f172a;'>SHIPPING DESTINATION:</h4>");
        if (order.getShippingFullName() != null) {
            htmlContent.append("<p style='font-size: 11px; margin: 2px 0;'>Recipient: ").append(order.getShippingFullName()).append("</p>");
        }
        String addressStr = order.getShippingAddress() != null ? order.getShippingAddress().toString() : "Address Not Provided";
        htmlContent.append("<p style='font-size: 11px; margin: 2px 0;'>Address: ").append(addressStr).append("</p>");
        if (order.getShippingPhone() != null) {
            htmlContent.append("<p style='font-size: 11px; margin: 2px 0;'>Phone: ").append(order.getShippingPhone()).append("</p>");
        }
        htmlContent.append("</div>");

        htmlContent.append("<h4 style='font-size: 12px; color: #0f172a; margin-top: 15px;'>ITEM BRIEF SUMMARY:</h4>");
        htmlContent.append("<table style='width: 100%; border-collapse: collapse; font-size: 12px;'>");
        htmlContent.append("<tr style='border-bottom: 1px solid #e2e8f0; text-align: left; color: #64748b;'>");
        htmlContent.append("<th style='padding: 6px 0;'>Item Name</th><th style='padding: 6px 0;'>Qty</th><th style='padding: 6px 0; text-align: right;'>Total Price</th>");
        htmlContent.append("</tr>");
        
        if (order.getItems() != null) {
            for (OrderItem item : order.getItems()) {
                htmlContent.append("<tr style='border-bottom: 1px solid #f1f5f9;'>");
                htmlContent.append("<td style='padding: 6px 0;'>").append(item.getProduct() != null ? item.getProduct().getName() : "Unknown Product").append("</td>");
                htmlContent.append("<td style='padding: 6px 0;'>").append(item.getQuantity()).append("</td>");
                htmlContent.append("<td style='padding: 6px 0; text-align: right;'>₹").append(item.getPrice().multiply(new BigDecimal(item.getQuantity()))).append("</td>");
                htmlContent.append("</tr>");
            }
        }
        htmlContent.append("</table>");
        
        htmlContent.append("<p style='font-size: 14px; margin-top: 15px; color: #4f46e5;'><strong>Total Paid:</strong> ₹").append(order.getTotalAmount()).append("</p>");
        htmlContent.append("</div>");

        dispatchEmail(adminEmail, subject, htmlContent.toString());
    }

    /**
     * broadcastPromotionalCampaign
     * Asynchronous parallel broadcast engine utility.
     */
    @Async
    public void broadcastPromotionalCampaign(String targetEmail, String announcementTitle, String announcementText) {
        StringBuilder htmlContent = new StringBuilder();
        htmlContent.append("<div style='font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #FAF6F0;'>");
        htmlContent.append("<h2 style='color: #0f172a; font-family: serif; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;'>").append(announcementTitle).append("</h2>");
        htmlContent.append("<p style='font-size: 14px; color: #475569; leading-relaxed; font-serif italic;'>").append(announcementText).append("</p>");
        htmlContent.append("<p style='font-size: 10px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; pt-10;'>This is a corporate administrative broadcast promotional message. &mdash; CreationHub Inc.</p>");
        htmlContent.append("</div>");

        dispatchEmail(targetEmail, "CREATIONHUB EXCLUSIVE: " + announcementTitle, htmlContent.toString());
    }

    // ── Helper Email Dispatcher ─────────────────────────────────────────────
    private void dispatchEmail(String to, String subject, String body) {
        if (mailSender == null) {
            // Upscale simulated/mocked secure logger dispatches if a mail host server isn't running
            LOGGER.warning("[Notification Mock] No SMTP Server found. Logged Dispatch Payload:");
            LOGGER.warning("[Notification Mock] Outbound To: " + to);
            LOGGER.warning("[Notification Mock] Subject Header: " + subject);
            LOGGER.warning("[Notification Mock] HTML Body Content:\n" + body);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(body, true);
            
            mailSender.send(message);
            LOGGER.info("[Notification SUCCESS] Email successfully dispatched to " + to);
        } catch (Exception e) {
            LOGGER.severe("[Notification EXCEPTION] Failed to dispatch email to " + to + ": " + e.getMessage());
        }
    }
}

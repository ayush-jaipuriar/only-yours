package com.onlyyours.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
@Slf4j
public class EmailService {

    private static final String RESEND_API_URL = "https://api.resend.com/emails";

    private final RestClient restClient;
    private final String apiKey;
    private final String fromEmail;

    public EmailService(
            @Value("${resend.api-key:}") String apiKey,
            @Value("${resend.from-email:noreply@onlyyours.app}") String fromEmail) {
        this.apiKey = apiKey;
        this.fromEmail = fromEmail;
        this.restClient = RestClient.builder()
                .baseUrl(RESEND_API_URL)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    public void sendPasswordResetEmail(String toEmail, String resetToken) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("RESEND_API_KEY not configured — logging reset token for dev. "
                    + "In production, set the RESEND_API_KEY environment variable.");
            log.info("DEV ONLY — reset code for {}: {}", toEmail, resetToken);
            return;
        }

        String body = String.format(
                "Your Only Yours password reset code is:\n\n"
                + "%s\n\n"
                + "Enter this code in the app to reset your password.\n"
                + "This code expires in 1 hour.\n\n"
                + "If you didn't request this, you can safely ignore this email.",
                resetToken);

        Map<String, Object> payload = Map.of(
                "from", fromEmail,
                "to", new String[]{toEmail},
                "subject", "Only Yours — Password Reset Code",
                "text", body
        );

        try {
            restClient.post()
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                    .body(payload)
                    .retrieve()
                    .toBodilessEntity();
            log.info("Password reset email sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
        }
    }
}

package com.onlyyours.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * SHA-256 hashing for refresh tokens and password reset tokens.
 *
 * Why SHA-256 instead of BCrypt for tokens?
 * BCrypt uses a random salt per hash, making it impossible to look up a token
 * by its hash without iterating every row. SHA-256 is deterministic, enabling
 * direct DB lookup via WHERE token_hash = ?. This is safe because tokens are
 * high-entropy UUIDs (122 bits of randomness), making brute-force infeasible
 * regardless of hash speed.
 *
 * Passwords still use BCrypt because they are low-entropy (user-chosen).
 */
public final class TokenHashUtil {

    private TokenHashUtil() {}

    public static String hashToken(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}

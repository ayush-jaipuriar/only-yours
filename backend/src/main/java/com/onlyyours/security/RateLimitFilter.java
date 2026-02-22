package com.onlyyours.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final Map<String, RateLimiterService.EndpointPolicy> RATE_LIMITED_PATHS = Map.of(
            "/api/auth/login", RateLimiterService.EndpointPolicy.LOGIN,
            "/api/auth/register", RateLimiterService.EndpointPolicy.REGISTER,
            "/api/auth/forgot-password", RateLimiterService.EndpointPolicy.FORGOT_PASSWORD,
            "/api/auth/reset-password", RateLimiterService.EndpointPolicy.RESET_PASSWORD
    );

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(RateLimiterService rateLimiterService, ObjectMapper objectMapper) {
        this.rateLimiterService = rateLimiterService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        RateLimiterService.EndpointPolicy policy = RATE_LIMITED_PATHS.get(path);

        if (policy == null) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        ConsumptionProbe probe = rateLimiterService.tryConsume(clientIp, policy);

        if (probe.isConsumed()) {
            response.setHeader("X-Rate-Limit-Remaining",
                    String.valueOf(probe.getRemainingTokens()));
            filterChain.doFilter(request, response);
        } else {
            long retryAfterSeconds = Math.max(1,
                    probe.getNanosToWaitForRefill() / 1_000_000_000);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setHeader("Retry-After", String.valueOf(retryAfterSeconds));
            objectMapper.writeValue(response.getWriter(), Map.of(
                    "error", "Too many requests",
                    "retryAfterSeconds", retryAfterSeconds
            ));
        }
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}

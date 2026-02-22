package com.onlyyours.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimiterService {

    public enum EndpointPolicy {
        LOGIN(20, Duration.ofMinutes(1)),
        REGISTER(50, Duration.ofMinutes(1)),
        FORGOT_PASSWORD(10, Duration.ofHours(1)),
        RESET_PASSWORD(10, Duration.ofHours(1));

        final long capacity;
        final Duration period;

        EndpointPolicy(long capacity, Duration period) {
            this.capacity = capacity;
            this.period = period;
        }
    }

    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public ConsumptionProbe tryConsume(String key, EndpointPolicy policy) {
        Bucket bucket = buckets.computeIfAbsent(
                policy.name() + ":" + key,
                k -> createBucket(policy));
        return bucket.tryConsumeAndReturnRemaining(1);
    }

    private Bucket createBucket(EndpointPolicy policy) {
        return Bucket.builder()
                .addLimit(Bandwidth.builder()
                        .capacity(policy.capacity)
                        .refillGreedy(policy.capacity, policy.period)
                        .build())
                .build();
    }
}

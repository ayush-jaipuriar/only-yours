package com.onlyyours.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CoupleStatusDto {
    private String status;
    private boolean linked;
    private Long unlinkedAt;
    private Long cooldownEndsAt;
    private boolean canRecoverWithPreviousPartner;
    private CoupleDto couple;
    private UserDto previousPartner;
    private String message;
}

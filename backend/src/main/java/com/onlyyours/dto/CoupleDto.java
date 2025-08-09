package com.onlyyours.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoupleDto {
    private UUID id;
    private UserDto user1;
    private UserDto user2;
}



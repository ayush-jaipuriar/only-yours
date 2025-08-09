package com.onlyyours.controller;

import com.onlyyours.dto.UserDto;
import com.onlyyours.model.User;
import com.onlyyours.repository.UserRepository;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/me")
    public ResponseEntity<UserDto> getMe(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email).orElseThrow();
        UserDto dto = new UserDto(user.getId(), user.getName(), user.getEmail());
        return ResponseEntity.ok(dto);
    }
}



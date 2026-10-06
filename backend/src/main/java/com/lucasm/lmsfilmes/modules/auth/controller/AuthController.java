package com.lucasm.lmsfilmes.modules.auth.controller;

import com.lucasm.lmsfilmes.modules.auth.dto.ApiResponseDTO;
import com.lucasm.lmsfilmes.modules.auth.dto.AuthDTO;
import com.lucasm.lmsfilmes.modules.auth.dto.AuthResponseDTO;
import com.lucasm.lmsfilmes.modules.auth.dto.ResetPasswordDTO;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping({"/auth", "/lms-filmes/auth", "/lmsfilmes/auth"})
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<AuthResponseDTO> login(@RequestBody AuthDTO dto) {
        return ResponseEntity.ok(authService.login(dto));
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponseDTO> register(@RequestBody AuthDTO dto) {
        return ResponseEntity.ok(authService.register(dto));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponseDTO> forgotPassword(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        return ResponseEntity.ok(authService.forgotPassword(email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponseDTO> resetPassword(@RequestBody ResetPasswordDTO dto) {
        return ResponseEntity.ok(authService.resetPassword(dto.getToken(), dto.getNewPassword()));
    }
}

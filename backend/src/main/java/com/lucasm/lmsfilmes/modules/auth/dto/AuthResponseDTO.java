package com.lucasm.lmsfilmes.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponseDTO {
    private String token;
    private String refreshToken;
    private Long id;
    private String name;
    private String email;
    private String nickname;
    private String role;
    private String message;
}

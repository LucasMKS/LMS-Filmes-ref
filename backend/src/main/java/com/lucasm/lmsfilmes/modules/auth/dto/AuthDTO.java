package com.lucasm.lmsfilmes.modules.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuthDTO {
    private String name;
    private String email;
    private String nickname;
    private String password;
}

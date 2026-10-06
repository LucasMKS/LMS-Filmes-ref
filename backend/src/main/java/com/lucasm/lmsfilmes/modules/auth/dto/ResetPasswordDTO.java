package com.lucasm.lmsfilmes.modules.auth.dto;

import lombok.Data;

@Data
public class ResetPasswordDTO {
    private String token;
    private String newPassword;
}

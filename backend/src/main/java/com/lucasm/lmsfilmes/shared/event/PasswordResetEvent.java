package com.lucasm.lmsfilmes.shared.event;

public record PasswordResetEvent(String email, String resetLink) {}

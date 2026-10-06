package com.lucasm.lmsfilmes.core.exception;

public class TmdbApiException extends RuntimeException {
    public TmdbApiException(String message) {
        super(message);
    }

    public TmdbApiException(String message, Throwable cause) {
        super(message, cause);
    }
}

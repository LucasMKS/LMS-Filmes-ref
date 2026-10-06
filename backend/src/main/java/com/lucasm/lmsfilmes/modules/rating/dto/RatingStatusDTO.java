package com.lucasm.lmsfilmes.modules.rating.dto;

import java.io.Serializable;

public record RatingStatusDTO(String rating, String comment) implements Serializable {}

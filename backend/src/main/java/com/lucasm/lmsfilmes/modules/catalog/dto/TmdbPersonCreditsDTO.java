package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbPersonCreditsDTO(
        Long id,
        List<TmdbCreditItemDTO> cast,
        List<TmdbCreditItemDTO> crew
) implements Serializable {}

package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbPersonDTO(
        Long id,
        String name,
        String original_name,
        String profile_path,
        String known_for_department,
        Double popularity,
        String biography,
        String birthday,
        String deathday,
        String place_of_birth,
        Integer gender,
        List<TmdbDTO> known_for
) implements Serializable {}

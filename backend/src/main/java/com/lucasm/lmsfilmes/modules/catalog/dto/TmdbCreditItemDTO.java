package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record TmdbCreditItemDTO(
        Long id,
        String title,
        String name,
        String original_title,
        String original_name,
        String poster_path,
        String backdrop_path,
        String release_date,
        String first_air_date,
        String media_type,
        Double vote_average,
        Integer vote_count,
        Double popularity,
        String character,
        Integer episode_count,
        String overview,
        List<Integer> genre_ids
) implements Serializable {}

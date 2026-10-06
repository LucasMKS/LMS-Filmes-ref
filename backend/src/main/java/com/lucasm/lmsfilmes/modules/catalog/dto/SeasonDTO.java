package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record SeasonDTO(
        String _id,
        String air_date,
        List<EpisodeDTO> episodes,
        String name,
        String overview,
        Integer id,
        String poster_path,
        Integer season_number,
        Double vote_average
) implements Serializable {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EpisodeDTO(
            String air_date,
            Integer episode_number,
            Integer id,
            String name,
            String overview,
            String production_code,
            Integer runtime,
            Integer season_number,
            Integer show_id,
            String still_path,
            Double vote_average,
            Integer vote_count
    ) implements Serializable {}
}

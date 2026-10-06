package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.io.Serializable;
import java.util.List;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record EpisodeDetailDTO(
        Integer id,
        String name,
        String overview,
        Double vote_average,
        Integer vote_count,
        String air_date,
        Integer episode_number,
        Integer season_number,
        String still_path,
        Integer runtime,
        String production_code,
        List<CrewMemberDTO> crew,
        List<GuestStarDTO> guest_stars
) implements Serializable {

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CrewMemberDTO(
            Integer id,
            String name,
            String job,
            String department,
            String profile_path
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GuestStarDTO(
            Integer id,
            String name,
            String character,
            String profile_path
    ) implements Serializable {}
}

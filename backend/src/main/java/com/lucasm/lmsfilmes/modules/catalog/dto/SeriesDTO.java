package com.lucasm.lmsfilmes.modules.catalog.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.io.Serializable;
import java.util.List;
import java.util.Map;

@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public record SeriesDTO(
        String backdrop_path,
        List<CreatedByDTO> created_by,
        String first_air_date,
        List<Integer> genre_ids,
        List<GenreDTO> genres,
        String homepage,
        Integer id,
        boolean in_production,
        String last_air_date,
        EpisodeDTO last_episode_to_air,
        String name,
        EpisodeDTO next_episode_to_air,
        List<NetworkDTO> networks,
        int number_of_episodes,
        int number_of_seasons,
        List<SeasonSummaryDTO> seasons,
        String overview,
        String poster_path,
        String status,
        String tagline,
        String media_type,
        double vote_average,
        int vote_count,
        Credits credits,
        Videos videos,
        @JsonProperty("watch/providers")
        WatchProviders watch_providers,
        TmdbPageDTO<TmdbDTO> recommendations
) implements Serializable {

    public SeriesDTO {
        if (media_type == null) {
            media_type = "tv";
        }
    }

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record SeasonSummaryDTO(
            Long id,
            String name,
            String overview,
            String poster_path,
            int season_number,
            int episode_count,
            String air_date,
            Double vote_average
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record CreatedByDTO(
            int id,
            String name,
            String profilePath
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GenreDTO(
            int id,
            String name
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record EpisodeDTO(
            String name,
            String overview,
            String air_date,
            String episode_number,
            String season_number
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record NetworkDTO(
            int id,
            String name,
            String logo_path,
            String origin_country
    ) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Credits(List<Cast> cast, List<Crew> crew) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Cast(Long id, String name, String character, String profile_path) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Crew(Long id, String name, String job, String department, String profile_path) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Videos(List<Video> results) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Video(String id, String key, String name, String site, String type, boolean official) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record WatchProviders(Map<String, ProviderRegion> results) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProviderRegion(String link, List<Provider> flatrate, List<Provider> rent, List<Provider> buy) implements Serializable {}

    @JsonInclude(JsonInclude.Include.NON_NULL)
    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Provider(Long provider_id, String provider_name, String logo_path) implements Serializable {}
}

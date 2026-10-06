package com.lucasm.lmsfilmes.modules.rating.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RatingMovieResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private String movieId;
    private String title;
    private String posterPath;
    private Double rating;
    private String comment;
    private Integer rewatchCount;
    private LocalDateTime createdAt;
    private LocalDateTime modifiedAt;

    @com.fasterxml.jackson.annotation.JsonProperty("ratedAt")
    public String getRatedAt() {
        return createdAt != null ? createdAt.toString() : null;
    }

    @com.fasterxml.jackson.annotation.JsonProperty("poster_path")
    public String getPosterPathSnake() {
        return posterPath;
    }
}

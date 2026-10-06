package com.lucasm.lmsfilmes.modules.favorite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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
public class FavoriteSerieResponseDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private Long id;
    private Long userId;
    private String serieId;
    private String title;
    private String posterPath;

    @JsonProperty("poster_path")
    public String getPosterPathSnake() {
        return posterPath;
    }

    private Boolean favorite;
    private LocalDateTime createdAt;
}

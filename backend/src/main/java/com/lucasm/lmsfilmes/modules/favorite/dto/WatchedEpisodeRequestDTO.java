package com.lucasm.lmsfilmes.modules.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WatchedEpisodeRequestDTO {
    private String serieId;
    private Integer seasonNumber;
    private Integer episodeNumber;
}

package com.lucasm.lmsfilmes.modules.rating.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDTO implements Serializable {
    private static final long serialVersionUID = 1L;

    private long totalMovies;
    private long totalSeries;
    private long totalEpisodesWatched;
    private long estimatedMinutesSpent;
    private long estimatedHoursSpent;
    private long estimatedDaysSpent;
    private Double averageMovieRating;
    private Double averageSerieRating;
}

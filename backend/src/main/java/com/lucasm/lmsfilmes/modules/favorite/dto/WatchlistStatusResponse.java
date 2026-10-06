package com.lucasm.lmsfilmes.modules.favorite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.lucasm.lmsfilmes.modules.favorite.model.WatchlistStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WatchlistStatusResponse {
    private boolean inWatchlist;
    private WatchlistStatus status;

    @JsonProperty("isWatchlist")
    public boolean isWatchlist() {
        return this.inWatchlist;
    }
}

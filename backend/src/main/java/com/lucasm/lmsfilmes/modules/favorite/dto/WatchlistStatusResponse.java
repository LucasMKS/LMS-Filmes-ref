package com.lucasm.lmsfilmes.modules.favorite.dto;

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
}

package com.lucasm.lmsfilmes.modules.favorite.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FavoriteStatusResponse {
    @JsonProperty("isFavorite")
    private boolean isFavorite;

    @JsonProperty("favorite")
    public boolean getFavorite() {
        return isFavorite;
    }
}

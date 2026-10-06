package com.lucasm.lmsfilmes.modules.favorite.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

public class CustomListDTOs {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Create {
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Update {
        private String name;
        private String description;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddItem {
        private String id; // mediaId
        private String type; // "movie" or "serie"
        private String title;
        private String posterPath;
        private String backdropPath;
        private Double voteAverage;
        private String releaseYear;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Response {
        private Long id;
        private Long userId;
        private String name;
        private String description;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private List<ItemResponse> items;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ItemResponse {
        private Long id;
        private String mediaId;
        private String mediaType;
        private String title;
        private String posterPath;
        private String backdropPath;
        private Double voteAverage;
        private String releaseYear;
        private LocalDateTime addedAt;
    }
}

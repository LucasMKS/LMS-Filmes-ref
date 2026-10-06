package com.lucasm.lmsfilmes.modules.rating.model;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "ratings_series", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "serie_id"})
})
public class RatingSerie implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "serie_id", nullable = false)
    private String serieId;

    private Double rating;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "rewatch_count", columnDefinition = "integer default 0")
    private Integer rewatchCount = 0;

    @Column(name = "watched_episodes")
    private Integer watchedEpisodes = 0;

    @Column(name = "total_episodes")
    private Integer totalEpisodes = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "modified_at")
    private LocalDateTime modifiedAt;

    @Column(name = "mongo_id")
    private String mongoId;
}

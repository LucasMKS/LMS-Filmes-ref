package com.lucasm.lmsfilmes.modules.favorite.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "watchlist_series", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "serie_id"})
}, indexes = {
        @Index(name = "idx_watchlist_series_user", columnList = "user_id"),
        @Index(name = "idx_watchlist_series_added", columnList = "user_id, added_at DESC")
})
public class WatchlistSerie implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "serie_id", nullable = false)
    private String serieId;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;

    @Column(name = "mongo_id")
    private String mongoId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", columnDefinition = "varchar(255) default 'PLAN_TO_WATCH'")
    private WatchlistStatus status = WatchlistStatus.PLAN_TO_WATCH;

    public WatchlistStatus getStatus() {
        return this.status != null ? this.status : WatchlistStatus.PLAN_TO_WATCH;
    }
}

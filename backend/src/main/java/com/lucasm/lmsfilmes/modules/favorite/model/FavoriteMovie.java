package com.lucasm.lmsfilmes.modules.favorite.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;

@Data
@Entity
@Table(name = "favorite_movies", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "movie_id"})
})
public class FavoriteMovie implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "movie_id", nullable = false)
    private String movieId;

    @Column(name = "is_favorite")
    private Boolean favorite = true;

    public boolean isFavorite() {
        return Boolean.TRUE.equals(favorite);
    }

    @Column(name = "mongo_id")
    private String mongoId;
}

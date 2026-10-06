package com.lucasm.lmsfilmes.modules.favorite.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;

@Data
@Entity
@Table(name = "favorite_series", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "serie_id"})
})
public class FavoriteSerie implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "serie_id", nullable = false)
    private String serieId;

    @Column(name = "is_favorite")
    private boolean favorite = true;

    @Column(name = "mongo_id")
    private String mongoId;
}

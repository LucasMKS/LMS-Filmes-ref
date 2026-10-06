package com.lucasm.lmsfilmes.modules.favorite.model;

import jakarta.persistence.*;
import lombok.Data;

import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "favorite_actors", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "actor_id"})
})
public class FavoriteActor implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "actor_id", nullable = false)
    private String actorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "profile_path")
    private String profilePath;

    @Column(name = "department")
    private String department;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();
}

package com.lucasm.lmsfilmes.modules.favorite.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.io.Serializable;
import java.time.LocalDateTime;

@Getter
@Setter
@Entity
@Table(name = "actor_list_items", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"actor_list_id", "actor_id"})
}, indexes = {
        @Index(name = "idx_actor_list_items_list_id", columnList = "actor_list_id"),
        @Index(name = "idx_actor_list_items_actor", columnList = "actor_id")
})
public class ActorListItem implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_list_id", nullable = false)
    private ActorList actorList;

    @Column(name = "actor_id", nullable = false)
    private String actorId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "profile_path")
    private String profilePath;

    @Column(name = "department")
    private String department;

    @CreationTimestamp
    @Column(name = "added_at", updatable = false)
    private LocalDateTime addedAt;
}

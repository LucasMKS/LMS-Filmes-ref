package com.lucasm.lmsfilmes.modules.catalog.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "series")
public class Serie implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @Column(name = "serie_id", length = 50)
    private String serieId;

    @Column(nullable = false)
    private String title;

    @Column(name = "poster_path", columnDefinition = "TEXT")
    private String posterPath;
}

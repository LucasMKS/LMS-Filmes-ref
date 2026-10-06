package com.lucasm.lmsfilmes.modules.catalog.repository;

import com.lucasm.lmsfilmes.modules.catalog.model.Serie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface SerieRepository extends JpaRepository<Serie, String> {
    List<Serie> findBySerieIdIn(Collection<String> serieIds);
}

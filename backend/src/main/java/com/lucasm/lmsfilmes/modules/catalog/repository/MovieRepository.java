package com.lucasm.lmsfilmes.modules.catalog.repository;

import com.lucasm.lmsfilmes.modules.catalog.model.Movie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<Movie, String> {
    List<Movie> findByMovieIdIn(Collection<String> movieIds);
}

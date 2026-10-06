package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteMovie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteMovieRepository extends JpaRepository<FavoriteMovie, Long> {
    Optional<FavoriteMovie> findByUserIdAndMovieId(Long userId, String movieId);
    List<FavoriteMovie> findByUserIdAndFavoriteTrue(Long userId);
    List<FavoriteMovie> findByUserIdAndMovieIdIn(Long userId, Collection<String> movieIds);
    boolean existsByUserIdAndMovieIdAndFavoriteTrue(Long userId, String movieId);
}

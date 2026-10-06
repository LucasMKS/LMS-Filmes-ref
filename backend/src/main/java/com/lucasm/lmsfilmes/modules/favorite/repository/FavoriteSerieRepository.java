package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.FavoriteSerie;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FavoriteSerieRepository extends JpaRepository<FavoriteSerie, Long> {
    Optional<FavoriteSerie> findByUserIdAndSerieId(Long userId, String serieId);
    List<FavoriteSerie> findByUserIdAndFavoriteTrue(Long userId);
    List<FavoriteSerie> findByUserId(Long userId);
    List<FavoriteSerie> findByUserIdAndSerieIdIn(Long userId, Collection<String> serieIds);
    boolean existsByUserIdAndSerieIdAndFavoriteTrue(Long userId, String serieId);
}

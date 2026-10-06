package com.lucasm.lmsfilmes.modules.rating.repository;

import com.lucasm.lmsfilmes.modules.rating.model.RatingMovie;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface MovieRatingRepository extends JpaRepository<RatingMovie, Long> {

    Page<RatingMovie> findAllByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<RatingMovie> findAllByUserIdOrderByCreatedAtDesc(Long userId);
    List<RatingMovie> findAllByUserIdOrderByIdDesc(Long userId);
    List<RatingMovie> findAllByUserId(Long userId);

    Optional<RatingMovie> findByMovieIdAndUserId(String movieId, Long userId);

    List<RatingMovie> findByUserIdAndMovieIdIn(Long userId, Collection<String> movieIds);

    long countByUserId(Long userId);

    @Query("SELECT AVG(r.rating) FROM RatingMovie r WHERE r.userId = :userId")
    Double getAverageRatingByUserId(@Param("userId") Long userId);

    @Query("SELECT r FROM RatingMovie r WHERE r.userId = :userId AND r.rating BETWEEN :minRating AND :maxRating ORDER BY r.createdAt DESC")
    Page<RatingMovie> findByUserIdAndRatingRange(@Param("userId") Long userId, @Param("minRating") double minRating, @Param("maxRating") double maxRating, Pageable pageable);

    @Query(value = "SELECT r.* FROM ratings_movies r JOIN movies m ON r.movie_id = m.movie_id WHERE r.user_id = :userId AND LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')) ORDER BY r.created_at DESC",
            countQuery = "SELECT COUNT(r.id) FROM ratings_movies r JOIN movies m ON r.movie_id = m.movie_id WHERE r.user_id = :userId AND LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%'))",
            nativeQuery = true)
    Page<RatingMovie> findByUserIdAndTitleContainingIgnoreCase(@Param("userId") Long userId, @Param("title") String title, Pageable pageable);

    @Query(value = "SELECT r.* FROM ratings_movies r JOIN movies m ON r.movie_id = m.movie_id WHERE r.user_id = :userId AND LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')) AND r.rating BETWEEN :minRating AND :maxRating ORDER BY r.created_at DESC",
            countQuery = "SELECT COUNT(r.id) FROM ratings_movies r JOIN movies m ON r.movie_id = m.movie_id WHERE r.user_id = :userId AND LOWER(m.title) LIKE LOWER(CONCAT('%', :title, '%')) AND r.rating BETWEEN :minRating AND :maxRating",
            nativeQuery = true)
    Page<RatingMovie> findByUserIdAndTitleAndRatingRange(@Param("userId") Long userId, @Param("title") String title, @Param("minRating") double minRating, @Param("maxRating") double maxRating, Pageable pageable);
}

package com.lucasm.lmsfilmes.modules.auth.repository;

import com.lucasm.lmsfilmes.modules.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByNicknameIgnoreCase(String nickname);

    @Query("SELECT u FROM User u WHERE LOWER(u.email) = LOWER(:identifier) OR LOWER(u.nickname) = LOWER(:identifier)")
    List<User> findAllByEmailOrNickname(@Param("identifier") String identifier);

    default Optional<User> findByEmailOrNickname(String identifier) {
        List<User> users = findAllByEmailOrNickname(identifier);
        return users.isEmpty() ? Optional.empty() : Optional.of(users.get(0));
    }

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByNicknameIgnoreCase(String nickname);
}

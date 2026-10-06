package com.lucasm.lmsfilmes.modules.auth.repository;

import com.lucasm.lmsfilmes.modules.auth.model.PasswordResetToken;
import com.lucasm.lmsfilmes.modules.auth.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByToken(String token);

    void deleteByUser(User user);
}

package com.lucasm.lmsfilmes.modules.favorite.repository;

import com.lucasm.lmsfilmes.modules.favorite.model.CustomListItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CustomListItemRepository extends JpaRepository<CustomListItem, Long> {
    Optional<CustomListItem> findByCustomListIdAndMediaIdAndMediaType(Long customListId, String mediaId, String mediaType);
    void deleteByCustomListIdAndMediaIdAndMediaType(Long customListId, String mediaId, String mediaType);
}

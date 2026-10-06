package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.favorite.dto.CustomListDTOs;
import com.lucasm.lmsfilmes.modules.favorite.model.CustomList;
import com.lucasm.lmsfilmes.modules.favorite.model.CustomListItem;
import com.lucasm.lmsfilmes.modules.favorite.repository.CustomListItemRepository;
import com.lucasm.lmsfilmes.modules.favorite.repository.CustomListRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomListService {

    private final CustomListRepository customListRepository;
    private final CustomListItemRepository customListItemRepository;
    private final AuthService authService;

    public List<CustomListDTOs.Response> getUserLists(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        return customListRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public CustomListDTOs.Response getListById(Long id, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        CustomList list = customListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista não encontrada: " + id));

        return toResponse(list);
    }

    @Transactional
    public CustomListDTOs.Response createList(CustomListDTOs.Create dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        CustomList list = new CustomList();
        list.setUserId(userId);
        list.setName(dto.getName());
        list.setDescription(dto.getDescription());

        CustomList saved = customListRepository.save(list);
        return toResponse(saved);
    }

    @Transactional
    public CustomListDTOs.Response updateList(Long id, CustomListDTOs.Update dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        CustomList list = customListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista não encontrada: " + id));

        list.setName(dto.getName());
        list.setDescription(dto.getDescription());

        CustomList saved = customListRepository.save(list);
        return toResponse(saved);
    }

    @Transactional
    public void deleteList(Long id, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        customListRepository.findByIdAndUserId(id, userId).ifPresent(customListRepository::delete);
    }

    @Transactional
    public CustomListDTOs.Response addItemToList(Long listId, CustomListDTOs.AddItem dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        CustomList list = customListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista não encontrada: " + listId));

        customListItemRepository.findByCustomListIdAndMediaIdAndMediaType(listId, dto.getId(), dto.getType())
                .orElseGet(() -> {
                    CustomListItem item = new CustomListItem();
                    item.setCustomList(list);
                    item.setMediaId(dto.getId());
                    item.setMediaType(dto.getType());
                    item.setTitle(dto.getTitle());
                    item.setPosterPath(dto.getPosterPath());
                    item.setBackdropPath(dto.getBackdropPath());
                    item.setVoteAverage(dto.getVoteAverage());
                    item.setReleaseYear(dto.getReleaseYear());
                    return customListItemRepository.save(item);
                });

        return getListById(listId, email);
    }

    @Transactional
    public void removeItemFromList(Long listId, String mediaId, String mediaType, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        if (customListRepository.findByIdAndUserId(listId, userId).isPresent()) {
            customListItemRepository.deleteByCustomListIdAndMediaIdAndMediaType(listId, mediaId, mediaType);
        }
    }

    private CustomListDTOs.Response toResponse(CustomList list) {
        List<CustomListDTOs.ItemResponse> items = list.getItems() != null
                ? list.getItems().stream().map(i -> CustomListDTOs.ItemResponse.builder()
                .id(i.getId())
                .mediaId(i.getMediaId())
                .mediaType(i.getMediaType())
                .title(i.getTitle())
                .posterPath(i.getPosterPath())
                .backdropPath(i.getBackdropPath())
                .voteAverage(i.getVoteAverage())
                .releaseYear(i.getReleaseYear())
                .addedAt(i.getAddedAt())
                .build()).toList()
                : List.of();

        return CustomListDTOs.Response.builder()
                .id(list.getId())
                .userId(list.getUserId())
                .name(list.getName())
                .description(list.getDescription())
                .createdAt(list.getCreatedAt())
                .updatedAt(list.getUpdatedAt())
                .items(items)
                .build();
    }
}

package com.lucasm.lmsfilmes.modules.favorite.service;

import com.lucasm.lmsfilmes.core.exception.ResourceNotFoundException;
import com.lucasm.lmsfilmes.modules.auth.service.AuthService;
import com.lucasm.lmsfilmes.modules.favorite.dto.ActorListDTOs;
import com.lucasm.lmsfilmes.modules.favorite.model.ActorList;
import com.lucasm.lmsfilmes.modules.favorite.model.ActorListItem;
import com.lucasm.lmsfilmes.modules.favorite.repository.ActorListItemRepository;
import com.lucasm.lmsfilmes.modules.favorite.repository.ActorListRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ActorListService {

    private final ActorListRepository actorListRepository;
    private final ActorListItemRepository actorListItemRepository;
    private final AuthService authService;

    public List<ActorListDTOs.Response> getUserActorLists(String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return List.of();

        return actorListRepository.findByUserIdOrderByUpdatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    public ActorListDTOs.Response getActorListById(Long id, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        ActorList list = actorListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista de atores não encontrada: " + id));

        return toResponse(list);
    }

    @Transactional
    public ActorListDTOs.Response createActorList(ActorListDTOs.Create dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        ActorList list = new ActorList();
        list.setUserId(userId);
        list.setName(dto.getName());
        list.setDescription(dto.getDescription());

        ActorList saved = actorListRepository.save(list);
        return toResponse(saved);
    }

    @Transactional
    public ActorListDTOs.Response updateActorList(Long id, ActorListDTOs.Update dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        ActorList list = actorListRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista de atores não encontrada: " + id));

        list.setName(dto.getName());
        list.setDescription(dto.getDescription());

        ActorList saved = actorListRepository.save(list);
        return toResponse(saved);
    }

    @Transactional
    public void deleteActorList(Long id, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        actorListRepository.findByIdAndUserId(id, userId).ifPresent(actorListRepository::delete);
    }

    @Transactional
    public ActorListDTOs.Response addActorToList(Long listId, ActorListDTOs.AddItem dto, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) throw new ResourceNotFoundException("Usuário não encontrado");

        ActorList list = actorListRepository.findByIdAndUserId(listId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Lista não encontrada: " + listId));

        actorListItemRepository.findByActorListIdAndActorId(listId, dto.getActorId())
                .orElseGet(() -> {
                    ActorListItem item = new ActorListItem();
                    item.setActorList(list);
                    item.setActorId(dto.getActorId());
                    item.setName(dto.getName());
                    item.setProfilePath(dto.getProfilePath());
                    item.setDepartment(dto.getDepartment());
                    return actorListItemRepository.save(item);
                });

        return getActorListById(listId, email);
    }

    @Transactional
    public void removeActorFromList(Long listId, String actorId, String email) {
        Long userId = authService.getUserIdByIdentifier(email);
        if (userId == null) return;

        if (actorListRepository.findByIdAndUserId(listId, userId).isPresent()) {
            actorListItemRepository.deleteByActorListIdAndActorId(listId, actorId);
        }
    }

    private ActorListDTOs.Response toResponse(ActorList list) {
        List<ActorListDTOs.ItemResponse> items = list.getItems() != null
                ? list.getItems().stream().map(i -> ActorListDTOs.ItemResponse.builder()
                .id(i.getId())
                .actorId(i.getActorId())
                .name(i.getName())
                .profilePath(i.getProfilePath())
                .department(i.getDepartment())
                .addedAt(i.getAddedAt())
                .build()).toList()
                : List.of();

        return ActorListDTOs.Response.builder()
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

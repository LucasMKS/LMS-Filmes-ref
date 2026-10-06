package com.lucasm.lmsfilmes.modules.rating.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class EpisodeRatingRequestDTO {

    @NotBlank(message = "O ID da série é obrigatório")
    private String serieId;

    @NotNull(message = "O número da temporada é obrigatório")
    private Integer seasonNumber;

    @NotNull(message = "O número do episódio é obrigatório")
    private Integer episodeNumber;

    @NotNull(message = "A nota é obrigatória")
    @DecimalMin(value = "0.5", message = "A nota deve ser no mínimo 0.5")
    @DecimalMax(value = "10.0", message = "A nota deve ser no máximo 10.0")
    private Double rating;

    private String comment;
}

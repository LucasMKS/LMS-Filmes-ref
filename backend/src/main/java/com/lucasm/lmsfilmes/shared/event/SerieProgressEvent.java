package com.lucasm.lmsfilmes.shared.event;

public record SerieProgressEvent(String serieId, String email, int watchedEpisodes, int totalEpisodes) {}

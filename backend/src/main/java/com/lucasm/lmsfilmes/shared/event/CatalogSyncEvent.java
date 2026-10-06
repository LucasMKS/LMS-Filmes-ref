package com.lucasm.lmsfilmes.shared.event;

public record CatalogSyncEvent(String id, String title, String posterPath, boolean isSerie) {}

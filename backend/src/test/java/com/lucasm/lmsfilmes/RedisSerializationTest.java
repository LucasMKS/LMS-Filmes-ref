package com.lucasm.lmsfilmes;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.lucasm.lmsfilmes.modules.catalog.dto.SeriesDTO;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

public class RedisSerializationTest {

    private GenericJackson2JsonRedisSerializer createJsonSerializer() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        mapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
        mapper.activateDefaultTyping(
                BasicPolymorphicTypeValidator.builder().allowIfBaseType(Object.class).build(),
                ObjectMapper.DefaultTyping.EVERYTHING,
                JsonTypeInfo.As.PROPERTY
        );
        return new GenericJackson2JsonRedisSerializer(mapper);
    }

    @Test
    void testSeriesDTORoundTripSerialization() {
        SeriesDTO dto = new SeriesDTO(
                "/backdrop.jpg",
                List.of(new SeriesDTO.CreatedByDTO(1, "Vince Gilligan", "/profile.jpg")),
                "2008-01-20",
                List.of(18),
                List.of(new SeriesDTO.GenreDTO(18, "Drama")),
                "https://example.com",
                1396,
                false,
                "2013-09-29",
                null,
                "Breaking Bad",
                null,
                Collections.emptyList(),
                62,
                5,
                Collections.emptyList(),
                "Overview",
                "/poster.jpg",
                "Ended",
                "Tagline",
                "tv",
                9.5,
                10000,
                new SeriesDTO.Credits(
                        List.of(new SeriesDTO.Cast(1L, "Bryan Cranston", "Walter White", "/cast.jpg")),
                        Collections.emptyList()
                ),
                null,
                null,
                null
        );

        GenericJackson2JsonRedisSerializer redisSerializer = createJsonSerializer();
        byte[] bytes = redisSerializer.serialize(dto);
        assertNotNull(bytes);

        Object deserialized = redisSerializer.deserialize(bytes);
        assertNotNull(deserialized);
        assertEquals(SeriesDTO.class, deserialized.getClass());
        assertEquals("Breaking Bad", ((SeriesDTO) deserialized).name());
    }
}

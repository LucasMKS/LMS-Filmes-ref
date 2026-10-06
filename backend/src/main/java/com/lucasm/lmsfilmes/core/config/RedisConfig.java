package com.lucasm.lmsfilmes.core.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

@Configuration
@EnableCaching
public class RedisConfig {

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = new GenericJackson2JsonRedisSerializer();

        RedisCacheConfiguration defaultConfig = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(Duration.ofHours(2))
                .disableCachingNullValues()
                .serializeKeysWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(jsonSerializer));

        Map<String, RedisCacheConfiguration> cacheConfigurations = new HashMap<>();
        // TMDB Catalogs (24 hours)
        cacheConfigurations.put("moviesPopular", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("moviesNowPlaying", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("moviesTopRated", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("moviesUpcoming", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("movieDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("seriesPopular", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("seriesAiringToday", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("seriesOnTheAir", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("seriesTopRated", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("serieDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("seasonDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("episodeDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorsPopular", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorCredits", defaultConfig.entryTtl(Duration.ofHours(48)));

        // User Lookups & Stats
        cacheConfigurations.put("userIdByEmail", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("dashboardStats", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("mediaBalance", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(new GenericJackson2JsonRedisSerializer());
        template.afterPropertiesSet();
        return template;
    }
}

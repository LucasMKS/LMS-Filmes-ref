package com.lucasm.lmsfilmes.core.config;

import com.fasterxml.jackson.annotation.JsonTypeInfo;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.databind.jsontype.BasicPolymorphicTypeValidator;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.CacheErrorHandler;
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

@Slf4j
@Configuration
@EnableCaching
public class RedisConfig implements CachingConfigurer {

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

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();

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
        cacheConfigurations.put("moviesSearch", defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigurations.put("movieDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("movieBasicDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("movieRecommendations", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("seriesPopular", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("seriesAiringToday", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("seriesOnTheAir", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("seriesTopRated", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("seriesSearch", defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigurations.put("seriesRecommendations", defaultConfig.entryTtl(Duration.ofHours(24)));
        cacheConfigurations.put("serieDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("serieBasicDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("seasonDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("episodeDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorsPopular", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorsSearch", defaultConfig.entryTtl(Duration.ofHours(6)));
        cacheConfigurations.put("actorDetails", defaultConfig.entryTtl(Duration.ofHours(48)));
        cacheConfigurations.put("actorCredits", defaultConfig.entryTtl(Duration.ofHours(48)));

        // User Lookups & Stats
        cacheConfigurations.put("userIdByEmail", defaultConfig.entryTtl(Duration.ofHours(12)));
        cacheConfigurations.put("dashboardStats", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("mediaBalance", defaultConfig.entryTtl(Duration.ofMinutes(10)));
        cacheConfigurations.put("mediaBalanceSummary", defaultConfig.entryTtl(Duration.ofMinutes(10)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultConfig)
                .withInitialCacheConfigurations(cacheConfigurations)
                .build();
    }

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        GenericJackson2JsonRedisSerializer jsonSerializer = createJsonSerializer();
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);
        template.setKeySerializer(new StringRedisSerializer());
        template.setValueSerializer(jsonSerializer);
        template.setHashKeySerializer(new StringRedisSerializer());
        template.setHashValueSerializer(jsonSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Override
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache GET falhou para chave '{}' no cache '{}': {}. Limpando chave inválida...", key, cache != null ? cache.getName() : "desconhecido", exception.getMessage());
                if (cache != null && key != null) {
                    try {
                        cache.evict(key);
                    } catch (Exception e) {
                        log.debug("Erro ao limpar chave inválida '{}' do cache: {}", key, e.getMessage());
                    }
                }
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Cache PUT falhou para chave '{}' no cache '{}': {}", key, cache != null ? cache.getName() : "desconhecido", exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Cache EVICT falhou para chave '{}' no cache '{}': {}", key, cache != null ? cache.getName() : "desconhecido", exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Cache CLEAR falhou no cache '{}': {}", cache != null ? cache.getName() : "desconhecido", exception.getMessage());
            }
        };
    }
}

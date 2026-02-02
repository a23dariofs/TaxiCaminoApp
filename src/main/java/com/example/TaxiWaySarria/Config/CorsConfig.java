package com.example.TaxiWaySarria.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;

/**
 * Configuración de CORS para permitir peticiones desde el frontend
 * Esta clase es ESENCIAL para que el frontend pueda comunicarse con el backend
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                // Permitir peticiones desde estos orígenes
                .allowedOrigins(
                        "http://localhost:3000",      // React/Vue en desarrollo
                        "http://localhost:5500",      // Live Server
                        "http://127.0.0.1:5500",      // Live Server alternativo
                        "http://localhost:8000",      // Python HTTP Server
                        "http://127.0.0.1:8000",      // Python HTTP Server alternativo
                        "*"                            // Cualquier origen (solo para desarrollo)
                )
                // Métodos HTTP permitidos
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH")
                // Headers permitidos
                .allowedHeaders("*")
                // Permitir envío de credenciales (cookies, auth headers)
                .allowCredentials(false)
                // Tiempo de cache de la configuración CORS
                .maxAge(3600);
    }

    /**
     * Configuración alternativa usando CorsConfigurationSource
     * Puedes usar este método si necesitas más control sobre la configuración
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:3000",
                "http://localhost:5500",
                "http://127.0.0.1:5500",
                "http://localhost:8000",
                "http://127.0.0.1:8000"
        ));

        configuration.setAllowedMethods(Arrays.asList(
                "GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"
        ));

        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(false);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);

        return source;
    }
}
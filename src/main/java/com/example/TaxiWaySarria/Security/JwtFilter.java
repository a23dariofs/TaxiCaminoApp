package com.example.TaxiWaySarria.Security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UserDetailsService userDetailsService;

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ ENDPOINTS QUE NO REQUIEREN JWT (el filtro los ignora)
    // ═══════════════════════════════════════════════════════════════════════════

    private static final List<String> EXCLUDED_PREFIXES = Arrays.asList(
            "/api/auth/",
            "/api/presupuestos/aceptar",
            "/html/",
            "/css/",
            "/js/",
            "/img/"
    );

    private static final List<String> EXCLUDED_EXTENSIONS = Arrays.asList(
            ".html",
            ".css",
            ".js",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".ico",
            ".svg"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {

        String requestPath = request.getRequestURI();

        System.out.println("Processing request: " + requestPath);
        if (shouldNotFilter(requestPath)) {
            chain.doFilter(request, response);
            return;
        }

        // ═══════════════════════════════════════════════════════════════════════
        // VALIDACIÓN JWT NORMAL
        // ═══════════════════════════════════════════════════════════════════════

        final String authorizationHeader = request.getHeader("Authorization");

        String username = null;
        String jwt = null;

        if (authorizationHeader != null && authorizationHeader.startsWith("Bearer ")) {
            jwt = authorizationHeader.substring(7);
            try {
                // ✅ ADAPTADO: Usar getUsernameFromToken() según tu JwtUtil
                username = jwtUtil.getUsernameFromToken(jwt);
            } catch (Exception e) {
                System.out.println("⚠️ Error extracting username from JWT: " + e.getMessage());
            }
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            // ✅ ADAPTADO: validateToken() solo recibe el token (no username)
            if (jwtUtil.validateToken(jwt)) {
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(username);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        chain.doFilter(request, response);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ✅ MÉTODO MEJORADO PARA VERIFICAR SI UNA URL DEBE SER EXCLUIDA DEL FILTRO JWT
    // ═══════════════════════════════════════════════════════════════════════════

    private boolean shouldNotFilter(String path) {
        // ✅ Verificar prefijos (como /api/auth/, /html/, etc.)
        boolean matchesPrefix = EXCLUDED_PREFIXES.stream()
                .anyMatch(path::startsWith);

        // ✅ Verificar extensiones (como .html, .css, .js, etc.)
        boolean matchesExtension = EXCLUDED_EXTENSIONS.stream()
                .anyMatch(path::endsWith);

        // ✅ Debug log (puedes comentarlo después de verificar)
        if (matchesPrefix || matchesExtension) {
            System.out.println("🔓 Ruta pública permitida: " + path);
        } else {
            System.out.println("🔒 Ruta protegida (requiere JWT): " + path);
        }

        return matchesPrefix || matchesExtension;
    }
}
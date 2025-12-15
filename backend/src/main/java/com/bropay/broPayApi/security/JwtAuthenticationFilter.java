// package com.bropay.broPayApi.security;

// import jakarta.servlet.FilterChain;
// import jakarta.servlet.ServletException;
// import jakarta.servlet.http.HttpServletRequest;
// import jakarta.servlet.http.HttpServletResponse;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
// import org.springframework.security.core.authority.SimpleGrantedAuthority;
// import org.springframework.security.core.context.SecurityContextHolder;
// import org.springframework.stereotype.Component;
// import org.springframework.web.filter.OncePerRequestFilter;
// import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;

// import java.io.IOException;
// import java.util.Collections;
// import java.util.List;

// @Component
// public class JwtAuthenticationFilter extends OncePerRequestFilter {

//     @Autowired
//     private JwtTokenUtil jwtTokenUtil;

//     @Override
//     protected void doFilterInternal(HttpServletRequest request,
//             HttpServletResponse response,
//             FilterChain filterChain)
//             throws ServletException, IOException {

//         String authHeader = request.getHeader("Authorization");

//         if (authHeader != null && authHeader.startsWith("Bearer ")) {
//             String token = authHeader.substring(7);
//             System.out.println("🔹 Incoming Token: " + token.substring(0, Math.min(15, token.length())) + "...");

//             if (jwtTokenUtil.validateToken(token)) {
//                 String email = jwtTokenUtil.extractEmail(token);
//                 String role = jwtTokenUtil.extractRole(token);
//                 System.out.println("✅ Valid Token for: " + email + " | Role: " + role);

//                 // ✅ Attach ROLE_ prefix so @PreAuthorize("hasRole('USER')") works
//                 List<SimpleGrantedAuthority> authorities = Collections
//                         .singletonList(new SimpleGrantedAuthority(role.toUpperCase()));
//                 System.out.println("✅ Final authorities: " + authorities);
//                 UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(email,
//                         null, authorities);
//                 authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
//                 SecurityContextHolder.getContext().setAuthentication(authentication);
//             } else {
//                 System.out.println("❌ Invalid or expired token");
//             }
//         } else {
//             System.out.println("⚠️ No Bearer token found for request: " + request.getRequestURI());
//         }

//         filterChain.doFilter(request, response);
//     }

//     // ✅ Skip JWT filter ONLY for auth & signup routes
//     @Override
//     protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
//         String path = request.getServletPath();
//         return path.startsWith("/api/auth/")
//                 || path.equals("/customer/create");
//     }
// }

//As per render

package com.bropay.broPayApi.security;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenUtil jwtTokenUtil;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain)
            throws ServletException, IOException {

        // ✅ VERY IMPORTANT: allow CORS preflight
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7);

        if (jwtTokenUtil.validateToken(token)
                && SecurityContextHolder.getContext().getAuthentication() == null) {

            String email = jwtTokenUtil.extractEmail(token);
            String role = jwtTokenUtil.extractRole(token);

            // ✅ Spring Security REQUIRES "ROLE_" prefix
            String formattedRole = role.startsWith("ROLE_")
                    ? role
                    : "ROLE_" + role.toUpperCase();

            List<SimpleGrantedAuthority> authorities =
                    Collections.singletonList(new SimpleGrantedAuthority(formattedRole));

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            email,
                            null,
                            authorities
                    );

            authentication.setDetails(
                    new WebAuthenticationDetailsSource().buildDetails(request)
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
        }

        filterChain.doFilter(request, response);
    }

    // ✅ Skip JWT for public endpoints
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getServletPath();
        return path.startsWith("/api/auth/")
                || path.equals("/customer/create");
    }
}

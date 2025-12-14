// package com.bropay.broPayApi.config;

// import org.springframework.context.annotation.Bean;
// import org.springframework.context.annotation.Configuration;
// import org.springframework.web.servlet.config.annotation.CorsRegistry;
// import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

// /**
//  * ✅ Centralized CORS configuration for the application.
//  * Works with Spring Boot 3.x and Spring Security 6.x.
//  * 
//  * DO NOT use "*" when allowCredentials(true) is set.
//  * Instead, specify allowedOriginPatterns explicitly.
//  */
// @Configuration
// public class CorsConfigOld {

//     @Bean
//     public WebMvcConfigurer corsConfigurer() {
//         return new WebMvcConfigurer() {
//             @Override
//             public void addCorsMappings(CorsRegistry registry) {
//                 registry.addMapping("/**") // applies to all endpoints
//                         .allowedOriginPatterns(
//                                 "http://localhost:8081",   // React (Vite)
//                                 "http://localhost:3000",   // alternate React dev port
//                                 "https://bropay.vercel.app", // deployed frontend
//                                 "https://yourdomain.com"   // optional production domain
//                         )
//                         .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
//                         .allowedHeaders("*")
//                         .allowCredentials(true); // allow cookies / Authorization headers
//             }
//         };
//     }
// }

package com.bropay.broPayApi.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bropay.broPayApi.websocket.ChatSocketHandler;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.protocol.JacksonJsonSupport;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

@Configuration
public class SocketIOConfig {

    @Bean
    public SocketIOServer socketIOServer(ChatSocketHandler chatHandler) {

        // Use fully qualified name to avoid name collision
        com.corundumstudio.socketio.Configuration socketConfig =
                new com.corundumstudio.socketio.Configuration();

        socketConfig.setHostname("0.0.0.0");
        socketConfig.setPort(9092);
        socketConfig.setOrigin("*");

        // LocalDateTime handling
        JacksonJsonSupport jsonSupport = new JacksonJsonSupport(new JavaTimeModule());
        socketConfig.setJsonSupport(jsonSupport);

        SocketIOServer server = new SocketIOServer(socketConfig);

        // Inject server into handler
        chatHandler.setServer(server);

        // Register event listeners
        server.addListeners(chatHandler);

        return server;
    }
}

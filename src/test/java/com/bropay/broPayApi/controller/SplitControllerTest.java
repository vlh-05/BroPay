package com.bropay.broPayApi.controller;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;

@SpringBootTest
@AutoConfigureMockMvc
class SplitControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void testPercentageSplit() throws Exception {
        String requestJson = """
            {
              "splitType": "PERCENTAGE",
              "participants": [
                { "participantName": "Alice", "sharePercentage": 60.0 },
                { "participantName": "Bob", "sharePercentage": 40.0 }
              ],
              "lineItems": [
                { "description": "Milk", "price": "$4.00", "quantity": "1" },
                { "description": "Bread", "price": "$2.00", "quantity": "1" }
              ]
            }
            """;

        mockMvc.perform(post("/api/split/compute")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].participantName", is("Alice")))
                .andExpect(jsonPath("$[0].amountOwed", is(3.6)))
                .andExpect(jsonPath("$[1].participantName", is("Bob")))
                .andExpect(jsonPath("$[1].amountOwed", is(2.4)));
    }
}

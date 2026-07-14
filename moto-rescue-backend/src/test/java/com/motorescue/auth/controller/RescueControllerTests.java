package com.motorescue.auth.controller;

import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.RescueDtos.CreateRescueRequest;
import com.motorescue.auth.dto.RescueDtos.RescueResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.RescueService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RescueControllerTests {

    private AuthService authService;
    private RescueService rescueService;
    private RescueController controller;
    private FirebaseToken token;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        rescueService = mock(RescueService.class);
        token = mock(FirebaseToken.class);
        controller = new RescueController(authService, rescueService);
        when(authService.authenticate("Bearer token")).thenReturn(token);
    }

    @Test
    void createUsesAuthenticatedTokenInsteadOfClientIdentity() {
        CreateRescueRequest request = new CreateRescueRequest(
                36.75, 3.05, "Campus", 36.76, 3.06, "Exam", true
        );
        RescueResponse response = response("request-1", "searching");
        when(rescueService.create(token, request)).thenReturn(response);

        RescueResponse result = controller.create("Bearer token", request);

        assertThat(result).isEqualTo(response);
        verify(rescueService).create(token, request);
    }

    @Test
    void acceptDelegatesAtomicTransitionToService() {
        RescueResponse response = response("request-1", "accepted");
        when(rescueService.accept(token, "request-1")).thenReturn(response);

        RescueResponse result = controller.accept("Bearer token", "request-1");

        assertThat(result.status()).isEqualTo("accepted");
        verify(rescueService).accept(token, "request-1");
    }

    private RescueResponse response(String id, String status) {
        Instant now = Instant.now();
        return new RescueResponse(
                id, "passenger", "Passenger", 36.75, 3.05, "Campus", 36.76, 3.06, "Exam", true,
                status, null, null, now, now.plusSeconds(300), null, null, null
        );
    }
}

package com.motorescue.auth.controller;

import com.motorescue.auth.dto.DirectionsDtos.RouteRequest;
import com.motorescue.auth.dto.DirectionsDtos.RouteResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.DirectionsService;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class DirectionsControllerTests {

    @Test
    void routeRequiresAuthenticationAndUsesTheBackendService() {
        AuthService authService = mock(AuthService.class);
        DirectionsService directionsService = mock(DirectionsService.class);
        DirectionsController controller = new DirectionsController(authService, directionsService);
        RouteRequest request = new RouteRequest(41.0, 29.0, 41.1, 29.1);
        RouteResponse response = new RouteResponse("encoded", 12.5, 20.0);
        when(directionsService.route(request)).thenReturn(response);

        assertThat(controller.route("Bearer token", request)).isEqualTo(response);
        verify(authService).authenticate("Bearer token");
        verify(directionsService).route(request);
    }
}

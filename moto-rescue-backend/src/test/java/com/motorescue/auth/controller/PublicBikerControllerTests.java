package com.motorescue.auth.controller;

import com.google.firebase.auth.FirebaseToken;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerProfile;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerSummary;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.PublicBikerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PublicBikerControllerTests {
    private AuthService authService;
    private PublicBikerService publicBikerService;
    private PublicBikerController controller;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        publicBikerService = mock(PublicBikerService.class);
        controller = new PublicBikerController(authService, publicBikerService);
        when(authService.authenticate("Bearer token")).thenReturn(mock(FirebaseToken.class));
    }

    @Test
    void searchRequiresAuthenticationAndDelegatesQuery() {
        PublicBikerSummary biker = new PublicBikerSummary(
                "b1", "Biker", null, null, null, null, 4.9, 12, 20
        );
        when(publicBikerService.search("bike")).thenReturn(List.of(biker));

        List<PublicBikerSummary> result = controller.search("Bearer token", "bike");

        assertThat(result).containsExactly(biker);
        verify(authService).authenticate("Bearer token");
        verify(publicBikerService).search("bike");
    }

    @Test
    void profileRequiresAuthentication() {
        PublicBikerSummary biker = new PublicBikerSummary(
                "b1", "Biker", null, null, null, null, 4.9, 12, 20
        );
        PublicBikerProfile profile = new PublicBikerProfile(biker, List.of(), List.of());
        when(publicBikerService.get("b1")).thenReturn(profile);

        assertThat(controller.get("Bearer token", "b1")).isEqualTo(profile);
        verify(authService).authenticate("Bearer token");
        verify(publicBikerService).get("b1");
    }
}

package com.motorescue.auth.controller;

import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerProfile;
import com.motorescue.auth.dto.PublicBikerDtos.PublicBikerSummary;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.PublicBikerService;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/bikers")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class PublicBikerController {
    private final AuthService authService;
    private final PublicBikerService publicBikerService;

    public PublicBikerController(AuthService authService, PublicBikerService publicBikerService) {
        this.authService = authService;
        this.publicBikerService = publicBikerService;
    }

    @GetMapping
    public List<PublicBikerSummary> search(
            @RequestHeader("Authorization") String authorization,
            @RequestParam(defaultValue = "") String query
    ) {
        authService.authenticate(authorization);
        return publicBikerService.search(query);
    }

    @GetMapping("/{bikerId}")
    public PublicBikerProfile get(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String bikerId
    ) {
        authService.authenticate(authorization);
        return publicBikerService.get(bikerId);
    }
}

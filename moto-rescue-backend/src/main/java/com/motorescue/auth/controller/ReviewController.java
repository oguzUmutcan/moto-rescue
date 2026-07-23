package com.motorescue.auth.controller;

import com.motorescue.auth.dto.ReviewDtos.CreateReviewRequest;
import com.motorescue.auth.dto.ReviewDtos.ReviewResponse;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class ReviewController {
    private final AuthService authService;
    private final ReviewService reviewService;

    public ReviewController(AuthService authService, ReviewService reviewService) {
        this.authService = authService;
        this.reviewService = reviewService;
    }

    @PostMapping("/rescue/{rescueId}")
    @ResponseStatus(HttpStatus.CREATED)
    public ReviewResponse create(@RequestHeader("Authorization") String authorization,
                                 @PathVariable String rescueId,
                                 @Valid @RequestBody CreateReviewRequest request) {
        return reviewService.create(authService.authenticate(authorization), rescueId, request);
    }

    @GetMapping("/mine")
    public List<ReviewResponse> mine(@RequestHeader("Authorization") String authorization) {
        return reviewService.mine(authService.authenticate(authorization));
    }

    @GetMapping("/received")
    public List<ReviewResponse> received(@RequestHeader("Authorization") String authorization) {
        return reviewService.received(authService.authenticate(authorization));
    }

}

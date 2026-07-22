package com.motorescue.auth.controller;

import com.motorescue.auth.dto.UserDtos.CreateProfileRequest;
import com.motorescue.auth.dto.UserDtos.RoleRequest;
import com.motorescue.auth.dto.UserDtos.ProfilePhotoRequest;
import com.motorescue.auth.dto.UserDtos.IdentityDocumentRequest;
import com.motorescue.auth.dto.UserDtos.PushTokenRequest;
import com.motorescue.auth.dto.UserDtos.UpdateProfileRequest;
import com.motorescue.auth.dto.UserDtos.UserProfileResponse;
import com.motorescue.auth.dto.UserDtos.LocationRequest;
import com.motorescue.auth.service.AuthService;
import com.motorescue.auth.service.UserService;
import jakarta.validation.Valid;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
@ConditionalOnProperty(name = "firebase.enabled", havingValue = "true", matchIfMissing = true)
public class UserController {
    private final AuthService authService;
    private final UserService userService;

    public UserController(AuthService authService, UserService userService) {
        this.authService = authService;
        this.userService = userService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public UserProfileResponse create(@RequestHeader("Authorization") String authorization,
                                      @Valid @RequestBody CreateProfileRequest request) {
        return userService.create(authService.authenticate(authorization), request);
    }

    @GetMapping
    public UserProfileResponse get(@RequestHeader("Authorization") String authorization) {
        return userService.get(authService.authenticate(authorization));
    }

    @PatchMapping("/role")
    public UserProfileResponse role(@RequestHeader("Authorization") String authorization,
                                    @Valid @RequestBody RoleRequest request) {
        return userService.setRole(authService.authenticate(authorization), request.role());
    }

    @PatchMapping
    public UserProfileResponse update(@RequestHeader("Authorization") String authorization,
                                      @Valid @RequestBody UpdateProfileRequest request) {
        return userService.update(authService.authenticate(authorization), request);
    }

    @PatchMapping("/profile-photo")
    public UserProfileResponse profilePhoto(@RequestHeader("Authorization") String authorization,
                                            @Valid @RequestBody ProfilePhotoRequest request) {
        return userService.setProfilePhoto(authService.authenticate(authorization), request.storagePath());
    }

    @DeleteMapping("/profile-photo")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProfilePhoto(@RequestHeader("Authorization") String authorization) {
        userService.clearProfilePhoto(authService.authenticate(authorization));
    }

    @PatchMapping("/location")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void location(@RequestHeader("Authorization") String authorization,
                         @Valid @RequestBody LocationRequest request) {
        userService.updateLocation(authService.authenticate(authorization), request.latitude(), request.longitude());
    }

    @PatchMapping("/push-token")
    public UserProfileResponse pushToken(@RequestHeader("Authorization") String authorization,
                                         @Valid @RequestBody PushTokenRequest request) {
        return userService.setPushToken(authService.authenticate(authorization), request.expoPushToken());
    }

    @DeleteMapping("/push-token")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePushToken(@RequestHeader("Authorization") String authorization) {
        userService.clearPushToken(authService.authenticate(authorization));
    }

    @PostMapping("/identity-document")
    public UserProfileResponse submitIdentityDocument(@RequestHeader("Authorization") String authorization,
                                                      @Valid @RequestBody IdentityDocumentRequest request) {
        return userService.submitIdentityDocument(
                authService.authenticate(authorization), request.frontStoragePath(), request.backStoragePath()
        );
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@RequestHeader("Authorization") String authorization) {
        userService.delete(authService.authenticate(authorization));
    }
}

import { Stack } from "expo-router";
import React from "react";

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This tells Expo Router to load these two screens in this folder,
        and 'headerShown: false' removes the default ugly top bar!
      */}
      <Stack.Screen name="passenger" />
      <Stack.Screen name="bikers" />
    </Stack>
  );
}

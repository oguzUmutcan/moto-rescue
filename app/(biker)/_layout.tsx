import { Stack } from "expo-router";
import React from "react";

export default function BikerStackLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* This points to our new Biker (tabs) folder below! */}
      <Stack.Screen name="(tabs)" />

      {/* Full screen flows (No tab bar on these) */}
      <Stack.Screen name="incoming" />
      <Stack.Screen name="navigation" />
    </Stack>
  );
}

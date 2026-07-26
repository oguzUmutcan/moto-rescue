import { Stack } from "expo-router";
import React from "react";
// Pure React Native implementation
import { View } from "@/components/localized-native";

export default function PassengerStackLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: "white" }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="request-form"
          options={{
            presentation: "transparentModal",
            animation: "slide_from_bottom",
          }}
        />
        <Stack.Screen name="searching" />
        <Stack.Screen name="ride" />
        <Stack.Screen name="review" />
        <Stack.Screen name="notifications" />
      </Stack>
    </View>
  );
}

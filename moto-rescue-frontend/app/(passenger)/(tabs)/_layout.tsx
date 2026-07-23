import { Tabs } from "expo-router";
import React from "react";
import { Text } from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "@/localization/language-context";

export default function PassengerTabsLayout() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#F2F2F7",
          borderTopWidth: 1,
          // Dynamically calculate height & padding based on the device's gesture bar
          height: 60 + (insets.bottom > 0 ? insets.bottom : 10),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: "#007AFF", // Blue for Passenger
        tabBarInactiveTintColor: "#8E8E93",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "800",
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: t("Map"),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>🗺️</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: t("History"),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>📋</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          title: t("Reviews"),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>⭐</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("Profile"),
          tabBarIcon: ({ focused }) => (
            <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.4 }}>👤</Text>
          ),
        }}
      />
    </Tabs>
  );
}

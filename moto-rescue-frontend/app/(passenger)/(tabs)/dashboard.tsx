// Native Expo application. Web preview resolution errors are expected and should be ignored.
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { Bell, Navigation2, Search, Zap } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LocationMap from "../../../components/location-map";
import type { LocationMapHandle, MapRegion } from "../../../components/location-map.types";
import { rescueApi, RescueRequest } from "../../../api/rescues";
import { passengerRescueRoute } from "../../../utils/app-routing";
import { getAvailablePosition } from "../../../utils/device-location";

export default function PassengerDashboardScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<LocationMapHandle>(null);

  const [initialRegion, setInitialRegion] = useState<MapRegion | null>(null);
  const [activeRequest, setActiveRequest] = useState<RescueRequest | null>(null);

  useEffect(() => {
    if (!isFocused) return;
    let active = true;
    rescueApi.active()
      .then((request) => {
        if (active) setActiveRequest(request);
      })
      .catch((error) => console.error("Could not load active rescue", error));
    return () => {
      active = false;
    };
  }, [isFocused]);

  // SOS Button Pulse Animation setup
  const scale1 = useRef(new Animated.Value(1)).current;
  const opacity1 = useRef(new Animated.Value(0.55)).current;
  const scale2 = useRef(new Animated.Value(1)).current;
  const opacity2 = useRef(new Animated.Value(0.35)).current;

  // 1. Request Location Permissions & Set Initial Region
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        // Fallback region (Algiers) if user denies location
        setInitialRegion({
          latitude: 36.7538,
          longitude: 3.0588,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      try {
        const currentLoc = await getAvailablePosition();
        setInitialRegion({
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (error) {
        console.warn("Current location is unavailable", error);
        setInitialRegion({ latitude: 41.0082, longitude: 28.9784, latitudeDelta: 0.0922, longitudeDelta: 0.0421 });
      }
    })();
  }, []);

  // 2. SOS Button Animation loop
  useEffect(() => {
    const createPulse = (
      scale: Animated.Value,
      opacity: Animated.Value,
      delay: number,
    ) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(scale, {
              toValue: 2.4,
              duration: 1600,
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: 1600,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.55,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      );
    };

    createPulse(scale1, opacity1, 0).start();
    createPulse(scale2, opacity2, 400).start();
  }, [scale1, opacity1, scale2, opacity2]);

  const handleLocateMe = async () => {
    try {
      const currentLoc = await getAvailablePosition();
      // Animate the camera back to the user's location smoothly
      mapRef.current?.animateToRegion(
        {
          latitude: currentLoc.coords.latitude,
          longitude: currentLoc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        200,
      );
    } catch (error) {
      console.error("Could not get location", error);
    }
  };

  const handleSOSPress = () => {
    if (activeRequest) {
      router.navigate(passengerRescueRoute(activeRequest));
      return;
    }
    router.navigate("/(passenger)/request-form");
  };

  const handleOpenActiveRequest = () => {
    if (!activeRequest) return;
    router.navigate(passengerRescueRoute(activeRequest));
  };

  return (
    <View
      className="flex-1 bg-[#E5EBF0]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* MAP LAYER */}
      {initialRegion ? (
        <LocationMap
          ref={mapRef}
          initialRegion={initialRegion}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            {
              backgroundColor: "#E5EBF0",
              alignItems: "center",
              justifyContent: "center",
            },
          ]}
        >
          <Text style={{ color: "#8E8E93", fontWeight: "bold" }}>
            Finding your location...
          </Text>
        </View>
      )}

      {/* Top Search Bar */}
      <View className="absolute top-0 w-full bg-white rounded-b-3xl shadow-md z-10">
        <View style={{ paddingTop: insets.top, paddingBottom: 16 }}>
          <View className="flex-row items-center px-4 pt-2 gap-3">
            <View className="flex-1 h-11 bg-[#F2F2F7] rounded-xl flex-row items-center px-3 gap-2">
              <Search size={16} color="#8E8E93" />
              <Text className="text-[15px] text-[#AEAEB2] font-medium">
                Where are you going?
              </Text>
            </View>
            <TouchableOpacity className="w-11 h-11 rounded-xl bg-[#007AFF] items-center justify-center relative">
              <Bell size={20} color="white" />
              <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF3B30] border-2 border-[#007AFF]" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Status Widget */}
      <TouchableOpacity
        onPress={activeRequest ? handleOpenActiveRequest : undefined}
        disabled={!activeRequest}
        className="absolute bottom-[100px] left-4 right-[90px] bg-white rounded-2xl p-3.5 flex-row items-center shadow-lg gap-3"
      >
        <View className="w-9 h-9 rounded-full bg-[#EEF4FF] items-center justify-center">
          <Text className="text-[18px]">😊</Text>
        </View>
        <View className="flex-1">
          <Text className="text-[13px] font-black text-[#1C1C1E]">
            {activeRequest ? "Active rescue request" : "No active request"}
          </Text>
          <Text className="text-[12px] text-[#8E8E93]">
            {activeRequest
              ? activeRequest.status === "searching"
                ? "Searching for a nearby biker · tap to reopen"
                : "Biker assigned · tap to reopen"
              : "Tap SOS if you need help"}
          </Text>
        </View>
        <View className={`w-2.5 h-2.5 rounded-full ${activeRequest ? "bg-[#FF9500]" : "bg-[#34C759]"}`} />
      </TouchableOpacity>

      {/* Locate Me Button */}
      <TouchableOpacity
        onPress={handleLocateMe}
        className="absolute bottom-[170px] left-4 w-11 h-11 rounded-full bg-white items-center justify-center shadow-md z-10"
      >
        <Navigation2 size={20} color="#007AFF" />
      </TouchableOpacity>

      {/* Giant SOS Button */}
      <View className="absolute bottom-[110px] right-5 items-center z-10">
        <View className="relative w-[68px] h-[68px] items-center justify-center mb-2">
          {/* Animated Rings */}
          <Animated.View
            style={{ transform: [{ scale: scale1 }], opacity: opacity1 }}
            className="absolute w-full h-full rounded-full bg-[#FF9500]"
          />
          <Animated.View
            style={{ transform: [{ scale: scale2 }], opacity: opacity2 }}
            className="absolute w-full h-full rounded-full bg-[#FF9500]"
          />

          {/* Main Button */}
          <TouchableOpacity
            onPress={handleSOSPress}
            activeOpacity={0.8}
            className="w-full h-full rounded-full bg-[#FF9500] items-center justify-center z-10 shadow-lg"
            style={{
              shadowColor: "#FF9500",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
              elevation: 10,
            }}
          >
            <Zap size={28} color="white" fill="white" />
          </TouchableOpacity>
        </View>

        {/* SOS Label */}
        <View className="bg-white px-2.5 py-0.5 rounded-full shadow-sm">
          <Text className="text-[10px] font-black text-[#FF9500] tracking-widest uppercase">
            SOS
          </Text>
        </View>
      </View>
    </View>
  );
}

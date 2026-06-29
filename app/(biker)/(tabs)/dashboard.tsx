import * as Location from "expo-location";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Navigation2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../../config/firebase";

export default function BikerDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);

  const [online, setOnline] = useState(true);
  const [name, setName] = useState("Loading...");

  // ADD NEW STATES FOR STATS
  const [todayRescues, setTodayRescues] = useState("0");
  const [rating, setRating] = useState("5.0");
  const [totalRescues, setTotalRescues] = useState("0");

  const [location, setLocation] = useState<Location.LocationObject | null>(
    null,
  );
  const [initialRegion, setInitialRegion] = useState<any>(null);

  const handleSimulateIncoming = () => {
    router.push("/(biker)/incoming");
  };

  const handleToggleOnline = async () => {
    const newStatus = !online;
    setOnline(newStatus);

    try {
      await SecureStore.setItemAsync("biker_online_status", String(newStatus));
    } catch (error) {
      console.error("Error saving online status:", error);
    }
  };

  const handleLocateMe = async () => {
    try {
      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc);

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

  // 1. Load SecureStore Online Status
  useEffect(() => {
    const loadOnlineStatus = async () => {
      try {
        const savedStatus = await SecureStore.getItemAsync(
          "biker_online_status",
        );
        if (savedStatus !== null) {
          setOnline(savedStatus === "true");
        }
      } catch (error) {
        console.error("Error loading online status:", error);
      }
    };
    loadOnlineStatus();
  }, []);

  // 2. Fetch User Data
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setName(data.name || user.displayName || "Biker");

            // FETCH STATS FROM FIRESTORE (with safe fallbacks)
            setTodayRescues(data.todayRescues?.toString() || "0");
            setRating(data.rating?.toString() || "5.0");
            setTotalRescues(data.totalRescues?.toString() || "0");
          } else {
            setName(user.displayName || "Biker");
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          setName("Biker");
        }
      } else {
        setName("Biker");
      }
    });

    return () => unsubscribe();
  }, []);

  // 3. Request Location Permissions & Set Initial Region
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        console.warn("Permission to access location was denied");
        // Fallback region if user denies location
        setInitialRegion({
          latitude: 36.7538,
          longitude: 3.0588,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        });
        return;
      }

      let currentLoc = await Location.getCurrentPositionAsync({});
      setLocation(currentLoc);

      // Calculate and set the initial region based on real GPS
      setInitialRegion({
        latitude: currentLoc.coords.latitude,
        longitude: currentLoc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    })();
  }, []);

  return (
    <View
      className="flex-1 bg-[#E5EBF0]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* MAP LAYER */}
      {initialRegion ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={true}
          showsMyLocationButton={false}
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

      {/* Top Header Card */}
      <View
        className={`absolute top-0 w-full rounded-b-3xl shadow-md z-10 ${online ? "bg-[#071510]" : "bg-white"}`}
      >
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="flex-row items-center justify-between px-5 pt-2 pb-5">
            <View>
              <Text
                className={`text-[12px] font-semibold ${online ? "text-white/60" : "text-[#8E8E93]"}`}
              >
                Welcome back,
              </Text>
              <Text
                className={`text-[20px] font-black tracking-tight ${online ? "text-white" : "text-[#1C1C1E]"}`}
              >
                {name} 🏍
              </Text>
            </View>

            {/* Online Toggle */}
            <TouchableOpacity
              onPress={handleToggleOnline}
              activeOpacity={0.8}
              className={`flex-row items-center rounded-full px-4 py-2.5 ${online ? "bg-[#34C759]" : "bg-[#F2F2F7]"}`}
            >
              <View
                className={`w-2.5 h-2.5 rounded-full mr-2 ${online ? "bg-white" : "bg-[#C7C7CC]"}`}
              />
              <Text
                className={`text-[14px] font-bold ${online ? "text-white" : "text-[#8E8E93]"}`}
              >
                {online ? "Online" : "Offline"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View className="absolute top-[135px] w-full px-4 flex-row gap-2.5 z-10">
        {[
          {
            label: "Today",
            value: todayRescues,
            unit: "rescues",
            color: "text-[#34C759]",
          },
          {
            label: "Rating",
            value: rating,
            unit: "avg",
            color: "text-[#FF9500]",
          },
          {
            label: "Total",
            value: totalRescues,
            unit: "rescues",
            color: "text-[#007AFF]",
          },
        ].map((stat, i) => (
          <View
            key={i}
            className="flex-1 bg-white rounded-2xl py-3 items-center shadow-sm"
          >
            <Text className="text-[11px] text-[#8E8E93] font-semibold mb-0.5">
              {stat.label}
            </Text>
            <Text
              className={`text-[22px] font-black tracking-tight ${stat.color}`}
            >
              {stat.value}
            </Text>
            <Text className="text-[11px] text-[#AEAEB2] font-medium">
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* Locate Me Button */}
      <TouchableOpacity
        onPress={handleLocateMe}
        className="absolute right-4 w-11 h-11 rounded-full bg-white items-center justify-center shadow-md z-10"
        style={{ bottom: online ? 230 : 120 }}
      >
        <Navigation2 size={20} color="#007AFF" />
      </TouchableOpacity>

      {/* Status Panel */}
      {online && (
        <View className="absolute bottom-[60px] left-4 right-4 bg-white rounded-2xl p-4 shadow-lg z-10">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-xl bg-[#EDFAF3] items-center justify-center">
              <View className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
            </View>
            <View className="flex-1">
              <Text className="text-[14px] font-black text-[#1C1C1E]">
                Online · Accepting requests
              </Text>
              <Text className="text-[12px] text-[#34C759] font-bold mt-0.5">
                3 passengers in your area
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleSimulateIncoming}
            activeOpacity={0.8}
            className="w-full h-12 rounded-xl bg-[#FF9500] items-center justify-center shadow-sm"
          >
            <Text className="text-white text-[15px] font-bold">
              🔔 Simulate Incoming Request
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

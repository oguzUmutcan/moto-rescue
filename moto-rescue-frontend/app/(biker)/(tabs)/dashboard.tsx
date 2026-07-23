import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { getAvailablePosition } from "../../../utils/device-location";
import { onAuthStateChanged } from "firebase/auth";
import { Navigation2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth } from "../../../config/firebase";
import LocationMap from "../../../components/location-map";
import type { LocationMapHandle, MapRegion } from "../../../components/location-map.types";
import { rescueApi, RescueRequest } from "../../../api/rescues";
import { userApi } from "../../../api/users";
import { bikerRescueRoute } from "../../../utils/app-routing";

export default function BikerDashboardScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const mapRef = useRef<LocationMapHandle>(null);

  const [online, setOnline] = useState(false);
  const [onlineBusy, setOnlineBusy] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const [identityDocumentStatus, setIdentityDocumentStatus] = useState<"not_submitted" | "pending" | "verified" | "rejected">("not_submitted");
  const [name, setName] = useState("Loading...");
  const [pendingRequestId, setPendingRequestId] = useState<string | null>(null);
  const [activeRequest, setActiveRequest] = useState<RescueRequest | null>(null);

  // ADD NEW STATES FOR STATS
  const [todayRescues, setTodayRescues] = useState("0");
  const [rating, setRating] = useState("5.0");
  const [totalRescues, setTotalRescues] = useState("0");

  const [initialRegion, setInitialRegion] = useState<MapRegion | null>(null);

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

  const handleViewPendingRequest = () => {
    if (activeRequest) {
      router.navigate(bikerRescueRoute(activeRequest));
      return;
    }
    if (pendingRequestId) {
      router.navigate({
        pathname: "/(biker)/incoming",
        params: { requestId: pendingRequestId },
      });
    }
  };

  const handleToggleOnline = async () => {
    const newStatus = !online;
    const hasVerifiedLicense = identityDocumentStatus === "verified";
    if (newStatus && !hasVerifiedLicense) {
      Alert.alert(
        identityDocumentStatus === "pending" ? "Verification pending" : "Driver's license required",
        identityDocumentStatus === "pending"
          ? "Your driver's license will be verified automatically about one minute after upload."
          : "Upload both sides of your driver's license before going online.",
        [
          { text: "Upload license", onPress: () => router.navigate("/(auth)/profile-biker") },
          { text: "Cancel", style: "cancel" },
        ],
      );
      return;
    }
    setOnlineBusy(true);
    try {
      if (newStatus) {
        const position = await getAvailablePosition();
        await userApi.updateLocation(position.coords.latitude, position.coords.longitude);
      }
      const profile = await userApi.update({ online: newStatus });
      setOnline(profile.online);
    } catch (error) {
      console.error("Error saving online status:", error);
      Alert.alert("Could not change status", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setOnlineBusy(false);
    }
  };

  const handleLocateMe = async () => {
    try {
      const currentLoc = await getAvailablePosition();
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

  useEffect(() => {
    if (!online || activeRequest) {
      setPendingRequestId(null);
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const requests = await rescueApi.open();
        const nextRequestId = requests[0]?.id ?? null;
        if (active) {
          setPendingRequestId(nextRequestId);
        }
      } catch (error) {
        console.error("Could not load open rescue requests", error);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [activeRequest, online]);

  useEffect(() => {
    if (!online) return;
    let subscription: Location.LocationSubscription | null = null;
    let active = true;
    void getAvailablePosition()
      .then((position) => userApi.updateLocation(position.coords.latitude, position.coords.longitude))
      .then(() => Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 20 },
        (position) => {
          if (active) void userApi.updateLocation(position.coords.latitude, position.coords.longitude)
            .catch((error) => console.error("Could not publish online location", error));
        },
      ))
      .then((value) => { if (active) subscription = value; else value.remove(); })
      .catch((error) => {
        if (!active) return;
        console.warn("Online location tracking stopped", error);
        setOnline(false);
        void userApi.update({ online: false }).catch(() => undefined);
        Alert.alert(
          "Location unavailable",
          error instanceof Error ? error.message : "Location access is required to remain online.",
        );
      });
    return () => { active = false; subscription?.remove(); };
  }, [online]);

  // 2. Fetch user data and live stats
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const [data, history] = await Promise.all([
            userApi.get(),
            rescueApi.history(),
          ]);
          if (data) {
            setName(data.name || user.displayName || "Biker");
            const hasVerifiedLicense = data.identityDocumentStatus === "verified";
            setIdentityDocumentStatus(data.identityDocumentStatus);
            if (data.online && !hasVerifiedLicense) {
              await userApi.update({ online: false });
              setOnline(false);
            } else {
              setOnline(data.online);
            }

            const today = new Date().toDateString();
            const completedToday = history.filter((ride) =>
              ride.status === "completed"
              && ride.completedAt
              && new Date(ride.completedAt).toDateString() === today
            ).length;
            setTodayRescues(String(completedToday));
            setRating(data.rating?.toString() || "5.0");
            setTotalRescues(data.totalRescues?.toString() || "0");
          } else {
            setName(user.displayName || "Biker");
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
          setName("Biker");
        } finally {
          setProfileLoaded(true);
        }
      } else {
        setName("Biker");
        setProfileLoaded(true);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (identityDocumentStatus !== "pending") return;
    let active = true;
    const refreshVerification = async () => {
      try {
        const profile = await userApi.get();
        if (active) setIdentityDocumentStatus(profile.identityDocumentStatus);
      } catch (error) {
        console.error("Could not refresh license verification", error);
      }
    };
    const timer = setInterval(refreshVerification, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [identityDocumentStatus]);

  // 3. Request Location Permissions & Set Initial Region
  useEffect(() => {
    void (async () => {
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
              disabled={!profileLoaded || onlineBusy}
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
                {activeRequest
                  ? activeRequest.status === "in_progress"
                    ? "Rescue ride in progress"
                    : "Passenger pickup in progress"
                  : pendingRequestId
                    ? "A passenger needs help nearby"
                    : "Waiting for nearby requests"}
              </Text>
            </View>
          </View>

          {(activeRequest || pendingRequestId) && (
            <TouchableOpacity
              onPress={handleViewPendingRequest}
              activeOpacity={0.8}
              className="w-full h-12 rounded-xl bg-[#FF9500] items-center justify-center shadow-sm"
            >
              <Text className="text-white text-[15px] font-bold">
                {activeRequest ? "Resume Active Rescue" : "View Rescue Request"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { ExternalLink, MapPin } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Linking, Platform, Text, TouchableOpacity, View } from "react-native";
import { rescueApi, RescueRequest } from "../../api/rescues";
import { badgeApi } from "../../api/badges";
import LocationMap from "../../components/location-map";
import type { LocationMapHandle } from "../../components/location-map.types";

export default function BikerNavigationScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const mapRef = useRef<LocationMapHandle>(null);
  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    let active = true;
    const load = async () => {
      try {
        const data = await rescueApi.get(requestId);
        if (!active) return;
        setRequest(data);
        if (data.status === "cancelled") {
          Alert.alert("Request cancelled", "The passenger cancelled this rescue.", [
            { text: "OK", onPress: () => router.replace("/(biker)/(tabs)/dashboard") },
          ]);
        }
      } catch (error) {
        console.error("Could not refresh navigation", error);
      }
    };
    void load();
    const timer = setInterval(load, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [requestId, router]);

  const inProgress = request?.status === "in_progress";
  const targetLatitude = request
    ? (inProgress ? (request.destinationLatitude || request.latitude) : request.latitude)
    : null;
  const targetLongitude = request
    ? (inProgress ? (request.destinationLongitude || request.longitude) : request.longitude)
    : null;

  useEffect(() => {
    if (targetLatitude === null || targetLongitude === null) return;
    mapRef.current?.animateToRegion({ latitude: targetLatitude, longitude: targetLongitude, latitudeDelta: 0.025, longitudeDelta: 0.025 }, 500);
  }, [targetLatitude, targetLongitude]);

  const performAction = async () => {
    if (!requestId || !request || busy) return;
    setBusy(true);
    try {
      if (request.status === "accepted") {
        setRequest(await rescueApi.start(requestId));
      } else if (request.status === "in_progress") {
        await rescueApi.complete(requestId);
        const badges = await badgeApi.mine().catch(() => null);
        const justEarned = badges?.badges.find((badge) =>
          badge.earnedAt && Date.now() - new Date(badge.earnedAt).getTime() < 60_000,
        );
        Alert.alert(
          justEarned ? `${justEarned.emoji} Badge unlocked!` : "Rescue completed",
          justEarned ? `${justEarned.name}\n${justEarned.description}` : "The ride has been added to your history.", [
          { text: "View history", onPress: () => router.replace("/(biker)/(tabs)/history") },
          { text: justEarned ? "View badges" : "Done", onPress: () => router.replace(justEarned ? "/(biker)/(tabs)/badges" : "/(biker)/(tabs)/dashboard") },
        ]);
      }
    } catch (error) {
      Alert.alert("Could not update ride", error instanceof Error ? error.message : "Please try again");
    } finally {
      setBusy(false);
    }
  };

  const confirmAction = () => {
    if (!request) return;
    Alert.alert(
      request.status === "accepted" ? "Start ride?" : "Complete ride?",
      request.status === "accepted"
        ? "Confirm that the passenger is on board before starting."
        : "Confirm that the passenger reached the destination.",
      [{ text: "Not yet", style: "cancel" }, { text: "Confirm", onPress: performAction }],
    );
  };

  const openGoogleMaps = async () => {
    if (targetLatitude === null || targetLongitude === null) return;
    const destination = `${targetLatitude},${targetLongitude}`;
    const nativeUrl = Platform.OS === "android"
      ? `google.navigation:q=${destination}&mode=d`
      : `comgooglemaps://?daddr=${destination}&directionsmode=driving`;
    const webUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}&travelmode=driving&dir_action=navigate`;
    try {
      if (await Linking.canOpenURL(nativeUrl)) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      Alert.alert("Navigation unavailable", "Google Maps could not be opened on this device.");
    }
  };

  if (!request || targetLatitude === null || targetLongitude === null) {
    return <View className="flex-1 items-center justify-center bg-[#E5EBF0]"><Text className="font-bold text-[#8E8E93]">Loading rescue...</Text></View>;
  }

  const targetLabel = inProgress ? request.destinationLabel : request.pickupLabel;
  const target = { latitude: targetLatitude, longitude: targetLongitude };
  return (
    <View className="flex-1 bg-[#E5EBF0]">
      <LocationMap ref={mapRef} initialRegion={{ ...target, latitudeDelta: 0.025, longitudeDelta: 0.025 }} selectedCoordinate={target} />

      <View className={`absolute top-0 left-0 right-0 pt-14 px-5 pb-5 shadow-lg ${inProgress ? "bg-[#34C759]" : "bg-[#007AFF]"}`}>
        <Text className="text-[12px] text-white/70 font-black tracking-widest uppercase">{inProgress ? "En route to destination" : "Head to pickup"}</Text>
        <Text className="text-[22px] font-black text-white mt-1" numberOfLines={2}>{targetLabel}</Text>
        <Text className="text-[13px] text-white/90 font-bold mt-1">{inProgress ? "Passenger is on board" : "Passenger is waiting"}</Text>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] px-5 pt-5 pb-9 shadow-2xl">
        <View className="flex-row items-center mb-4">
          <View className="w-12 h-12 rounded-full bg-[#EEF4FF] items-center justify-center"><Text className="text-[24px]">🙋</Text></View>
          <View className="ml-3 flex-1"><Text className="text-[18px] font-black text-[#1C1C1E]">{request.passengerName}</Text><Text className="text-[13px] text-[#8E8E93]">{request.urgency} · {request.needsHelmet ? "Helmet requested" : "No helmet needed"}</Text></View>
        </View>
        <View className="bg-[#F2F2F7] rounded-2xl p-3 flex-row items-center mb-4">
          <MapPin size={17} color={inProgress ? "#FF3B30" : "#007AFF"} />
          <View className="ml-3 flex-1"><Text className="text-[11px] text-[#8E8E93] font-bold uppercase">{inProgress ? "Destination" : "Pickup"}</Text><Text className="text-[15px] font-black text-[#1C1C1E]">{targetLabel}</Text></View>
        </View>
        <TouchableOpacity onPress={openGoogleMaps} className="h-12 rounded-2xl border-2 border-[#4285F4] items-center justify-center flex-row mb-3">
          <ExternalLink size={18} color="#4285F4" />
          <Text className="text-[#4285F4] text-[16px] font-black ml-2">Open in Google Maps</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmAction} disabled={busy} className={`h-14 rounded-2xl items-center justify-center ${inProgress ? "bg-[#34C759]" : "bg-[#007AFF]"}`}>
          <Text className="text-white text-[18px] font-black">{busy ? "Updating..." : inProgress ? "✓ Complete Ride" : "🏍️ Start Ride"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

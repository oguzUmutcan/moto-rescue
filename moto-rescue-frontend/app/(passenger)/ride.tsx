import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, ShieldCheck } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { rescueApi, RescueRequest } from "../../api/rescues";
import LocationMap from "../../components/location-map";
import ProfileAvatar from "../../components/profile-avatar";

export default function PassengerRideScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<RescueRequest | null>(null);
  const completionHandled = useRef(false);

  useEffect(() => {
    if (!requestId) return;
    let active = true;
    const load = async () => {
      try {
        const data = await rescueApi.get(requestId);
        if (!active) return;
        setRequest(data);
        if (data.status === "cancelled") router.replace("/(passenger)/(tabs)/dashboard");
        if (data.status === "completed" && !completionHandled.current) {
          completionHandled.current = true;
          router.replace({ pathname: "/(passenger)/review", params: { requestId } });
        }
      } catch (error) {
        console.error("Could not refresh ride", error);
      }
    };
    void load();
    const timer = setInterval(load, 2500);
    return () => { active = false; clearInterval(timer); };
  }, [requestId, router]);

  const handleCancel = async () => {
    if (!requestId) return;
    try {
      await rescueApi.cancel(requestId);
      router.replace("/(passenger)/(tabs)/dashboard");
    } catch (error) {
      Alert.alert("Could not cancel", error instanceof Error ? error.message : "Please try again");
    }
  };

  if (!request) {
    return <View className="flex-1 items-center justify-center bg-[#E5EBF0]"><Text className="font-bold text-[#8E8E93]">Loading ride...</Text></View>;
  }

  const inProgress = request.status === "in_progress";
  return (
    <View className="flex-1 bg-[#E5EBF0]">
      <LocationMap
        initialRegion={{
          latitude: request.destinationLatitude || request.latitude,
          longitude: request.destinationLongitude || request.longitude,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        selectedCoordinate={{
          latitude: request.destinationLatitude || request.latitude,
          longitude: request.destinationLongitude || request.longitude,
        }}
        bikerCoordinate={request.bikerLatitude !== null && request.bikerLongitude !== null ? {
          latitude: request.bikerLatitude,
          longitude: request.bikerLongitude,
        } : null}
      />

      <View className="absolute top-0 left-0 right-0 bg-white rounded-b-3xl shadow-lg pt-14 px-5 pb-5">
        <Text className="text-[12px] text-[#8E8E93] font-black tracking-widest uppercase">{inProgress ? "Ride in progress" : "Biker on the way"}</Text>
        <View className="flex-row items-center mt-2">
          <ProfileAvatar storagePath={request.bikerProfilePhotoPath} />
          <View className="ml-3 flex-1"><Text className="text-[18px] font-black text-[#1C1C1E]">{request.bikerName ?? "Assigned biker"}</Text><Text className="text-[13px] text-[#34C759] font-bold">{inProgress ? "Taking you to destination" : "Heading to your pickup"}</Text></View>
        </View>
      </View>

      <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] px-5 pt-5 pb-9 shadow-2xl">
        <View className="bg-[#F2F2F7] rounded-2xl p-4 flex-row items-center mb-3">
          <MapPin size={19} color="#FF3B30" />
          <View className="ml-3 flex-1"><Text className="text-[11px] text-[#8E8E93] font-bold uppercase">Destination</Text><Text className="text-[16px] font-black text-[#1C1C1E] mt-0.5">{request.destinationLabel}</Text></View>
        </View>
        <View className="bg-[#EDFAF3] rounded-2xl p-3 flex-row items-center">
          <ShieldCheck size={18} color="#34C759" /><Text className="ml-2 flex-1 text-[#248A3D] font-bold">{inProgress ? "Ride started. Follow the route progress here." : "Wait at the selected pickup point."}</Text>
        </View>
        {!inProgress && request.boardingCode && (
          <View className="mt-3 rounded-2xl bg-[#EEF4FF] p-4 items-center">
            <Text className="text-[11px] font-black uppercase tracking-widest text-[#007AFF]">Boarding code</Text>
            <Text className="mt-1 text-[32px] font-black tracking-[10px] text-[#1C1C1E]">{request.boardingCode}</Text>
            <Text className="mt-1 text-center text-[12px] font-semibold text-[#636366]">Share this code only after the correct biker arrives.</Text>
          </View>
        )}
        {!inProgress && (
          <TouchableOpacity onPress={handleCancel} className="mt-4 py-3"><Text className="text-center text-[#FF3B30] font-black">Cancel Request</Text></TouchableOpacity>
        )}
      </View>
    </View>
  );
}

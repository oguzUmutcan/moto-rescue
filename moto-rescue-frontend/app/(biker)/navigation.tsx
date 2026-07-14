import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, PhoneCall } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Alert, StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { rescueApi, RescueRequest } from "../../api/rescues";

export default function BikerNavigationScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [phase, setPhase] = useState<"pickup" | "dest">("pickup");
  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!requestId) return;
    rescueApi.get(requestId).then((data) => {
      setRequest(data);
      if (data.status === "in_progress") setPhase("dest");
    }).catch((error) => Alert.alert("Ride unavailable", error.message));
  }, [requestId]);

  const isPickup = phase === "pickup";
  const headerColor = isPickup ? "bg-[#007AFF]" : "bg-[#34C759]";

  const handleAction = async () => {
    if (!requestId || busy) return;
    setBusy(true);
    try {
      if (isPickup) {
        setRequest(await rescueApi.start(requestId));
        setPhase("dest");
      } else {
        await rescueApi.complete(requestId);
        router.replace("/(biker)/(tabs)/dashboard");
      }
    } catch (error) {
      Alert.alert("Could not update ride", error instanceof Error ? error.message : "Please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="flex-1 bg-[#E5EBF0] relative">
      {/* MAP LAYER */}
      <View
        style={StyleSheet.absoluteFillObject}
        className="bg-[#e0e5ec] items-center justify-center"
      >
        <View className="absolute w-full h-full opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={`h-${i}`}
              className="absolute w-full h-[1px] bg-black"
              style={{ top: i * 50 }}
            />
          ))}
        </View>
        <View className="absolute w-1 h-32 bg-[#007AFF] rounded-full transform -rotate-45" />
      </View>

      {/* TOP OVERLAY: Dynamic GPS Header */}
      <View
        className={`absolute top-0 w-full z-10 pb-4 shadow-lg pt-12 ${headerColor}`}
      >
        <View className="px-5 pt-2">
          <Text className="text-[12px] text-white/70 font-black tracking-widest uppercase mb-1">
            {isPickup ? "Head to pickup" : "En route to destination"}
          </Text>
          <Text className="text-[24px] font-black text-white tracking-tight">
            {isPickup ? "Rue Didouche Mourad" : "Faculté de Droit, Ben Aknoun"}
          </Text>
          <Text className="text-[15px] text-white/90 font-medium mt-1">
            {isPickup ? "850 m · ~3 min" : "4.2 km · ~12 min"}
          </Text>
        </View>

        <View className="flex-row px-5 mt-4 gap-2">
          <View
            className={`flex-1 h-1.5 rounded-full ${isPickup ? "bg-white" : "bg-white/40"}`}
          />
          <View
            className={`flex-1 h-1.5 rounded-full ${!isPickup ? "bg-white" : "bg-white/40"}`}
          />
        </View>
      </View>

      {/* BOTTOM OVERLAY: Passenger Details */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-[32px] shadow-2xl pt-3 pb-8 px-5 z-10">
        <View className="w-10 h-1.5 rounded-full bg-[#D1D1D6] self-center mb-5" />

        <View className="flex-row items-center mb-5">
          <View className="w-14 h-14 rounded-full bg-[#EEF4FF] items-center justify-center mr-4">
            <Text className="text-[26px]">🙋</Text>
          </View>
          <View className="flex-1">
            <Text className="text-[17px] font-black text-[#1C1C1E]">
              {request?.passengerName ?? "Passenger"}
            </Text>
            <Text className="text-[14px] text-[#8E8E93] mt-0.5">
              {isPickup ? "Waiting at pickup point" : "On board · En route"}
            </Text>
          </View>
          <TouchableOpacity className="w-11 h-11 rounded-2xl bg-[#EEF4FF] items-center justify-center">
            <PhoneCall size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View className="bg-[#F2F2F7] rounded-2xl p-3 flex-row items-center mb-5">
          <MapPin size={16} color="#FF3B30" className="mr-3" />
          <View>
            <Text className="text-[12px] text-[#8E8E93] font-medium">
              Final destination
            </Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E]">
              Faculté de Droit, Ben Aknoun
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleAction}
          disabled={busy || !request}
          className={`w-full h-14 rounded-2xl items-center justify-center flex-row shadow-sm ${headerColor}`}
        >
          <Text className="text-white text-[18px] font-black mr-2">
            {isPickup ? "🏍 Start Ride" : "✓ Complete Ride"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

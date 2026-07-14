import { useLocalSearchParams, useRouter } from "expo-router";
import { MapPin, PhoneCall, Shield, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert, StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { rescueApi, RescueRequest } from "../../api/rescues";

export default function PassengerRideScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [request, setRequest] = useState<RescueRequest | null>(null);

  useEffect(() => {
    if (!requestId) return;
    const load = () => rescueApi.get(requestId).then((data) => {
      setRequest(data);
      if (data.status === "completed" || data.status === "cancelled") {
        router.replace("/(passenger)/(tabs)/dashboard");
      }
    }).catch((error) => console.error("Could not refresh ride", error));
    load();
    const timer = setInterval(load, 3000);
    return () => clearInterval(timer);
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

  return (
    <View className="flex-1 bg-[#E5EBF0] relative">
      {/* MAP LAYER (Placeholder) */}
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
        <View className="absolute top-[40%] right-[30%] items-center justify-center">
          <View className="w-8 h-8 rounded-full bg-[#FF9500] items-center justify-center border-2 border-white shadow-sm">
            <Text className="text-[14px]">🏍</Text>
          </View>
        </View>
        <View className="absolute bottom-[40%] left-[30%] w-5 h-5 rounded-full bg-[#007AFF] border-[3px] border-white shadow-sm" />
      </View>

      {/* TOP OVERLAY: Biker Info Card */}
      <View className="absolute top-0 w-full bg-white rounded-b-3xl shadow-lg z-10 pt-12">
        <View className="px-5 pb-4 pt-2 flex-row items-center">
          <View className="relative">
            <View className="w-14 h-14 rounded-full bg-[#EEF4FF] border-2 border-[#34C759] items-center justify-center">
              <Text className="text-[26px]">🧑</Text>
            </View>
            <View className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-[#34C759] border-[2px] border-white" />
          </View>

          <View className="flex-1 ml-3">
            <Text className="text-[17px] font-black text-[#1C1C1E]">
              {request?.bikerName ?? "Assigned biker"}
            </Text>
            <View className="flex-row items-center mt-0.5">
              <Star size={14} color="#FF9500" fill="#FF9500" />
              <Text className="text-[13px] text-[#8E8E93] ml-1 font-medium">
                4.9 · 127 rescues · Yamaha YBR
              </Text>
            </View>
          </View>

          <TouchableOpacity className="w-11 h-11 rounded-2xl bg-[#EEF4FF] items-center justify-center">
            <PhoneCall size={20} color="#007AFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* BOTTOM OVERLAY: Ride Details & Safety Code */}
      <View className="absolute bottom-0 w-full bg-white rounded-t-[32px] shadow-2xl pt-3 pb-8 px-5 z-10">
        <View className="w-10 h-1.5 rounded-full bg-[#D1D1D6] self-center mb-5" />

        <View className="flex-row justify-between items-start mb-5">
          <View>
            <Text className="text-[13px] text-[#8E8E93] font-bold mb-1">
              Biker arriving in
            </Text>
            <Text className="text-[40px] font-black text-[#007AFF] tracking-tight leading-10">
              4 min
            </Text>
          </View>

          {/* Safety Code Block */}
          <View className="bg-[#FFF0E0] border-2 border-[#FF9500] rounded-2xl p-3 items-center">
            <Text className="text-[11px] text-[#FF9500] font-black tracking-widest uppercase mb-1.5">
              Safety Code
            </Text>
            <View className="flex-row gap-1.5">
              {["7", "3", "4", "1"].map((digit, i) => (
                <View
                  key={i}
                  className="w-8 h-10 rounded-lg bg-[#FF9500] items-center justify-center"
                >
                  <Text className="text-white text-[22px] font-black">
                    {digit}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        <View className="bg-[#EEF4FF] rounded-2xl p-3 flex-row items-center mb-3">
          <Shield size={18} color="#007AFF" className="mr-2" />
          <Text className="text-[14px] text-[#007AFF] flex-1">
            <Text className="font-bold">Show this code to the biker</Text>{" "}
            before boarding
          </Text>
        </View>

        <View className="bg-[#F2F2F7] rounded-2xl p-3 flex-row items-center mb-5">
          <MapPin size={16} color="#FF3B30" className="mr-3" />
          <View>
            <Text className="text-[12px] text-[#8E8E93] font-medium">
              Destination
            </Text>
            <Text className="text-[15px] font-bold text-[#1C1C1E]">
              Faculté de Droit, Ben Aknoun
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleCancel} activeOpacity={0.6}>
          <Text className="text-center text-[#FF3B30] text-[16px] font-bold py-2">
            Cancel Request
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

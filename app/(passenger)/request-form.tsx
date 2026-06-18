import { useRouter } from "expo-router";
import { ChevronDown, MapPin, X, Zap } from "lucide-react-native";
import React, { useState } from "react";
import { Platform, Switch, Text, TouchableOpacity, View } from "react-native";

export default function RequestFormScreen() {
  const router = useRouter();
  const [needsHelmet, setNeedsHelmet] = useState(false);
  const [urgency, setUrgency] = useState("🎓 Exam / Academic");

  const handleSubmit = () => {
    // Navigate to the "Searching / Radar" screen
    router.replace("/(passenger)/searching");
  };

  const handleClose = () => {
    router.back();
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      {/* Bottom Sheet Container */}
      <View className="bg-white rounded-t-[24px] pt-3 px-5 pb-8 shadow-2xl">
        {/* Drag Handle */}
        <View className="w-9 h-1 rounded-full bg-[#D1D1D6] self-center mb-4" />

        {/* Header */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-[21px] font-black text-[#1C1C1E]">
            Request a Rescue 🚨
          </Text>
          <TouchableOpacity
            onPress={handleClose}
            className="w-[30px] h-[30px] rounded-full bg-[#F2F2F7] items-center justify-center"
            activeOpacity={0.7}
          >
            <X size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Pickup Field */}
        <View className="mb-3">
          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Pickup
          </Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5 py-3.5">
            <View className="w-2.5 h-2.5 rounded-full bg-[#007AFF] mr-3" />
            <Text className="text-[14px] text-[#1C1C1E] font-medium">
              Rue Didouche Mourad, Alger Centre
            </Text>
          </View>
        </View>

        {/* Destination Field */}
        <View className="mb-3">
          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Destination
          </Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5 py-3 border-2 border-[#007AFF]">
            <MapPin size={16} color="#FF3B30" className="mr-2.5" />
            <Text className="text-[14px] text-[#1C1C1E] font-bold">
              Faculté de Droit, Ben Aknoun
            </Text>
          </View>
        </View>

        {/* Urgency Dropdown Placeholder */}
        <View className="mb-3">
          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Urgency Type
          </Text>
          <TouchableOpacity
            activeOpacity={0.7}
            className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5"
          >
            <Text className="text-[14px] text-[#1C1C1E] font-bold">
              {urgency}
            </Text>
            <ChevronDown size={18} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Helmet Toggle */}
        <View className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5 mb-5">
          <View>
            <Text className="text-[14px] font-bold text-[#1C1C1E] mb-0.5">
              ⛑️ I need a helmet
            </Text>
            <Text className="text-[12px] text-[#8E8E93]">
              Biker will bring an extra helmet
            </Text>
          </View>
          <Switch
            value={needsHelmet}
            onValueChange={setNeedsHelmet}
            trackColor={{ false: "#D1D1D6", true: "#34C759" }}
            thumbColor={
              Platform.OS === "ios"
                ? "#FFFFFF"
                : needsHelmet
                  ? "#FFFFFF"
                  : "#F4F3F4"
            }
            ios_backgroundColor="#D1D1D6"
          />
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          activeOpacity={0.8}
          className="w-full h-14 rounded-2xl bg-[#FF9500] items-center justify-center flex-row shadow-lg"
          style={{
            shadowColor: "#FF9500",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          <Zap size={20} color="white" fill="white" className="mr-2" />
          <Text className="text-white text-[18px] font-black tracking-wide">
            Request Rescue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

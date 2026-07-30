import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "@/components/localized-native";
// Note: In Expo, install and import from 'lucide-react-native'
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Hook to get safe area insets for padding
  const handleNext = () => {
    console.log("Next button pressed! Ready for next screen.");
    router.navigate("/onboarding/bikers");
  };
  const handleBack = () => {
    router.replace("/");
  };

  const features = [
    { icon: "🚨", text: "Tap SOS when stuck in traffic" },
    { icon: "⏱️", text: "Matched with a biker in under 2 min" },
    { icon: "🎯", text: "Safety code verification before boarding" },
  ];

  return (
    <View
      className="flex-1 bg-[#0A0F1E]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Header / Back Button */}
      <View className="px-4 pt-2">
        <TouchableOpacity
          onPress={handleBack}
          className="p-2 w-12"
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </View>
      {/* Main Scrollable Content */}
      <ScrollView
        className="flex-1 px-6 pt-2"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Graphic Box */}
        <View className="h-[200px] rounded-[22px] mb-6 bg-[#13203b] border border-white/10 items-center justify-center overflow-hidden relative">
          {/* Content inside the box */}
          <View className="items-center">
            <Text className="text-[44px]">🚗🚗🚗</Text>
            <Text className="text-[24px] my-1">⬆️⬇️</Text>
            <Text className="text-[40px]">🏍💨</Text>
          </View>

          {/* Passenger Badge */}
          <View className="absolute top-3.5 right-3.5 bg-[#FF9500] rounded-full px-2.5 py-1">
            <Text className="text-white text-[11px] font-extrabold tracking-wider">
              PASSENGER
            </Text>
          </View>
        </View>

        {/* Headings */}
        <Text className="text-[26px] font-black text-white leading-8 tracking-tight mb-2.5">
          Tap SOS.{"\n"}Get Rescued.
        </Text>
        <Text className="text-[14px] text-white/55 leading-relaxed mb-6">
          One tap alerts verified volunteer motorcyclists nearby. Share your
          destination, and a local hero picks you up in minutes — weaving
          through the jam.
        </Text>

        {/* Feature List */}
        <View className="flex-col gap-2.5">
          {features.map((item, index) => (
            <View
              key={index}
              className="flex-row items-center gap-3 bg-white/5 rounded-xl px-3.5 py-3 border border-white/10"
            >
              <Text className="text-[20px]">{item.icon}</Text>
              <Text className="text-white/80 text-[14px] font-medium flex-1">
                {item.text}
              </Text>
            </View>
          ))}
        </View>

        {/* Pagination Dots */}
        <View className="flex-row justify-center gap-2 mt-7 mb-4">
          <View className="w-[7px] h-[7px] rounded-full bg-white/30" />
          <View className="w-[22px] h-[7px] rounded-full bg-[#007AFF]" />
          <View className="w-[7px] h-[7px] rounded-full bg-white/30" />
        </View>
      </ScrollView>
      {/* Bottom Button Area (Pinned to bottom) */}
      <View className="px-6 pb-6 pt-3">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="w-full h-14 rounded-2xl bg-[#007AFF] flex-row items-center justify-center gap-2"
        >
          <Text className="text-white text-[17px] font-extrabold">Next</Text>
          <ChevronRight size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

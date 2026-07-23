import { useRouter } from "expo-router";
import { ArrowLeft, ChevronRight } from "lucide-react-native"; // Make sure you installed lucide-react-native
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BikerPitchScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Hook to get safe area insets for padding

  const handleNext = () => {
    // Navigates to the Login screen (assuming you put it in an (auth) folder)
    router.navigate("/(auth)/login");
  };

  const handleBack = () => {
    // Expo Router's built-in way to go to the previous screen
    router.back();
  };

  const features = [
    { icon: "✅", text: "One-time ID verification — ride forever" },
    { icon: "📍", text: "Only requests within 3 km of you" },
    { icon: "⭐", text: "Build your rescue reputation & badges" },
  ];

  return (
    <View
      className="flex-1 bg-[#071510]"
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
        <View className="h-[200px] rounded-[22px] mb-6 bg-[#0a1c13] border border-white/10 items-center justify-center overflow-hidden relative">
          {/* Content inside the box */}
          <View className="items-center">
            <Text className="text-[60px]">🏍</Text>
            <Text className="text-[28px] mt-1.5">🦸</Text>
          </View>

          {/* Biker Badge */}
          <View className="absolute top-3.5 right-3.5 bg-[#34C759] rounded-full px-2.5 py-1">
            <Text className="text-white text-[11px] font-extrabold tracking-wider">
              BIKER
            </Text>
          </View>
        </View>

        {/* Headings */}
        <Text className="text-[26px] font-black text-white leading-8 tracking-tight mb-2.5">
          Be a Hero.{"\n"}One Ride at a Time.
        </Text>
        <Text className="text-[14px] text-white/55 leading-relaxed mb-6">
          Join our verified volunteer network. Go online when you have time,
          accept requests near you, and make someone&apos;s worst day a little
          better.
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

        {/* Pagination Dots (3rd dot is active and green) */}
        <View className="flex-row justify-center gap-2 mt-7 mb-4">
          <View className="w-[7px] h-[7px] rounded-full bg-white/30" />
          <View className="w-[7px] h-[7px] rounded-full bg-white/30" />
          <View className="w-[22px] h-[7px] rounded-full bg-[#34C759]" />
        </View>
      </ScrollView>

      {/* Bottom Button Area (Pinned to bottom) */}
      <View className="px-6 pb-6 pt-3">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="w-full h-14 rounded-2xl bg-[#34C759] flex-row items-center justify-center gap-2"
        >
          <Text className="text-white text-[17px] font-extrabold">
            Join the Community
          </Text>
          <ChevronRight size={20} color="white" strokeWidth={3} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

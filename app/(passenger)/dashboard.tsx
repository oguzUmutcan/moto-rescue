import { useRouter } from "expo-router";
import { Bell, Navigation2, Search, Zap } from "lucide-react-native";
import React, { useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PassengerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // --- SOS Pulse Animation Values ---
  const pulse1Scale = useSharedValue(1);
  const pulse1Opacity = useSharedValue(0.55);
  const pulse2Scale = useSharedValue(1);
  const pulse2Opacity = useSharedValue(0.35);

  useEffect(() => {
    pulse1Scale.value = withRepeat(
      withTiming(2.4, {
        duration: 1600,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      false,
    );
    pulse1Opacity.value = withRepeat(
      withTiming(0, { duration: 1600, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
      -1,
      false,
    );

    pulse2Scale.value = withDelay(
      400,
      withRepeat(
        withTiming(1.9, {
          duration: 1600,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        false,
      ),
    );
    pulse2Opacity.value = withDelay(
      400,
      withRepeat(
        withTiming(0, {
          duration: 1600,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
        }),
        -1,
        false,
      ),
    );
  }, []);

  const animatedPulse1 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse1Scale.value }],
    opacity: pulse1Opacity.value,
  }));
  const animatedPulse2 = useAnimatedStyle(() => ({
    transform: [{ scale: pulse2Scale.value }],
    opacity: pulse2Opacity.value,
  }));

  const handleSOS = () => {
    // In the prototype, it goes to the request modal
    router.push("/(passenger)/request-form");
  };

  return (
    <View className="flex-1 bg-[#E5EBF0] relative">
      {/* MAP LAYER (Placeholder) */}
      <View
        style={StyleSheet.absoluteFillObject}
        className="bg-[#e0e5ec] items-center justify-center"
      >
        {/* Mock Map Grid */}
        <View className="absolute w-full h-full opacity-10">
          {Array.from({ length: 20 }).map((_, i) => (
            <View
              key={`h-${i}`}
              className="absolute w-full h-[1px] bg-black"
              style={{ top: i * 50 }}
            />
          ))}
          {Array.from({ length: 10 }).map((_, i) => (
            <View
              key={`v-${i}`}
              className="absolute h-full w-[1px] bg-black"
              style={{ left: i * 50 }}
            />
          ))}
        </View>
        <View className="absolute w-4 h-4 rounded-full bg-[#007AFF] border-2 border-white shadow-sm" />
      </View>

      {/* TOP BAR */}
      <View
        className="absolute top-0 w-full bg-white z-10 shadow-sm rounded-b-2xl pb-3"
        style={{ paddingTop: insets.top + 10 }}
      >
        <View className="flex-row items-center px-4 gap-3">
          <TouchableOpacity
            activeOpacity={0.9}
            className="flex-1 h-11 bg-[#F2F2F7] rounded-xl flex-row items-center px-3"
          >
            <Search size={18} color="#8E8E93" />
            <Text className="ml-2 text-[14px] text-[#AEAEB2] font-medium">
              Where are you going?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            className="w-11 h-11 rounded-xl bg-[#007AFF] items-center justify-center relative"
          >
            <Bell size={20} color="white" />
            <View className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-[#FF3B30] border border-[#007AFF]" />
          </TouchableOpacity>
        </View>
      </View>

      {/* LOCATE ME BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        className="absolute bottom-[220px] left-4 w-11 h-11 rounded-full bg-white shadow-md items-center justify-center"
      >
        <Navigation2 size={20} color="#007AFF" />
      </TouchableOpacity>

      {/* STATUS WIDGET */}
      <View className="absolute bottom-[130px] left-4 right-[86px] bg-white rounded-2xl p-3 shadow-md flex-row items-center z-10">
        <View className="w-10 h-10 rounded-full bg-[#EEF4FF] items-center justify-center">
          <Text className="text-[20px]">😊</Text>
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-[14px] font-black text-[#1C1C1E]">
            No active request
          </Text>
          <Text className="text-[12px] text-[#8E8E93] mt-0.5">
            Tap SOS if you need help
          </Text>
        </View>
        <View className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
      </View>

      {/* SOS BUTTON AREA */}
      <View className="absolute bottom-[148px] right-5 items-center z-20">
        <View className="relative w-[68px] h-[68px] items-center justify-center">
          {/* Animated Pulse Rings */}
          <Animated.View
            className="absolute w-[92px] h-[92px] rounded-full bg-[#FF9500]"
            style={animatedPulse1}
          />
          <Animated.View
            className="absolute w-[92px] h-[92px] rounded-full bg-[#FF9500]"
            style={animatedPulse2}
          />

          {/* Actual Button */}
          <TouchableOpacity
            onPress={handleSOS}
            activeOpacity={0.9}
            className="w-[68px] h-[68px] rounded-full bg-[#FF9500] items-center justify-center shadow-lg z-10"
            style={{
              shadowColor: "#FF9500",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.5,
              shadowRadius: 12,
              elevation: 8,
            }}
          >
            <Zap size={28} color="white" fill="white" />
          </TouchableOpacity>
        </View>

        <View className="bg-white px-2.5 py-1 rounded-full shadow-sm mt-2">
          <Text className="text-[10px] font-black text-[#FF9500] tracking-widest">
            SOS
          </Text>
        </View>
      </View>

      {/* BOTTOM NAVIGATION (Static UI for Dashboard) */}
      <View
        className="absolute bottom-0 w-full bg-white border-t border-[#F2F2F7] z-30"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}
      >
        <View className="flex-row justify-around pt-2 pb-1">
          {[
            { icon: "🗺️", label: "Map", active: true },
            { icon: "📋", label: "History", active: false },
            { icon: "⭐", label: "Reviews", active: false },
            { icon: "👤", label: "Profile", active: false },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className="items-center px-4 py-1"
              activeOpacity={0.7}
            >
              <Text className="text-[22px] mb-1">{item.icon}</Text>
              <Text
                className={`text-[10px] ${item.active ? "font-black text-[#007AFF]" : "font-medium text-[#8E8E93]"}`}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

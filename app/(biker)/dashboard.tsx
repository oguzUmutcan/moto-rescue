import { useRouter } from "expo-router";
import { Navigation2 } from "lucide-react-native";
import React, { useState } from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function BikerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [online, setOnline] = useState(true);

  const handleSimulate = () => {
    router.push("/(biker)/incoming");
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
        <View className="absolute w-4 h-4 rounded-full bg-[#FF9500] border-2 border-white shadow-sm" />
      </View>

      {/* TOP HEADER (Dynamic Background) */}
      <View
        className={`absolute top-0 w-full z-10 shadow-md ${online ? "bg-[#071510]" : "bg-white"}`}
        style={{ paddingTop: insets.top }}
      >
        <View className="px-5 pb-5 pt-3 flex-row items-center justify-between">
          <View>
            <Text
              className={`text-[13px] font-medium mb-0.5 ${online ? "text-white/60" : "text-[#8E8E93]"}`}
            >
              Welcome back,
            </Text>
            <Text
              className={`text-[22px] font-black tracking-tight ${online ? "text-white" : "text-[#1C1C1E]"}`}
            >
              Khaled 🏍
            </Text>
          </View>

          {/* Online Toggle */}
          <TouchableOpacity
            onPress={() => setOnline(!online)}
            activeOpacity={0.8}
            className={`flex-row items-center px-4 py-2.5 rounded-full ${online ? "bg-[#34C759]" : "bg-[#F2F2F7]"}`}
          >
            <View
              className={`w-2.5 h-2.5 rounded-full mr-2 ${online ? "bg-white" : "bg-[#C7C7CC]"}`}
            />
            <Text
              className={`text-[15px] font-black ${online ? "text-white" : "text-[#8E8E93]"}`}
            >
              {online ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* STATS ROW */}
      <View className="absolute top-[125px] w-full px-4 flex-row justify-between z-20">
        {[
          {
            label: "Today",
            value: "3",
            unit: "rescues",
            color: "text-[#34C759]",
          },
          {
            label: "Rating",
            value: "4.9",
            unit: "avg",
            color: "text-[#FF9500]",
          },
          {
            label: "Total",
            value: "127",
            unit: "rescues",
            color: "text-[#007AFF]",
          },
        ].map((stat, i) => (
          <View
            key={i}
            className="flex-1 bg-white rounded-2xl py-3 px-2 shadow-sm mx-1 items-center"
          >
            <Text className="text-[12px] text-[#8E8E93] font-medium mb-1">
              {stat.label}
            </Text>
            <Text
              className={`text-[24px] font-black tracking-tight ${stat.color}`}
            >
              {stat.value}
            </Text>
            <Text className="text-[11px] text-[#AEAEB2] mt-0.5">
              {stat.unit}
            </Text>
          </View>
        ))}
      </View>

      {/* STATUS BANNER / SIMULATOR BUTTON */}
      {online && (
        <View className="absolute bottom-[126px] w-full px-4 z-10">
          <View className="bg-white rounded-[20px] p-5 shadow-lg">
            <View className="flex-row items-center mb-4">
              <View className="w-11 h-11 rounded-xl bg-[#EDFAF3] items-center justify-center">
                <View className="w-3 h-3 rounded-full bg-[#34C759]" />
              </View>
              <View className="ml-4">
                <Text className="text-[16px] font-black text-[#1C1C1E]">
                  Online · Accepting requests
                </Text>
                <Text className="text-[13px] font-medium text-[#34C759] mt-0.5">
                  3 passengers in your area
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleSimulate}
              activeOpacity={0.8}
              className="w-full h-[50px] bg-[#FF9500] rounded-xl items-center justify-center flex-row"
            >
              <Text className="text-white text-[15px] font-black tracking-wide">
                🔔 Simulate Incoming Request
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* LOCATE ME BUTTON */}
      <TouchableOpacity
        activeOpacity={0.8}
        className={`absolute right-4 w-11 h-11 rounded-full bg-white shadow-md items-center justify-center z-10 transition-all ${online ? "bottom-[240px]" : "bottom-[130px]"}`}
      >
        <Navigation2 size={20} color="#007AFF" />
      </TouchableOpacity>

      {/* BOTTOM NAVIGATION */}
      <View
        className="absolute bottom-0 w-full bg-white border-t border-[#F2F2F7] z-30"
        style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 16 }}
      >
        <View className="flex-row justify-around pt-2 pb-1">
          {[
            { icon: "🗺️", label: "Map", active: true },
            { icon: "📋", label: "History", active: false },
            { icon: "🏆", label: "Badges", active: false },
            { icon: "👤", label: "Profile", active: false },
          ].map((item, i) => (
            <TouchableOpacity
              key={i}
              className="items-center px-4 py-1"
              activeOpacity={0.7}
            >
              <Text className="text-[22px] mb-1">{item.icon}</Text>
              <Text
                className={`text-[10px] ${item.active ? "font-black text-[#34C759]" : "font-medium text-[#8E8E93]"}`}
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

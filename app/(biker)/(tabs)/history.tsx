import { MapPin } from "lucide-react-native";
import React, { useState } from "react";
import {
    ScrollView,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const B_RIDES = [
  {
    date: "Today · 8:14 AM",
    passenger: "Yacine B.",
    e: "🙋",
    from: "Rue Didouche Mourad",
    to: "Faculté de Droit",
    dur: "18 min",
    urgency: "🎓 Exam",
    status: "completed",
    pts: 45,
  },
  {
    date: "Yesterday · 5:02 PM",
    passenger: "Amira K.",
    e: "🙋‍♀️",
    from: "Place du 1er Mai",
    to: "American Visa Centre",
    dur: "22 min",
    urgency: "🏛️ Consulate",
    status: "completed",
    pts: 60,
  },
  {
    date: "Mon Jun 16 · 9:20 AM",
    passenger: "Omar T.",
    e: "🙋‍♂️",
    from: "Bab El Oued",
    to: "CHU Mustapha Pacha",
    dur: "14 min",
    urgency: "🏥 Medical",
    status: "completed",
    pts: 70,
  },
  {
    date: "Sat Jun 14 · 3:15 PM",
    passenger: "(cancelled by passenger)",
    e: "❌",
    from: "",
    to: "",
    dur: null,
    urgency: null,
    status: "cancelled",
    pts: 0,
  },
];

export default function BikerHistoryScreen() {
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">(
    "all",
  );
  const visibleRides =
    filter === "all" ? B_RIDES : B_RIDES.filter((r) => r.status === filter);
  const insets = useSafeAreaInsets(); // Hook to get safe area insets for padding

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Dark Header */}
      <View className="bg-[#071510] shadow-md z-10 pt-12">
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="px-5 pb-4">
            <Text className="text-[24px] font-black text-white tracking-tight mb-4">
              Rescue History
            </Text>

            {/* Summary Chips */}
            <View className="flex-row gap-2.5 mb-4">
              {[
                { v: "127", l: "Total", c: "text-[#34C759]" },
                { v: "1,840km", l: "Covered", c: "text-[#007AFF]" },
                { v: "16 min", l: "Avg time", c: "text-[#FF9500]" },
              ].map(({ v, l, c }) => (
                <View
                  key={l}
                  className="bg-white/10 border border-white/10 rounded-xl py-2 px-3 items-center flex-1"
                >
                  <Text className={`text-[16px] font-black ${c}`}>{v}</Text>
                  <Text className="text-[10px] text-white/50">{l}</Text>
                </View>
              ))}
            </View>

            {/* Filter Buttons */}
            <View className="flex-row gap-2">
              {(["all", "completed", "cancelled"] as const).map((f) => (
                <TouchableOpacity
                  key={f}
                  onPress={() => setFilter(f)}
                  activeOpacity={0.7}
                  className={`px-4 py-1.5 rounded-full ${filter === f ? "bg-[#34C759]" : "bg-white/10"}`}
                >
                  <Text
                    className={`text-[13px] font-bold ${filter === f ? "text-white" : "text-white/60"}`}
                  >
                    {f === "all"
                      ? "All"
                      : f === "completed"
                        ? "Completed"
                        : "Cancelled"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </View>

      {/* Ride List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {visibleRides.map((r, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            {/* Date & Status */}
            <View
              className={`flex-row items-center justify-between ${r.status === "completed" ? "mb-3" : ""}`}
            >
              <Text className="text-[12px] text-[#8E8E93] font-semibold">
                {r.date}
              </Text>
              {r.status === "completed" ? (
                <Text className="text-[13px] font-black text-[#34C759]">
                  +{r.pts} pts
                </Text>
              ) : (
                <View className="bg-[#FFF0F0] px-2.5 py-1 rounded-full">
                  <Text className="text-[11px] font-black text-[#FF3B30]">
                    Cancelled
                  </Text>
                </View>
              )}
            </View>

            {/* Completed Ride Details */}
            {r.status === "completed" && (
              <>
                <View className="flex-row items-center gap-3 mb-3">
                  <View className="w-10 h-10 rounded-full bg-[#EEF4FF] items-center justify-center">
                    <Text className="text-[18px]">{r.e}</Text>
                  </View>
                  <View>
                    <Text className="text-[14px] font-black text-[#1C1C1E]">
                      {r.passenger}
                    </Text>
                    <Text className="text-[12px] text-[#8E8E93] mt-0.5">
                      {r.urgency} · ⏱ {r.dur}
                    </Text>
                  </View>
                </View>

                {/* Route */}
                <View className="border-t border-[#F2F2F7] pt-3 space-y-1.5">
                  <View className="flex-row items-center gap-2">
                    <View className="w-2 h-2 rounded-full bg-[#007AFF]" />
                    <Text className="text-[12px] text-[#1C1C1E]">{r.from}</Text>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <MapPin size={10} color="#FF3B30" />
                    <Text className="text-[12px] font-semibold text-[#1C1C1E]">
                      {r.to}
                    </Text>
                  </View>
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

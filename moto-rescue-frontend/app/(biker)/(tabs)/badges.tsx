import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const EARNED_BADGES = [
  {
    e: "🏁",
    name: "First Rescue",
    desc: "Completed your first ever rescue",
    color: "#007AFF",
    bg: "#EEF4FF",
    date: "Mar 2024",
  },
  {
    e: "⚡",
    name: "Lightning Fast",
    desc: "Arrived at pickup in under 3 minutes",
    color: "#FF9500",
    bg: "#FFF4E0",
    date: "Apr 2024",
  },
  {
    e: "🎓",
    name: "Exam Hero",
    desc: "Rescued 5 students before their exams",
    color: "#5856D6",
    bg: "#F0EFFF",
    date: "May 2024",
  },
  {
    e: "🌙",
    name: "Night Rescuer",
    desc: "Completed 10 rescues after 8 PM",
    color: "#1C1C1E",
    bg: "#F2F2F7",
    date: "May 2024",
  },
  {
    e: "💯",
    name: "100 Rescues",
    desc: "Reached the legendary 100 rescue milestone",
    color: "#FF3B30",
    bg: "#FFF0F0",
    date: "Jun 2024",
  },
  {
    e: "⭐",
    name: "5-Star Biker",
    desc: "Maintained a 5.0 rating for 30 days",
    color: "#FF9500",
    bg: "#FFF4E0",
    date: "Jun 2024",
  },
];

const LOCKED_BADGES = [
  {
    e: "🥇",
    name: "Gold Rescuer",
    desc: "Complete 200 total rescues",
    cur: 127,
    max: 200,
    unit: "rescues",
  },
  {
    e: "🏛️",
    name: "Visa Saver",
    desc: "Rescue 10 consulate passengers",
    cur: 4,
    max: 10,
    unit: "rescues",
  },
  {
    e: "🏃",
    name: "Marathon",
    desc: "Cover 5,000 km in rescue rides",
    cur: 1840,
    max: 5000,
    unit: "km",
  },
];

export default function BikerBadgesScreen() {
  const insets = useSafeAreaInsets(); // Hook to get safe area insets for padding

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Dark Header */}
      <View className="bg-[#071510] shadow-md z-10 pt-12 pb-5">
        <View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View className="px-5">
            <Text className="text-[24px] font-black text-white tracking-tight mb-4">
              Badges
            </Text>

            {/* Level Card */}
            <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
              <View className="flex-row items-center gap-3 mb-3">
                <View className="w-[52px] h-[52px] rounded-full bg-[#C0C0C0] items-center justify-center border-2 border-white/20">
                  <Text className="text-[24px]">🥈</Text>
                </View>
                <View>
                  <Text className="text-[17px] font-black text-white">
                    Silver Rescuer
                  </Text>
                  <Text className="text-[13px] text-white/50 mt-0.5">
                    Level 3 · 340 / 500 XP to Gold
                  </Text>
                </View>
              </View>

              {/* Progress Bar */}
              <View className="h-2 bg-white/10 rounded-full overflow-hidden mb-1.5">
                <View
                  className="h-full bg-[#34C759] rounded-full"
                  style={{ width: "68%" }}
                />
              </View>

              <View className="flex-row justify-between">
                <Text className="text-[11px] text-white/40">Silver</Text>
                <Text className="text-[11px] text-white/40">
                  160 XP to Gold 🥇
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Earned Section */}
        <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2.5">
          Earned ({EARNED_BADGES.length})
        </Text>
        <View className="flex-row flex-wrap justify-between mb-4">
          {EARNED_BADGES.map((b, i) => (
            <View
              key={i}
              className="w-[48%] bg-white rounded-2xl p-3.5 mb-3 shadow-sm"
            >
              <View
                className="w-11 h-11 rounded-[14px] items-center justify-center mb-2"
                style={{ backgroundColor: b.bg }}
              >
                <Text className="text-[22px]">{b.e}</Text>
              </View>
              <Text className="text-[13px] font-black text-[#1C1C1E] mb-1">
                {b.name}
              </Text>
              <Text className="text-[11px] text-[#8E8E93] leading-tight mb-2">
                {b.desc}
              </Text>
              <Text
                className="text-[10px] font-bold mt-auto"
                style={{ color: b.color }}
              >
                {b.date}
              </Text>
            </View>
          ))}
        </View>

        {/* Locked Section */}
        <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2.5">
          Next Up ({LOCKED_BADGES.length})
        </Text>
        {LOCKED_BADGES.map((b, i) => (
          <View key={i} className="bg-white rounded-2xl p-3.5 mb-2.5 shadow-sm">
            <View className="flex-row items-center gap-3 mb-2.5">
              <View className="w-11 h-11 rounded-[14px] bg-[#F2F2F7] items-center justify-center opacity-50">
                <Text className="text-[22px]">{b.e}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-black text-[#1C1C1E] mb-0.5">
                  {b.name}
                </Text>
                <Text className="text-[12px] text-[#8E8E93]">{b.desc}</Text>
              </View>
              <Text className="text-[13px] font-bold text-[#AEAEB2]">
                {b.cur}/{b.max}
              </Text>
            </View>

            {/* Locked Progress Bar */}
            <View className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden mb-1">
              <View
                className="h-full bg-[#34C759] rounded-full"
                style={{ width: `${(b.cur / b.max) * 100}%` }}
              />
            </View>
            <Text className="text-[11px] text-[#8E8E93] text-right">
              {b.max - b.cur} {b.unit} to go
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

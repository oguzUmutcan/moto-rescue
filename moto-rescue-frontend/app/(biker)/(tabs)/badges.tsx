import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BadgeSummary, badgeApi } from "../../../api/badges";

export default function BikerBadgesScreen() {
  const insets = useSafeAreaInsets();
  const [summary, setSummary] = useState<BadgeSummary | null>(null);

  useEffect(() => {
    badgeApi.mine().then(setSummary).catch((error) =>
      console.error("Could not load badges", error),
    );
  }, []);

  if (!summary) {
    return <View className="flex-1 bg-[#071510] items-center justify-center"><Text className="text-white/60 font-bold">Loading badges...</Text></View>;
  }

  const earned = summary.badges.filter((badge) => badge.earned);
  const locked = summary.badges.filter((badge) => !badge.earned);
  const levelPct = summary.nextLevelXp
    ? Math.min(100, (summary.currentLevelXp / summary.nextLevelXp) * 100)
    : 100;

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <View className="bg-[#071510] shadow-md pb-5" style={{ paddingTop: insets.top + 16 }}>
        <View className="px-5">
          <Text className="text-[24px] font-black text-white mb-4">Badges</Text>
          <View className="bg-white/5 rounded-2xl p-4 border border-white/10">
            <View className="flex-row items-center mb-3">
              <View className="w-[52px] h-[52px] rounded-full bg-white/10 items-center justify-center"><Text className="text-[27px]">{summary.levelEmoji}</Text></View>
              <View className="ml-3 flex-1"><Text className="text-[18px] font-black text-white">{summary.level} Rescuer</Text><Text className="text-[13px] text-white/50">{summary.xp} XP · {summary.nextLevel}</Text></View>
            </View>
            <View className="h-2 bg-white/10 rounded-full overflow-hidden"><View className="h-full bg-[#34C759]" style={{ width: `${levelPct}%` }} /></View>
            <Text className="text-[11px] text-white/40 text-right mt-1.5">{summary.nextLevelXp ? `${summary.nextLevelXp - summary.currentLevelXp} XP to ${summary.nextLevel}` : "Maximum level"}</Text>
          </View>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 28 }}>
        <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2.5">Earned ({earned.length})</Text>
        {earned.length === 0 ? <View className="bg-white rounded-2xl p-5 mb-4"><Text className="text-[#8E8E93] text-center">Complete your first rescue to earn a badge.</Text></View> : (
          <View className="flex-row flex-wrap justify-between mb-4">
            {earned.map((badge) => (
              <View key={badge.id} className="w-[48%] bg-white rounded-2xl p-3.5 mb-3 shadow-sm">
                <View className="w-11 h-11 rounded-[14px] bg-[#EEF4FF] items-center justify-center mb-2"><Text className="text-[23px]">{badge.emoji}</Text></View>
                <Text className="text-[13px] font-black text-[#1C1C1E]">{badge.name}</Text>
                <Text className="text-[11px] text-[#8E8E93] mt-1 leading-4">{badge.description}</Text>
                <Text className="text-[10px] font-bold text-[#34C759] mt-2">Earned {badge.earnedAt ? new Date(badge.earnedAt).toLocaleDateString() : "recently"}</Text>
              </View>
            ))}
          </View>
        )}

        <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2.5">Next Up ({locked.length})</Text>
        {locked.map((badge) => {
          const pct = Math.min(100, (badge.progress / badge.target) * 100);
          return (
            <View key={badge.id} className="bg-white rounded-2xl p-3.5 mb-2.5 shadow-sm">
              <View className="flex-row items-center mb-2.5">
                <View className="w-11 h-11 rounded-[14px] bg-[#F2F2F7] items-center justify-center opacity-60"><Text className="text-[22px]">{badge.emoji}</Text></View>
                <View className="ml-3 flex-1"><Text className="text-[14px] font-black text-[#1C1C1E]">{badge.name}</Text><Text className="text-[12px] text-[#8E8E93] mt-0.5">{badge.description}</Text></View>
                <Text className="text-[13px] font-bold text-[#AEAEB2]">{badge.progress}/{badge.target}</Text>
              </View>
              <View className="h-1.5 bg-[#F2F2F7] rounded-full overflow-hidden"><View className="h-full bg-[#34C759]" style={{ width: `${pct}%` }} /></View>
              <Text className="text-[11px] text-[#8E8E93] text-right mt-1">{badge.id === "five_star" && badge.progress >= badge.target ? "Raise rating to 4.8+" : `${badge.target - badge.progress} to go`}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

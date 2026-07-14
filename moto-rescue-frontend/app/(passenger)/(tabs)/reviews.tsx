import { Star } from "lucide-react-native";
import React from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const P_REVIEWS = [
  {
    biker: "Khaled M.",
    e: "🧑",
    stars: 5,
    comment:
      "Super passenger — very clear communication and was ready at the pickup point. Would rescue again!",
    date: "Jun 12",
  },
  {
    biker: "Amine R.",
    e: "👨",
    stars: 4,
    comment:
      "Good passenger, polite and calm. Slightly late to pickup but fully understandable given the jam.",
    date: "Jun 9",
  },
  {
    biker: "Youcef D.",
    e: "🧔",
    stars: 5,
    comment:
      "Excellent! Had the safety code ready and wore the helmet properly. Fast and easy rescue.",
    date: "Jun 6",
  },
];

export default function PassengerReviewsScreen() {
  const insets = useSafeAreaInsets();
  const avg = (
    P_REVIEWS.reduce((s, r) => s + r.stars, 0) / P_REVIEWS.length
  ).toFixed(1);

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View
        className="bg-white shadow-sm z-10 pb-4"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="px-5 pt-4">
          <Text className="text-[24px] font-black text-[#1C1C1E] tracking-tight">
            Reviews
          </Text>
        </View>
      </View>

      {/* Rating Summary Card */}
      <View className="bg-white mx-4 mt-4 rounded-[20px] p-5 shadow-sm">
        <View className="flex-row items-center gap-5">
          <View className="items-center">
            <Text className="text-[52px] font-black text-[#1C1C1E] leading-[52px] tracking-tight">
              {avg}
            </Text>
            <View className="flex-row gap-0.5 mt-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={14} color="#FF9500" fill="#FF9500" />
              ))}
            </View>
            <Text className="text-[12px] text-[#8E8E93] mt-1">out of 5</Text>
          </View>

          <View className="flex-1">
            {[5, 4, 3, 2, 1].map((n) => {
              const count = P_REVIEWS.filter((r) => r.stars === n).length;
              const pct = (count / P_REVIEWS.length) * 100;
              return (
                <View key={n} className="flex-row items-center gap-2 mb-1.5">
                  <Text className="text-[12px] text-[#8E8E93] w-2">{n}</Text>
                  <Star size={10} color="#FF9500" fill="#FF9500" />
                  <View className="flex-1 h-1.5 rounded-full bg-[#F2F2F7] overflow-hidden">
                    <View
                      className="h-full rounded-full bg-[#FF9500]"
                      style={{ width: `${pct}%` }}
                    />
                  </View>
                  <Text className="text-[11px] text-[#AEAEB2] w-3 text-right">
                    {count}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        <View className="mt-3.5 pt-3.5 border-t border-[#F2F2F7] flex-row gap-2">
          {[
            { e: "⚡", l: "Quick pickup" },
            { e: "😊", l: "Friendly" },
            { e: "🪖", l: "Wore helmet" },
          ].map(({ e, l }) => (
            <View
              key={l}
              className="bg-[#EEF4FF] rounded-full px-3 py-1.5 flex-row items-center gap-1.5"
            >
              <Text className="text-[13px]">{e}</Text>
              <Text className="text-[12px] font-bold text-[#007AFF]">{l}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Review List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2.5">
          From bikers ({P_REVIEWS.length})
        </Text>

        {P_REVIEWS.map((r, i) => (
          <View key={i} className="bg-white rounded-2xl p-4 mb-2.5 shadow-sm">
            <View className="flex-row items-center gap-2.5 mb-2.5">
              <View className="w-10 h-10 rounded-full bg-[#EEF4FF] items-center justify-center">
                <Text className="text-[18px]">{r.e}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[14px] font-bold text-[#1C1C1E]">
                  {r.biker}
                </Text>
                <View className="flex-row items-center gap-0.5 mt-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      size={10}
                      color={j < r.stars ? "#FF9500" : "#E5E5EA"}
                      fill={j < r.stars ? "#FF9500" : "#E5E5EA"}
                    />
                  ))}
                </View>
              </View>
              <Text className="text-[12px] text-[#AEAEB2]">{r.date}</Text>
            </View>
            <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
              &ldquo;{r.comment}&rdquo;
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

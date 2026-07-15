import { MapPin, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { rescueApi } from "../../../api/rescues";
import { reviewApi } from "../../../api/reviews";
import ProfileAvatar from "../../../components/profile-avatar";

type PassengerRide = {
  id: string;
  date: string; from: string; to: string; biker: string | null;
  bikerProfilePhotoPath: string | null; status: "completed" | "cancelled";
  dur: string | null; rating: number | null;
};

export default function PassengerHistoryScreen() {
  const [rides, setRides] = useState<PassengerRide[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">(
    "all",
  );
  const visibleRides =
    filter === "all" ? rides : rides.filter((r) => r.status === filter);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    Promise.all([rescueApi.history(), reviewApi.mine()]).then(([items, reviews]) => {
      const ratings = new Map(reviews.map((review) => [review.rescueId, review.rating]));
      setRides(items.filter((item) => item.status === "completed" || item.status === "cancelled").map((item) => ({
        id: item.id,
        date: new Date(item.createdAt).toLocaleString(),
        from: item.pickupLabel,
        to: item.destinationLabel,
        biker: item.bikerName,
        bikerProfilePhotoPath: item.bikerProfilePhotoPath,
        status: item.status === "completed" ? "completed" : "cancelled",
        dur: item.startedAt && item.completedAt
          ? `${Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.startedAt).getTime()) / 60000))} min`
          : null,
        rating: ratings.get(item.id) ?? null,
      })));
    }).catch((error) => console.error("Could not load ride history", error));
  }, []);

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Header */}
      <View
        className="bg-white shadow-sm z-10 pb-4"
        style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
      >
        <View className="px-5 pt-4">
          <Text className="text-[24px] font-black text-[#1C1C1E] tracking-tight mb-3">
            My Rides
          </Text>
          <View className="flex-row gap-2">
            {(["all", "completed", "cancelled"] as const).map((f) => (
              <TouchableOpacity
                key={f}
                onPress={() => setFilter(f)}
                activeOpacity={0.7}
                className={`px-4 py-1.5 rounded-full ${filter === f ? "bg-[#007AFF]" : "bg-[#F2F2F7]"}`}
              >
                <Text
                  className={`text-[13px] font-bold ${filter === f ? "text-white" : "text-[#8E8E93]"}`}
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

      {/* Ride List */}
      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {visibleRides.map((r) => (
          <View key={r.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            {/* Date & Status */}
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-[12px] text-[#8E8E93] font-semibold">
                {r.date}
              </Text>
              <View
                className={`px-2.5 py-1 rounded-full ${r.status === "completed" ? "bg-[#EDFAF3]" : "bg-[#FFF0F0]"}`}
              >
                <Text
                  className={`text-[11px] font-black ${r.status === "completed" ? "text-[#34C759]" : "text-[#FF3B30]"}`}
                >
                  {r.status === "completed" ? "✓ Completed" : "✕ Cancelled"}
                </Text>
              </View>
            </View>

            {/* Route */}
            <View
              className={`space-y-1.5 ${r.status === "completed" ? "mb-3" : ""}`}
            >
              <View className="flex-row items-center gap-2">
                <View className="w-2 h-2 rounded-full bg-[#007AFF]" />
                <Text className="text-[13px] text-[#1C1C1E]">{r.from}</Text>
              </View>
              <View className="w-[1px] h-3 bg-[#E5E5EA] ml-1" />
              <View className="flex-row items-center gap-2">
                <MapPin size={10} color="#FF3B30" />
                <Text className="text-[13px] font-semibold text-[#1C1C1E]">
                  {r.to}
                </Text>
              </View>
            </View>

            {/* Biker Meta */}
            {r.status === "completed" && r.biker && (
              <View className="flex-row items-center justify-between border-t border-[#F2F2F7] pt-3">
                <View className="flex-row items-center gap-2">
                    <ProfileAvatar storagePath={r.bikerProfilePhotoPath} size={32} />
                  <View>
                    <Text className="text-[12px] text-[#8E8E93]">
                      Rescued by
                    </Text>
                    <Text className="text-[13px] font-bold text-[#1C1C1E]">
                      {r.biker}
                    </Text>
                  </View>
                </View>

                <View className="items-end gap-1">
                  <View className="flex-row gap-0.5">
                    {Array.from({ length: 5 }).map((_, j) => (
                      <Star
                        key={j}
                        size={12}
                        color={j < (r.rating ?? 0) ? "#FF9500" : "#E5E5EA"}
                        fill={j < (r.rating ?? 0) ? "#FF9500" : "#E5E5EA"}
                      />
                    ))}
                  </View>
                  <Text className="text-[11px] text-[#8E8E93]">⏱ {r.dur}</Text>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

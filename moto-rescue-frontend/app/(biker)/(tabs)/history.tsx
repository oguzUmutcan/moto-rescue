import { MapPin } from "lucide-react-native";
import React, { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RescueRequest, rescueApi } from "../../../api/rescues";
import ProfileAvatar from "../../../components/profile-avatar";

type Ride = RescueRequest & { durationMinutes: number | null; distanceKm: number };

function distanceKm(ride: RescueRequest) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(ride.destinationLatitude - ride.latitude);
  const dLon = radians(ride.destinationLongitude - ride.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(radians(ride.latitude)) * Math.cos(radians(ride.destinationLatitude)) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function BikerHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [filter, setFilter] = useState<"all" | "completed" | "cancelled">("all");
  const insets = useSafeAreaInsets();

  useEffect(() => {
    rescueApi.history().then((items) => setRides(items
      .filter((item) => item.status === "completed" || item.status === "cancelled")
      .map((item) => ({
        ...item,
        distanceKm: item.status === "completed" ? distanceKm(item) : 0,
        durationMinutes: item.startedAt && item.completedAt
          ? Math.max(1, Math.round((new Date(item.completedAt).getTime() - new Date(item.startedAt).getTime()) / 60000))
          : null,
      })))).catch((error) => console.error("Could not load rescue history", error));
  }, []);

  const completed = rides.filter((ride) => ride.status === "completed");
  const totalKm = completed.reduce((sum, ride) => sum + ride.distanceKm, 0);
  const timed = completed.filter((ride) => ride.durationMinutes !== null);
  const averageMinutes = timed.length ? Math.round(timed.reduce((sum, ride) => sum + (ride.durationMinutes ?? 0), 0) / timed.length) : 0;
  const visibleRides = useMemo(() => filter === "all" ? rides : rides.filter((ride) => ride.status === filter), [filter, rides]);

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <View className="bg-[#071510] shadow-md z-10 pt-12"><View style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}><View className="px-5 pb-4">
        <Text className="text-[24px] font-black text-white tracking-tight mb-4">Rescue History</Text>
        <View className="flex-row gap-2.5 mb-4">{[
          { v: String(completed.length), l: "Completed", c: "text-[#34C759]" },
          { v: `${totalKm.toFixed(1)}km`, l: "Covered", c: "text-[#007AFF]" },
          { v: averageMinutes ? `${averageMinutes} min` : "—", l: "Avg time", c: "text-[#FF9500]" },
        ].map(({ v, l, c }) => <View key={l} className="bg-white/10 border border-white/10 rounded-xl py-2 px-3 items-center flex-1"><Text className={`text-[16px] font-black ${c}`}>{v}</Text><Text className="text-[10px] text-white/50">{l}</Text></View>)}</View>
        <View className="flex-row gap-2">{(["all", "completed", "cancelled"] as const).map((value) => <TouchableOpacity key={value} onPress={() => setFilter(value)} className={`px-4 py-1.5 rounded-full ${filter === value ? "bg-[#34C759]" : "bg-white/10"}`}><Text className={`text-[13px] font-bold ${filter === value ? "text-white" : "text-white/60"}`}>{value[0].toUpperCase() + value.slice(1)}</Text></TouchableOpacity>)}</View>
      </View></View></View>
      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 24 }}>
        {visibleRides.length === 0 && <View className="bg-white rounded-2xl p-7"><Text className="text-center text-[#8E8E93]">No rescue history in this category.</Text></View>}
        {visibleRides.map((ride) => <View key={ride.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <View className={`flex-row items-center justify-between ${ride.status === "completed" ? "mb-3" : ""}`}><Text className="text-[12px] text-[#8E8E93] font-semibold">{new Date(ride.createdAt).toLocaleString()}</Text>{ride.status === "completed" ? <Text className="text-[13px] font-black text-[#34C759]">+50 XP</Text> : <Text className="text-[11px] font-black text-[#FF3B30]">Cancelled</Text>}</View>
          {ride.status === "completed" && <><View className="flex-row items-center gap-3 mb-3"><ProfileAvatar storagePath={ride.passengerProfilePhotoPath} size={40} fallbackEmoji="🙋" /><View><Text className="text-[14px] font-black text-[#1C1C1E]">{ride.passengerName}</Text><Text className="text-[12px] text-[#8E8E93] mt-0.5">{ride.urgency} · {ride.durationMinutes ? `⏱ ${ride.durationMinutes} min` : "Duration unavailable"} · {ride.distanceKm.toFixed(1)} km</Text></View></View><View className="border-t border-[#F2F2F7] pt-3"><View className="flex-row items-center gap-2"><View className="w-2 h-2 rounded-full bg-[#007AFF]" /><Text className="text-[12px] text-[#1C1C1E]">{ride.pickupLabel}</Text></View><View className="flex-row items-center gap-2 mt-1.5"><MapPin size={10} color="#FF3B30" /><Text className="text-[12px] font-semibold text-[#1C1C1E]">{ride.destinationLabel}</Text></View></View></>}
        </View>)}
      </ScrollView>
    </View>
  );
}

import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, ShieldCheck, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bikerApi, PublicBikerProfile } from "@/api/bikers";
import ProfileAvatar from "@/components/profile-avatar";

function formattedDate(value: string | null) {
  return value ? new Date(value).toLocaleDateString() : "Date unavailable";
}

export default function PublicBikerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [profile, setProfile] = useState<PublicBikerProfile | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!id) return;
    bikerApi.get(id)
      .then((data) => {
        if (active) setProfile(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "Could not load biker.");
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (!profile && !error) {
    return (
      <View className="flex-1 bg-[#F2F2F7] items-center justify-center">
        <ActivityIndicator color="#007AFF" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#F2F2F7]" style={{ paddingTop: insets.top }}>
      <View className="bg-white px-4 py-3 flex-row items-center">
        <TouchableOpacity className="w-10 h-10 items-center justify-center" onPress={() => router.back()}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text className="text-[18px] font-black text-[#1C1C1E] ml-2">Public biker profile</Text>
      </View>

      {error || !profile ? (
        <View className="m-4 bg-white rounded-2xl p-6">
          <Text className="text-center text-[#FF3B30]">{error ?? "Biker profile not found."}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 28 }}>
          <View className="bg-white rounded-[24px] p-6 items-center">
            <ProfileAvatar storagePath={profile.biker.profilePhotoPath} size={86} />
            <Text className="text-[24px] font-black text-[#1C1C1E] mt-3">{profile.biker.name}</Text>
            <View className="flex-row items-center mt-1">
              <ShieldCheck size={16} color="#34C759" />
              <Text className="text-[#34C759] font-bold text-[12px] ml-1">Verified biker</Text>
            </View>
            {!!profile.biker.bio && (
              <Text className="text-[#636366] text-center mt-3">{profile.biker.bio}</Text>
            )}
            <Text className="text-[#8E8E93] text-[13px] mt-2">
              {[profile.biker.motorcycleColor, profile.biker.motorcycleModel].filter(Boolean).join(" ")}
            </Text>

            <View className="flex-row mt-5">
              <View className="flex-1 items-center">
                <Text className="text-[22px] font-black text-[#1C1C1E]">
                  {profile.biker.reviewCount ? profile.biker.rating.toFixed(1) : "-"}
                </Text>
                <Text className="text-[11px] text-[#8E8E93]">Rating</Text>
              </View>
              <View className="w-px bg-[#E5E5EA]" />
              <View className="flex-1 items-center">
                <Text className="text-[22px] font-black text-[#1C1C1E]">{profile.biker.reviewCount}</Text>
                <Text className="text-[11px] text-[#8E8E93]">Reviews</Text>
              </View>
              <View className="w-px bg-[#E5E5EA]" />
              <View className="flex-1 items-center">
                <Text className="text-[22px] font-black text-[#1C1C1E]">{profile.biker.totalRescues}</Text>
                <Text className="text-[11px] text-[#8E8E93]">Rescues</Text>
              </View>
            </View>
          </View>

          <Text className="text-[18px] font-black text-[#1C1C1E] mt-6 mb-3">Completed rescues</Text>
          {profile.rescueHistory.length === 0 ? (
            <View className="bg-white rounded-2xl p-5">
              <Text className="text-[#8E8E93] text-center">No completed rescues yet.</Text>
            </View>
          ) : profile.rescueHistory.map((rescue, index) => (
            <View
              key={`${rescue.completedAt ?? "unknown"}-${index}`}
              className="bg-white rounded-2xl p-4 mb-2 flex-row justify-between"
            >
              <View>
                <Text className="font-black text-[#1C1C1E]">Completed rescue</Text>
                <Text className="text-[12px] text-[#8E8E93] mt-1">
                  {rescue.urgency || "Standard"} · {rescue.helmetProvided ? "Helmet provided" : "No helmet requested"}
                </Text>
              </View>
              <Text className="text-[11px] text-[#AEAEB2]">{formattedDate(rescue.completedAt)}</Text>
            </View>
          ))}

          <Text className="text-[18px] font-black text-[#1C1C1E] mt-6 mb-3">Passenger reviews</Text>
          {profile.reviews.length === 0 ? (
            <View className="bg-white rounded-2xl p-5">
              <Text className="text-[#8E8E93] text-center">No passenger reviews yet.</Text>
            </View>
          ) : profile.reviews.map((review) => (
            <View key={review.id} className="bg-white rounded-2xl p-4 mb-3">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="font-black text-[#1C1C1E]">{review.passengerName}</Text>
                  <View className="flex-row mt-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={13}
                        color="#FF9500"
                        fill={value <= review.rating ? "#FF9500" : "transparent"}
                      />
                    ))}
                  </View>
                </View>
                <Text className="text-[11px] text-[#AEAEB2]">{formattedDate(review.createdAt)}</Text>
              </View>
              {!!review.comment && (
                <Text className="text-[14px] text-[#3C3C43] leading-5 mt-3">{review.comment}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

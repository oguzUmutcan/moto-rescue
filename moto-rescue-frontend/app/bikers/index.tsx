import { useRouter } from "expo-router";
import { ArrowLeft, Search, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { bikerApi, PublicBikerSummary } from "@/api/bikers";
import ProfileAvatar from "@/components/profile-avatar";

export default function BikerDirectoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [bikers, setBikers] = useState<PublicBikerSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      setError(null);
      bikerApi.search(query)
        .then((results) => {
          if (active) setBikers(results);
        })
        .catch((requestError) => {
          if (active) {
            setBikers([]);
            setError(requestError instanceof Error ? requestError.message : "Could not search bikers.");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 300);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query]);

  return (
    <View className="flex-1 bg-[#F2F2F7]" style={{ paddingTop: insets.top }}>
      <View className="bg-white px-5 pt-3 pb-4">
        <View className="flex-row items-center">
          <TouchableOpacity
            className="w-10 h-10 items-center justify-center -ml-2"
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
          <View className="ml-2">
            <Text className="text-[24px] font-black text-[#1C1C1E]">Find a biker</Text>
            <Text className="text-[12px] text-[#8E8E93]">Verified MotoRescue bikers</Text>
          </View>
        </View>

        <View className="mt-4 bg-[#F2F2F7] rounded-2xl px-4 h-12 flex-row items-center">
          <Search size={18} color="#8E8E93" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search by biker name"
            autoCapitalize="words"
            returnKeyType="search"
            className="flex-1 ml-3 text-[16px] text-[#1C1C1E]"
          />
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        {loading ? (
          <ActivityIndicator color="#007AFF" className="mt-10" />
        ) : error ? (
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-center text-[#FF3B30]">{error}</Text>
          </View>
        ) : bikers.length === 0 ? (
          <View className="bg-white rounded-2xl p-7">
            <Text className="text-center font-black text-[#1C1C1E]">No verified bikers found</Text>
            <Text className="text-center text-[#8E8E93] mt-1">Try another name.</Text>
          </View>
        ) : bikers.map((biker) => (
          <TouchableOpacity
            key={biker.uid}
            className="bg-white rounded-2xl p-4 mb-3 flex-row items-center"
            onPress={() => router.navigate({ pathname: "/bikers/[id]", params: { id: biker.uid } })}
          >
            <ProfileAvatar storagePath={biker.profilePhotoPath} size={54} />
            <View className="ml-4 flex-1">
              <Text className="text-[17px] font-black text-[#1C1C1E]">{biker.name}</Text>
              <Text className="text-[12px] text-[#8E8E93] mt-0.5">
                {[biker.motorcycleColor, biker.motorcycleModel].filter(Boolean).join(" ") || "Verified biker"}
              </Text>
              <View className="flex-row items-center mt-2">
                <Star size={14} color="#FF9500" fill="#FF9500" />
                <Text className="text-[13px] font-bold text-[#1C1C1E] ml-1">
                  {biker.reviewCount ? biker.rating.toFixed(1) : "New"}
                </Text>
                <Text className="text-[12px] text-[#8E8E93] ml-2">
                  {biker.reviewCount} reviews · {biker.totalRescues} rescues
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

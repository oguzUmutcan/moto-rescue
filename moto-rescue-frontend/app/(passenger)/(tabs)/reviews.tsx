import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Review, reviewApi } from "../../../api/reviews";

export default function PassengerReviewsScreen() {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    reviewApi.mine().then(setReviews).catch((error) =>
      console.error("Could not load reviews", error),
    );
  }, []);

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "—";

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <View className="bg-white shadow-sm px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-[24px] font-black text-[#1C1C1E]">Rider Reviews</Text>
        <Text className="text-[13px] text-[#8E8E93] mt-1">Reviews you submitted after completed rides</Text>
      </View>

      <View className="bg-white mx-4 mt-4 rounded-[20px] p-5 shadow-sm flex-row items-center">
        <Text className="text-[48px] font-black text-[#1C1C1E]">{average}</Text>
        <View className="ml-4"><View className="flex-row">{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={18} color="#FF9500" fill={reviews.length && value <= Math.round(Number(average)) ? "#FF9500" : "transparent"} />)}</View><Text className="text-[13px] text-[#8E8E93] mt-1">{reviews.length} submitted review{reviews.length === 1 ? "" : "s"}</Text></View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 28 }}>
        {reviews.length === 0 ? (
          <View className="bg-white rounded-2xl p-7 items-center"><Text className="text-[30px]">⭐</Text><Text className="font-black text-[#1C1C1E] mt-2">No rider reviews yet</Text><Text className="text-[#8E8E93] text-center mt-1">Complete a rescue to rate your rider.</Text></View>
        ) : reviews.map((review) => (
          <View key={review.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
            <View className="flex-row items-center">
              <View className="w-11 h-11 rounded-full bg-[#EEF4FF] items-center justify-center"><Text className="text-[21px]">🏍️</Text></View>
              <View className="ml-3 flex-1"><Text className="font-black text-[#1C1C1E]">{review.bikerName || "Rider"}</Text><View className="flex-row mt-1">{[1, 2, 3, 4, 5].map((value) => <Star key={value} size={13} color="#FF9500" fill={value <= review.rating ? "#FF9500" : "transparent"} />)}</View></View>
              <Text className="text-[11px] text-[#AEAEB2]">{new Date(review.createdAt).toLocaleDateString()}</Text>
            </View>
            {!!review.comment && <Text className="text-[14px] text-[#3C3C43] leading-5 mt-3">“{review.comment}”</Text>}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

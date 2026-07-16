import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Review, reviewApi } from "../api/reviews";
import ProfileAvatar from "./profile-avatar";

type ReviewMode = "given" | "received";

type CommunityReviewsProps = {
  mode: ReviewMode;
};

export default function CommunityReviews({ mode }: CommunityReviewsProps) {
  const insets = useSafeAreaInsets();
  const [reviews, setReviews] = useState<Review[]>([]);
  const isReceived = mode === "received";

  useEffect(() => {
    const request = isReceived ? reviewApi.received() : reviewApi.mine();
    request.then(setReviews).catch((error) => console.error("Could not load reviews", error));
  }, [isReceived]);

  const average = reviews.length
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length).toFixed(1)
    : "-";
  const title = isReceived ? "Your Reviews" : "Reviews You Gave";
  const subtitle = isReceived ? "Passenger feedback about your completed rescues" : "Your feedback for completed rescues";

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      <View className="bg-white shadow-sm px-5 pb-4" style={{ paddingTop: insets.top + 16 }}>
        <Text className="text-[24px] font-black text-[#1C1C1E]">{title}</Text>
        <Text className="text-[13px] text-[#8E8E93] mt-1">{subtitle}</Text>
      </View>

      <View className="bg-white mx-4 mt-4 rounded-[20px] p-5 shadow-sm flex-row items-center">
        <Text className="text-[48px] font-black text-[#1C1C1E]">{isReceived ? average : reviews.length}</Text>
        <View className="ml-4">
          {isReceived && (
            <View className="flex-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <Star
                  key={value}
                  size={18}
                  color="#FF9500"
                  fill={reviews.length && value <= Math.round(Number(average)) ? "#FF9500" : "transparent"}
                />
              ))}
            </View>
          )}
          <Text className="text-[13px] text-[#8E8E93] mt-1">
            {isReceived
              ? `${reviews.length} review${reviews.length === 1 ? "" : "s"} received`
              : `${reviews.length} review${reviews.length === 1 ? "" : "s"} submitted`}
          </Text>
        </View>
      </View>

      <ScrollView className="flex-1 px-4 pt-4" contentContainerStyle={{ paddingBottom: 28 }}>
        {reviews.length === 0 ? (
          <View className="bg-white rounded-2xl p-7 items-center">
            <Text className="text-[30px]">⭐</Text>
            <Text className="font-black text-[#1C1C1E] mt-2">No reviews yet</Text>
            <Text className="text-[#8E8E93] text-center mt-1">
              {isReceived ? "Passengers can review you after completed rescues." : "Completed rescues you review will appear here."}
            </Text>
          </View>
        ) : reviews.map((review) => {
          const titleText = isReceived ? review.passengerName || "Passenger" : review.bikerName || "Biker";
          const subtitleText = isReceived ? "Reviewed your rescue" : "Your review";
          const photoPath = isReceived ? review.passengerProfilePhotoPath : review.bikerProfilePhotoPath;
          const fallbackEmoji = isReceived ? "🙋" : "🏍️";

          return (
            <View key={review.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
              <View className="flex-row items-center">
                <ProfileAvatar storagePath={photoPath} size={44} fallbackEmoji={fallbackEmoji} />
                <View className="ml-3 flex-1">
                  <Text className="font-black text-[#1C1C1E]">{titleText}</Text>
                  <Text className="text-[11px] text-[#8E8E93]">{subtitleText}</Text>
                  <View className="flex-row mt-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star key={value} size={13} color="#FF9500" fill={value <= review.rating ? "#FF9500" : "transparent"} />
                    ))}
                  </View>
                </View>
                <Text className="text-[11px] text-[#AEAEB2]">{new Date(review.createdAt).toLocaleDateString()}</Text>
              </View>
              {!!review.comment && <Text className="text-[14px] text-[#3C3C43] leading-5 mt-3">{review.comment}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

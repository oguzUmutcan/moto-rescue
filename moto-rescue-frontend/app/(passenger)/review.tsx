import { useLocalSearchParams, useRouter } from "expo-router";
import { Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from "react-native";
import { reviewApi } from "../../api/reviews";
import { rescueApi } from "../../api/rescues";
import ProfileAvatar from "../../components/profile-avatar";

export default function ReviewRideScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [bikerName, setBikerName] = useState("your rider");
  const [bikerProfilePhotoPath, setBikerProfilePhotoPath] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (requestId) rescueApi.get(requestId).then((request) => {
      setBikerName(request.bikerName ?? "your rider");
      setBikerProfilePhotoPath(request.bikerProfilePhotoPath);
    }).catch(() => undefined);
  }, [requestId]);

  const finish = () => router.replace("/(passenger)/(tabs)/history");
  const submit = async () => {
    if (!requestId || submitting) return;
    if (!rating) {
      Alert.alert("Rating required", "Select between 1 and 5 stars.");
      return;
    }
    setSubmitting(true);
    try {
      await reviewApi.create(requestId, rating, comment.trim());
      Alert.alert("Thank you!", "Your rider review has been saved.", [{ text: "Done", onPress: finish }]);
    } catch (error) {
      Alert.alert("Could not save review", error instanceof Error ? error.message : "Please try again");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-[#F2F2F7] justify-center px-5">
      <View className="bg-white rounded-[28px] p-6 shadow-lg">
        <View className="self-center"><ProfileAvatar storagePath={bikerProfilePhotoPath} size={80} /></View>
        <Text className="text-[25px] font-black text-[#1C1C1E] text-center mt-4">How was your ride?</Text>
        <Text className="text-[15px] text-[#8E8E93] text-center mt-1">Rate {bikerName}</Text>
        <View className="flex-row justify-center gap-3 my-6">
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity key={value} onPress={() => setRating(value)} accessibilityLabel={`${value} stars`}>
              <Star size={39} color="#FF9500" fill={value <= rating ? "#FF9500" : "transparent"} />
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="Share a comment about your rider (optional)"
          multiline
          maxLength={500}
          textAlignVertical="top"
          className="h-28 bg-[#F2F2F7] rounded-2xl px-4 py-3 text-[#1C1C1E]"
        />
        <Text className="text-right text-[11px] text-[#AEAEB2] mt-1">{comment.length}/500</Text>
        <TouchableOpacity onPress={submit} disabled={submitting} className="h-14 bg-[#FF9500] rounded-2xl items-center justify-center mt-4">
          <Text className="text-white text-[17px] font-black">{submitting ? "Saving..." : "Submit Review"}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={finish} className="py-4"><Text className="text-center text-[#8E8E93] font-bold">Not now</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

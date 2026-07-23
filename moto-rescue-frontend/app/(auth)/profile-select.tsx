import { useRouter } from "expo-router";
import { ArrowLeft, Check } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, Text, TouchableOpacity, View } from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- FIREBASE IMPORTS ---
import { userApi } from "../../api/users";

export default function ProfileSelectScreen() {
  const [selectedRole, setSelectedRole] = useState<
    "passenger" | "biker" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const options = [
    {
      id: "passenger",
      icon: "🙋",
      title: "I need a ride",
      subtitle: "A commuter who might get stuck in traffic",
      activeColor: "#007AFF",
      activeBg: "#EEF4FF",
    },
    {
      id: "biker",
      icon: "🏍",
      title: "I'm a volunteer biker",
      subtitle: "I have a motorcycle and want to help my community",
      activeColor: "#34C759",
      activeBg: "#EDFAF3",
    },
  ] as const;

  const handleContinue = async () => {
    if (!selectedRole) return;

    setIsLoading(true);
    try {
      await userApi.setRole(selectedRole);

      // Navigate to the selected profile setup screen.
      if (selectedRole === "passenger") {
        router.navigate("/(auth)/profile-passenger");
      } else if (selectedRole === "biker") {
        router.navigate("/(auth)/profile-biker");
      }
    } catch (error: any) {
      console.error("Error updating role:", error);
      Alert.alert("Error", "Could not save your role. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: insets?.top ? insets.top : 40,
        paddingBottom: insets?.bottom > 0 ? insets.bottom : 24,
      }}
    >
      {/* Header / Back Button */}
      <View className="px-4 pt-2 mb-2">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-3 w-14"
          activeOpacity={0.7}
          disabled={isLoading}
        >
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6">
        <Text className="text-[28px] font-black text-[#1C1C1E] tracking-tight mb-2 leading-tight">
          How will you use{"\n"}MotoRescue?
        </Text>
        <Text className="text-[15px] text-[#8E8E93] mb-8">
          You can add the other role later.
        </Text>

        {/* Role Options */}
        {options.map((option) => {
          const isSelected = selectedRole === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              onPress={() => !isLoading && setSelectedRole(option.id)}
              activeOpacity={0.8}
              className={`flex-row items-center p-4 mb-4 rounded-[20px] border-2 transition-all ${
                isSelected
                  ? "border-transparent"
                  : "border-[#F2F2F7] bg-[#FAFAFA]"
              }`}
              style={{
                backgroundColor: isSelected ? option.activeBg : "#FAFAFA",
              }}
            >
              {/* Icon Box */}
              <View
                className={`w-[62px] h-[62px] rounded-[18px] items-center justify-center mr-3.5 ${
                  isSelected ? "" : "bg-[#F2F2F7]"
                }`}
                style={{
                  backgroundColor: isSelected ? option.activeColor : "#F2F2F7",
                }}
              >
                <Text className="text-[28px]">{option.icon}</Text>
              </View>

              {/* Text Content */}
              <View className="flex-1 justify-center">
                <Text className="text-[17px] font-extrabold text-[#1C1C1E] mb-1">
                  {option.title}
                </Text>
                <Text className="text-[13px] text-[#8E8E93] leading-snug pr-2">
                  {option.subtitle}
                </Text>
              </View>

              {/* Radio Checkbox */}
              <View
                className={`w-[24px] h-[24px] rounded-full items-center justify-center border-2 ${
                  isSelected ? "border-transparent" : "border-[#C7C7CC]"
                }`}
                style={{
                  backgroundColor: isSelected
                    ? option.activeColor
                    : "transparent",
                }}
              >
                {isSelected && (
                  <Check size={12} color="white" strokeWidth={3} />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Bottom Button */}
      <View className="px-6 pb-2">
        <TouchableOpacity
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selectedRole || isLoading}
          className={`w-full h-14 rounded-2xl items-center justify-center ${
            isLoading
              ? "bg-[#C7C7CC]"
              : selectedRole === "passenger"
                ? "bg-[#007AFF]"
                : selectedRole === "biker"
                  ? "bg-[#34C759]"
                  : "bg-[#F2F2F7]"
          }`}
        >
          <Text
            className={`text-[17px] font-extrabold ${selectedRole ? "text-white" : "text-[#AEAEB2]"}`}
          >
            {isLoading
              ? "Saving..."
              : selectedRole === "passenger"
                ? "Continue as Passenger"
                : selectedRole === "biker"
                  ? "Continue as Biker"
                  : "Select a role"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

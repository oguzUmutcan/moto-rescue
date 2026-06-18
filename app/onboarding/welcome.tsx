import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
// In Expo, install and import from 'lucide-react-native'
import { useRouter } from "expo-router";
import { ChevronRight, Zap } from "lucide-react-native";

export default function WelcomeScreen({
  onNext,
  insets,
}: {
  onNext: () => void;
  insets: any;
}) {
  const router = useRouter();
  // When we set up navigation later, we will use Expo Router here
  const handleNext = () => {
    router.push("/onboarding/passenger");
  };

  return (
    <View
      className="flex-1 bg-[#007AFF]"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {/* Main Content Area */}
      <View className="flex-1 items-center justify-center px-7 pb-6 text-center">
        {/* Logo Graphic */}
        <View className="relative mb-7">
          <View className="w-24 h-24 rounded-[28px] bg-white/15 items-center justify-center">
            <View className="w-16 h-16 rounded-[18px] bg-white items-center justify-center">
              <Text className="text-[34px]">🏍</Text>
            </View>
          </View>

          {/* Orange Zap Badge */}
          <View className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#FF9500] border-[3px] border-[#007AFF] items-center justify-center">
            <Zap size={13} color="white" fill="white" />
          </View>
        </View>

        {/* Headings */}
        <Text className="text-[38px] font-black text-white leading-tight tracking-tight mb-1.5">
          MotoRescue
        </Text>
        <Text className="text-[13px] text-white/65 tracking-widest uppercase font-bold mb-9">
          Community Heroes on Two Wheels
        </Text>

        {/* Info Card */}
        <View className="bg-white/10 rounded-[20px] p-[22px] border border-white/20 mb-9">
          <Text className="text-[17px] text-white leading-relaxed font-medium text-center">
            Stuck in traffic with an exam in 45 minutes? Our network of
            volunteer motorcyclists will get you there — for free.
          </Text>
        </View>

        {/* Pagination Dots */}
        <View className="flex-row gap-2">
          <View className="w-[22px] h-[7px] rounded-full bg-white" />
          <View className="w-[7px] h-[7px] rounded-full bg-white/35" />
          <View className="w-[7px] h-[7px] rounded-full bg-white/35" />
        </View>
      </View>

      {/* Bottom Button Area */}
      <View className="px-6 pb-7">
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={0.8}
          className="w-full h-14 rounded-2xl bg-white flex-row items-center justify-center"
        >
          <Text className="text-[#007AFF] text-[17px] font-extrabold mr-2">
            Get Started
          </Text>
          <ChevronRight size={20} color="#007AFF" strokeWidth={3} />
        </TouchableOpacity>

        <Text className="text-center text-white/55 text-[13px] mt-3.5">
          Free · Community driven · Zero profit
        </Text>
      </View>
    </View>
  );
}

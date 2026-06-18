import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import React, { useRef, useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OTPScreen() {
  const [code, setCode] = useState("");
  const inputRef = useRef<TextInput>(null);
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // This creates an array of exactly 6 slots to draw our boxes
  // Example: if code is "123", array is ['1', '2', '3', '', '', '']
  const codeArray = new Array(6).fill(0).map((_, i) => code[i] || "");
  const isComplete = code.length === 6;

  const phone = params.phone || "unknown number";
  const dialCode = params.dialCode || "unknown dial code";

  const handleVerify = () => {
    if (isComplete) {
      // For a new user sign-up flow, we route them to the role selection next!
      router.push("/(auth)/profile-select");
      console.log("Code verified:", code);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className="flex-1 bg-white"
          style={{
            paddingTop: insets?.top ? insets.top : 40,
            paddingBottom: insets?.bottom > 0 ? insets.bottom : 24,
          }}
        >
          {/* Header / Back Button */}
          <View className="px-4 pt-2 mb-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-3 w-14"
              activeOpacity={0.7}
            >
              <ArrowLeft size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>

          {/* Main Content */}
          <View className="flex-1 px-6">
            {/* Top Icon */}
            <View className="w-[60px] h-[60px] rounded-full bg-[#EEF4FF] items-center justify-center mb-5">
              <Text className="text-[28px]">💬</Text>
            </View>

            {/* Headings */}
            <Text className="text-[28px] font-black text-[#1C1C1E] tracking-tight mb-1.5">
              Enter the code
            </Text>
            <Text className="text-[15px] text-[#8E8E93] mb-7">
              Sent to{" "}
              <Text className="font-bold text-[#1C1C1E]">
                {dialCode} {phone}
              </Text>
            </Text>

            {/* OTP Boxes Area */}
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => inputRef.current?.focus()}
              className="flex-row justify-between mb-8 relative"
            >
              {/* The 6 visual boxes */}
              {codeArray.map((digit, index) => {
                // Highlight the box that is currently next to be typed in
                const isActive = code.length === index;
                const hasValue = digit !== "";

                return (
                  <View
                    key={index}
                    className={`w-[14%] aspect-[4/5] rounded-[14px] items-center justify-center border-[2.5px] ${
                      hasValue
                        ? "bg-[#007AFF] border-[#007AFF]"
                        : isActive
                          ? "bg-[#F2F2F7] border-[#007AFF]"
                          : "bg-[#F2F2F7] border-transparent"
                    }`}
                  >
                    <Text
                      className={`text-[26px] font-black ${hasValue ? "text-white" : "text-[#1C1C1E]"}`}
                    >
                      {digit}
                    </Text>
                  </View>
                );
              })}

              {/* The invisible master TextInput */}
              <TextInput
                ref={inputRef}
                value={code}
                onChangeText={setCode}
                maxLength={6}
                keyboardType="number-pad"
                autoFocus={true}
                // Hide it completely off-screen or make it transparent
                className="absolute w-full h-full opacity-0"
                style={{ color: "transparent" }}
                caretHidden={true}
              />
            </TouchableOpacity>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleVerify}
              activeOpacity={0.8}
              disabled={!isComplete}
              className={`w-full h-14 rounded-2xl items-center justify-center transition-all ${
                isComplete ? "bg-[#007AFF]" : "bg-[#F2F2F7]"
              }`}
            >
              <Text
                className={`text-[17px] font-extrabold ${isComplete ? "text-white" : "text-[#AEAEB2]"}`}
              >
                {isComplete ? "Verify & Continue" : "Waiting for code…"}
              </Text>
            </TouchableOpacity>

            {/* Resend Code Link */}
            <Text className="text-center text-[14px] text-[#8E8E93] mt-6">
              Didn't get it?{" "}
              <Text className="text-[#007AFF] font-bold">Resend in 0:45</Text>
            </Text>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

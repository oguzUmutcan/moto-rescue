import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// Make sure to import from lucide-react-native, NOT lucide-react
import { ArrowLeft, Camera, Info, User } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfilePassengerScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleSaveProfile = () => {
    Keyboard.dismiss();
    // Navigate to the main Passenger Dashboard!
    router.push("/(passenger)/dashboard");
    console.log("Profile saved:", { name, email, emergencyContact });
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: insets?.top ? insets.top : 40,
        paddingBottom: insets?.bottom > 0 ? insets.bottom : 24,
      }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-2 pt-2 pb-3 border-b border-[#F2F2F7]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-[17px] font-extrabold text-[#1C1C1E]">
            Passenger Profile
          </Text>
          <View className="w-12" /> {/* Spacer to center the title */}
        </View>

        {/* Scrollable Form Content */}
        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Upload Area */}
          <View className="items-center mb-8">
            <TouchableOpacity activeOpacity={0.8} className="relative mb-2">
              <View className="w-[88px] h-[88px] rounded-full bg-[#F2F2F7] items-center justify-center">
                <User size={36} color="#C7C7CC" />
              </View>
              {/* Camera Badge */}
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#007AFF] border-[3px] border-white items-center justify-center">
                <Camera size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-[14px] text-[#007AFF] font-bold">
              Add photo
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Full Name
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="Yacine Benamar"
              placeholderTextColor="#C7C7CC"
              value={name}
              onChangeText={setName}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Email Address
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="yacine@gmail.com"
              placeholderTextColor="#C7C7CC"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-6">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Emergency Contact
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="+90 555 999 0000"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
            />
          </View>

          {/* Info Banner */}
          <View className="flex-row bg-[#EEF4FF] rounded-2xl p-4 mb-8">
            <Info size={20} color="#007AFF" className="mt-0.5 mr-3 shrink-0" />
            <Text className="flex-1 text-[13px] text-[#007AFF] leading-snug">
              Your name is shown to the biker for ID. Your contact info is never
              shared publicly.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Save Button */}
        <View className="px-6 pb-2 pt-4 bg-white border-t border-[#F2F2F7]/50">
          <TouchableOpacity
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center ${
              name.length > 2 ? "bg-[#007AFF]" : "bg-[#007AFF]/50"
            }`}
            disabled={name.length <= 2}
          >
            <Text className="text-white text-[17px] font-extrabold">
              Save Profile
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

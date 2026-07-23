import { useRouter } from "expo-router";
import { ArrowLeft, Edit2, Phone, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StatusBar, Text, TouchableOpacity, View } from "@/components/localized-native";
import { createUserWithEmailAndPassword, deleteUser, updateProfile } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userApi } from "../../api/users";
import { auth } from "../../config/firebase";
import { useRegistration } from "../../contexts/registration";
import {
  createRegistrationAccount,
  registrationErrorMessage,
} from "../../utils/registration-workflow";
import { getActiveLanguage } from "../../localization/i18n";

export default function ConfirmPhoneScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isCompletingRegistration = useRef(false);
  const { draft, clearDraft } = useRegistration();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!draft && !isCompletingRegistration.current) router.replace("/(auth)/register");
  }, [draft, router]);

  if (!draft) return null;
  const { phone, dialCode, name, email, password } = draft;

  const handleConfirm = async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await createRegistrationAccount(
        { email, password, name, phone: `${dialCode}${phone}` },
        {
          createAuthUser: async (accountEmail, accountPassword) =>
            (await createUserWithEmailAndPassword(auth, accountEmail, accountPassword)).user,
          updateAuthProfile: (user, displayName) => updateProfile(user, { displayName }),
          createBackendProfile: (profileName, profilePhone) =>
            userApi.create({ name: profileName, phone: profilePhone, language: getActiveLanguage() }),
          deleteAuthUser: deleteUser,
        },
      );

      isCompletingRegistration.current = true;
      clearDraft();
      router.replace("/(auth)/profile-select");
    } catch (error) {
      Alert.alert("Registration Failed", registrationErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
      <StatusBar barStyle="dark-content" />
      <View className="px-6 pt-4 mb-6">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 w-12" disabled={isLoading}>
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6">
        <View className="mb-8">
          <Text className="text-[32px] font-black text-[#1C1C1E] mb-2">Confirm Details</Text>
          <Text className="text-[16px] text-[#8E8E93]">
            Please double check your information before we create your account.
          </Text>
        </View>

        <View className="bg-[#F2F2F7] rounded-3xl p-6 mb-8">
          <View className="flex-row items-center mb-6">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
              <User size={24} color="#007AFF" />
            </View>
            <View>
              <Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">Name</Text>
              <Text className="text-[17px] font-semibold text-[#1C1C1E]">{name}</Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#E5E5EA] mb-6" />

          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
              <Phone size={24} color="#007AFF" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">Phone Number</Text>
              <Text className="text-[17px] font-semibold text-[#1C1C1E]">{dialCode} {phone}</Text>
            </View>
            <TouchableOpacity onPress={() => router.back()} className="p-2" disabled={isLoading}>
              <Edit2 size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => void handleConfirm()}
          activeOpacity={0.8}
          disabled={isLoading}
          className={`w-full h-14 rounded-2xl items-center justify-center shadow-sm ${isLoading ? "bg-[#007AFF]/60" : "bg-[#007AFF]"}`}
        >
          <Text className="text-[17px] font-extrabold text-white">
            {isLoading ? "Creating Account..." : "Confirm & Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

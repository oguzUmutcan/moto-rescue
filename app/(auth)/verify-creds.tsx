// Note: This code is strictly for the Expo React Native environment.
import { useLocalSearchParams, useRouter } from "expo-router";
import { ArrowLeft, Edit2, Phone, User } from "lucide-react-native";
import React, { useState } from "react";
import { Alert, StatusBar, Text, TouchableOpacity, View } from "react-native";

// --- CENTRAL FIREBASE IMPORTS ---
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { auth, db } from "../../config/firebase";

export default function ConfirmPhoneScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(false);

  // Retrieve data passed from previous registration screen
  const phone = Array.isArray(params.phone)
    ? params.phone[0]
    : params.phone || "Not provided";
  const dialCode = Array.isArray(params.dialCode)
    ? params.dialCode[0]
    : params.dialCode || "+90";
  const name = Array.isArray(params.name)
    ? params.name[0]
    : params.name || "User";
  const email = Array.isArray(params.email)
    ? params.email[0]
    : params.email || "Not provided";
  const password = Array.isArray(params.password)
    ? params.password[0]
    : params.password || "Not provided";

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      // 1. Register the user securely in Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      const user = userCredential.user;

      // 2. Save their Full Name to their Firebase Auth profile
      await updateProfile(user, { displayName: name });

      // 3. IMPORTANT: Save their complete profile to the Firestore Database
      const fullPhoneNumber = `${dialCode}${phone}`;
      await setDoc(doc(db, "users", user.uid), {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: fullPhoneNumber,
        phoneVerified: false, // Set to false initially, can be changed if you add OTP later
        role: null, // They haven't picked a role yet
        createdAt: serverTimestamp(),
      });

      console.log("✅ User created in Auth & Firestore successfully!");

      // 4. Navigate to Role Selection
      router.push("/(auth)/profile-select");
    } catch (error: any) {
      console.error("Registration Error:", error);
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 bg-white"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar barStyle="dark-content" />

      <View className="px-6 pt-4 mb-6">
        <TouchableOpacity
          onPress={() => router.back()}
          className="p-2 -ml-2 w-12"
          disabled={isLoading}
        >
          <ArrowLeft size={24} color="#1C1C1E" />
        </TouchableOpacity>
      </View>

      <View className="flex-1 px-6">
        <View className="mb-8">
          <Text className="text-[32px] font-black text-[#1C1C1E] mb-2">
            Confirm Details
          </Text>
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
              <Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">
                Name
              </Text>
              <Text className="text-[17px] font-semibold text-[#1C1C1E]">
                {name}
              </Text>
            </View>
          </View>

          <View className="h-[1px] bg-[#E5E5EA] mb-6" />

          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4">
              <Phone size={24} color="#007AFF" />
            </View>
            <View className="flex-1">
              <Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">
                Phone Number
              </Text>
              <Text className="text-[17px] font-semibold text-[#1C1C1E]">
                {dialCode} {phone}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.back()}
              className="p-2"
              disabled={isLoading}
            >
              <Edit2 size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleConfirm}
          activeOpacity={0.8}
          disabled={isLoading}
          className={`w-full h-14 rounded-2xl items-center justify-center shadow-sm ${
            isLoading ? "bg-[#007AFF]/60" : "bg-[#007AFF]"
          }`}
        >
          <Text className="text-[17px] font-extrabold text-white">
            {isLoading ? "Creating Account..." : "Confirm & Continue"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

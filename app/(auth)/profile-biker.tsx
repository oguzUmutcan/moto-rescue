import { useRouter } from "expo-router";
import {
  ArrowLeft,
  Camera,
  ShieldCheck,
  UploadCloud,
  User,
} from "lucide-react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileBikerScreen() {
  const [name, setName] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [hasUploadedID, setHasUploadedID] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isFormValid =
    name.length > 2 && plateNumber.length > 5 && hasUploadedID;

  const handleSaveProfile = () => {
    Keyboard.dismiss();
    // Navigate to the main Biker Dashboard!
    router.push("/(biker)/dashboard");
    console.log("Profile saved:", { name, plateNumber, hasUploadedID });
  };

  const handleDocumentUpload = () => {
    // In a real app, this would open expo-image-picker or expo-document-picker
    setHasUploadedID(true);
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
            <ArrowLeft size={24} color="#34C759" />
          </TouchableOpacity>
          <Text className="text-[17px] font-extrabold text-[#1C1C1E]">
            Biker Profile
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
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#34C759] border-[3px] border-white items-center justify-center">
                <Camera size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-[14px] text-[#34C759] font-bold">
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

          <View className="mb-6">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              License Plate Number
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="34 ABC 123"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="characters"
              value={plateNumber}
              onChangeText={setPlateNumber}
            />
          </View>

          {/* ID Verification Upload */}
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Verification Document
          </Text>
          <TouchableOpacity
            onPress={handleDocumentUpload}
            activeOpacity={0.8}
            className={`w-full border-2 border-dashed rounded-[14px] p-5 mb-8 flex-row items-center transition-colors ${
              hasUploadedID
                ? "border-[#34C759] bg-[#EDFAF3]"
                : "border-[#C7C7CC] bg-[#FAFAFA]"
            }`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${
                hasUploadedID ? "bg-[#34C759]" : "bg-[#F2F2F7]"
              }`}
            >
              {hasUploadedID ? (
                <ShieldCheck size={20} color="white" />
              ) : (
                <UploadCloud size={20} color="#8E8E93" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`text-[15px] font-bold mb-0.5 ${
                  hasUploadedID ? "text-[#34C759]" : "text-[#1C1C1E]"
                }`}
              >
                {hasUploadedID
                  ? "Driver's License Uploaded"
                  : "Upload Driver's License"}
              </Text>
              <Text className="text-[13px] text-[#8E8E93]">
                {hasUploadedID
                  ? "Verification pending approval"
                  : "Photo of front and back"}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Info Banner */}
          <View className="flex-row bg-[#EDFAF3] rounded-2xl p-4 mb-8">
            <ShieldCheck
              size={20}
              color="#34C759"
              className="mt-0.5 mr-3 shrink-0"
            />
            <Text className="flex-1 text-[13px] text-[#34C759] leading-snug">
              We verify all bikers to ensure passenger safety. Your documents
              are securely encrypted.
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Save Button */}
        <View className="px-6 pb-2 pt-4 bg-white border-t border-[#F2F2F7]/50">
          <TouchableOpacity
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center ${
              isFormValid ? "bg-[#34C759]" : "bg-[#34C759]/50"
            }`}
            disabled={!isFormValid}
          >
            <Text className="text-white text-[17px] font-extrabold">
              Submit for Verification
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

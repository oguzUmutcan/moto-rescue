import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ShieldCheck,
  Smile,
  X,
} from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- FIREBASE IMPORTS ---
import { auth } from "../../config/firebase";
import { userApi } from "../../api/users";
import IdentityDocumentUpload from "../../components/identity-document-upload";
import ProfilePhoto from "../../components/profile-photo";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const AVATAR_EMOJIS = [
  "🦸",
  "🦸‍♂️",
  "🦸‍♀️",
  "🏍",
  "🏎",
  "🧑",
  "👨",
  "🧔",
  "👩",
  "🥷",
  "🕵️",
  "😎",
  "🤓",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🐯",
  "🦁",
  "🐰",
  "🦄",
  "🐸",
  "🦉",
  "🚀",
];

export default function ProfileBikerScreen() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [plateNumber, setPlateNumber] = useState("");
  const [bio, setBio] = useState("");
  const [motorcycleModel, setMotorcycleModel] = useState("");
  const [motorcycleColor, setMotorcycleColor] = useState("");
  const [availableDays, setAvailableDays] = useState([
    true,
    true,
    true,
    true,
    true,
    false,
    false,
  ]);
  const [hasUploadedID, setHasUploadedID] = useState(false);
  const [identityDocumentStatus, setIdentityDocumentStatus] = useState<"not_submitted" | "pending" | "verified" | "rejected">("not_submitted");
  const [profileEmoji, setProfileEmoji] = useState("🦸"); // Default Biker Emoji
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);

  const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isFormValid =
    name.length > 2 && phone.replace(/\D/g, "").length >= 7 && plateNumber.length > 5 && hasUploadedID;

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setName(auth.currentUser.displayName || "");

        const data = await userApi.get();
        if (data) {
          if (data.name) setName(data.name);
          if (data.phone) setPhone(data.phone);
          if (data.plateNumber) setPlateNumber(data.plateNumber);
          if (data.bio) setBio(data.bio);
          if (data.motorcycleModel) setMotorcycleModel(data.motorcycleModel);
          if (data.motorcycleColor) setMotorcycleColor(data.motorcycleColor);
          if (data.availableDays) setAvailableDays(data.availableDays);
          if (data.identityDocumentStatus === "pending" || data.identityDocumentStatus === "verified") {
            setHasUploadedID(true);
          }
          setIdentityDocumentStatus(data.identityDocumentStatus);
          if (data.profileEmoji) setProfileEmoji(data.profileEmoji);
          setProfilePhotoPath(data.profilePhotoPath);
        }
      }
    };
    fetchUserData();
  }, []);

  const handleSaveProfile = async () => {
    if (!auth.currentUser) return;
    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await userApi.update({
        name: name.trim(),
        phone: phone.trim(),
        plateNumber: plateNumber.trim().toUpperCase(),
        bio: bio.trim(),
        motorcycleModel: motorcycleModel.trim(),
        motorcycleColor: motorcycleColor.trim(),
        availableDays: availableDays,
        profileEmoji: profileEmoji, // Save Emoji String
      });

      console.log("✅ Biker Profile saved in Firestore!");
      router.navigate("/(biker)/(tabs)/dashboard");
    } catch (error: unknown) {
      console.error("Error saving biker profile:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDay = (index: number) => {
    const newDays = [...availableDays];
    newDays[index] = !newDays[index];
    setAvailableDays(newDays);
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
        <View className="flex-row items-center justify-between px-2 pt-2 pb-3 border-b border-[#F2F2F7]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3"
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ArrowLeft size={24} color="#34C759" />
          </TouchableOpacity>
          <Text className="text-[17px] font-extrabold text-[#1C1C1E]">
            Biker Profile
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Profile photo and emoji fallback */}
          <View className="items-center mb-8">
            <View className="mb-3">
              <ProfilePhoto
                fallbackEmoji={profileEmoji}
                storagePath={profilePhotoPath}
                onStoragePathChange={setProfilePhotoPath}
              />
            </View>
            <Text className="text-[14px] text-[#34C759] font-bold mb-3">
              Tap photo to add or change
            </Text>
            <TouchableOpacity
              onPress={() => !isLoading && setIsEmojiModalVisible(true)}
              activeOpacity={0.8}
              className="relative mb-2"
            >
              <View className="w-[88px] h-[88px] rounded-full bg-[#EDFAF3] items-center justify-center border-2 border-[#34C759]/10">
                <Text className="text-[44px] leading-tight">
                  {profileEmoji}
                </Text>
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#34C759] border-[3px] border-white items-center justify-center">
                <Smile size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-[14px] text-[#34C759] font-bold">
              Choose Emoji Fallback
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Contact Phone
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="+90 555 111 2233"
              placeholderTextColor="#C7C7CC"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(value) => setPhone(value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 16))}
              editable={!isLoading}
            />
            <Text className="text-[12px] text-[#8E8E93] mt-1.5">Passengers can use this number only after you accept their rescue.</Text>
          </View>

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
              editable={!isLoading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Short Bio
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="e.g. Algiers local. Happy to help..."
              placeholderTextColor="#C7C7CC"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              value={bio}
              onChangeText={setBio}
              style={{ minHeight: 80 }}
              editable={!isLoading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Motorcycle Model
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="Yamaha YBR 125"
              placeholderTextColor="#C7C7CC"
              value={motorcycleModel}
              onChangeText={setMotorcycleModel}
              editable={!isLoading}
            />
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Motorcycle Color
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="Dark Blue"
              placeholderTextColor="#C7C7CC"
              value={motorcycleColor}
              onChangeText={setMotorcycleColor}
              editable={!isLoading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              License Plate Number
            </Text>
            <TextInput
              className="w-full bg-[#F2F2F7] rounded-[14px] px-4 py-4 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="16-DZ-12345"
              placeholderTextColor="#C7C7CC"
              autoCapitalize="characters"
              value={plateNumber}
              onChangeText={setPlateNumber}
              editable={!isLoading}
            />
          </View>

          <View className="mb-8">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-3">
              Available Days
            </Text>
            <View className="flex-row justify-between">
              {DAYS.map((d, i) => {
                const isSelected = availableDays[i];
                return (
                  <TouchableOpacity
                    key={d}
                    onPress={() => !isLoading && toggleDay(i)}
                    activeOpacity={0.7}
                    className={`w-[42px] h-[42px] rounded-xl items-center justify-center ${isSelected ? "bg-[#34C759]" : "bg-[#F2F2F7]"}`}
                  >
                    <Text
                      className={`text-[12px] font-black ${isSelected ? "text-white" : "text-[#AEAEB2]"}`}
                    >
                      {d}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Verification Document
          </Text>
          <View className="mb-8">
            <IdentityDocumentUpload
              initialStatus={identityDocumentStatus}
              onSubmitted={(profile) => {
                setIdentityDocumentStatus(profile.identityDocumentStatus);
                setHasUploadedID(profile.identityDocumentStatus === "pending" || profile.identityDocumentStatus === "verified");
              }}
            />
          </View>

          <View className="flex-row bg-[#EDFAF3] rounded-2xl p-4 mb-8">
            <ShieldCheck
              size={20}
              color="#34C759"
              className="mt-0.5 mr-3 shrink-0"
            />
            <Text className="flex-1 text-[13px] text-[#34C759] leading-snug">
              We review biker documents for passenger safety. Your images stay
              private and cannot be viewed by other app users.
            </Text>
          </View>
        </ScrollView>

        <View className="px-6 pb-2 pt-4 bg-white border-t border-[#F2F2F7]/50">
          <TouchableOpacity
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center ${isFormValid && !isLoading ? "bg-[#34C759]" : "bg-[#34C759]/50"}`}
            disabled={!isFormValid || isLoading}
          >
            <Text className="text-white text-[17px] font-extrabold">
              {isLoading ? "Submitting..." : "Save & Continue"}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {}
      {/* Emoji Picker Modal */}
      <Modal
        visible={isEmojiModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsEmojiModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] px-6 pt-4 pb-8 h-[60%]">
            <View className="flex-row items-center justify-between mb-4 border-b border-[#F2F2F7] pb-4">
              <Text className="text-[20px] font-black text-[#1C1C1E]">
                Select Avatar
              </Text>
              <TouchableOpacity
                onPress={() => setIsEmojiModalVisible(false)}
                className="w-8 h-8 bg-[#F2F2F7] rounded-full items-center justify-center"
              >
                <X size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="flex-row flex-wrap justify-between">
                {AVATAR_EMOJIS.map((emoji, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      setProfileEmoji(emoji);
                      setIsEmojiModalVisible(false);
                    }}
                    className={`w-[22%] aspect-square items-center justify-center rounded-2xl mb-3 ${profileEmoji === emoji ? "bg-[#EDFAF3] border-2 border-[#34C759]" : "bg-[#F2F2F7]"}`}
                  >
                    <Text className="text-[32px]">{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

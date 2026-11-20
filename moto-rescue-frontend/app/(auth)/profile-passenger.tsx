import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Info, Mail, Phone, Smile, User, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { COUNTRIES } from "../../constants/countries";

// --- FIREBASE IMPORTS ---
import { auth } from "../../config/firebase";
import { userApi } from "../../api/users";
import ProfilePhoto from "../../components/profile-photo";

const AVATAR_EMOJIS = [
  "🙋",
  "🙋‍♂️",
  "🙋‍♀️",
  "🧔",
  "👩‍🦰",
  "👨‍🦳",
  "😎",
  "🤓",
  "🦸",
  "🦸‍♀️",
  "🥷",
  "🕵️",
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
  "🦋",
  "👾",
];

export default function ProfilePassengerScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profileEmoji, setProfileEmoji] = useState("🙋"); // Default Emoji
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setName(auth.currentUser.displayName || "");
        setEmail(auth.currentUser.email || "");

        const data = await userApi.get();
        if (data) {
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.phone) setPhone(data.phone);
          if (data.profileEmoji) setProfileEmoji(data.profileEmoji);
          const emergency = data.emergencyContact;
          if (emergency) {
            const match = COUNTRIES.find((c) =>
              emergency.startsWith(c.dialCode),
            );
            if (match) {
              setSelectedCountry(match);
              setEmergencyContact(
                emergency.slice(match.dialCode.length),
              );
            } else {
              setEmergencyContact(emergency);
            }
          }
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
      const fullEmergencyContact = emergencyContact
        ? `${selectedCountry.dialCode}${emergencyContact}`
        : "";

      await userApi.update({
        name: name.trim(),
        phone: phone.trim(),
        emergencyContact: fullEmergencyContact,
        profileEmoji: profileEmoji, // Save the emoji string directly!
      });

      console.log("✅ Passenger Profile saved in Firestore!");
      router.navigate("/(passenger)/(tabs)/dashboard");
    } catch (error: unknown) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", error instanceof Error ? error.message : "Failed to save profile. Please try again.");
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
      <View className="flex-1">
        <View className="flex-row items-center justify-between px-2 pt-2 pb-3 border-b border-[#F2F2F7]">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-3"
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-[17px] font-extrabold text-[#1C1C1E]">
            Passenger Profile
          </Text>
          <View className="w-12" />
        </View>

        <KeyboardAwareScrollView
          bottomOffset={16}
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
            <Text className="text-[14px] text-[#007AFF] font-bold mb-3">
              Tap photo to add or change
            </Text>
            <TouchableOpacity
              onPress={() => !isLoading && setIsEmojiModalVisible(true)}
              activeOpacity={0.8}
              className="relative mb-2"
            >
              <View className="w-[88px] h-[88px] rounded-full bg-[#EEF4FF] items-center justify-center border-2 border-[#007AFF]/10">
                <Text className="text-[44px] leading-tight">
                  {profileEmoji}
                </Text>
              </View>
              <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#007AFF] border-[3px] border-white items-center justify-center">
                <Smile size={14} color="white" />
              </View>
            </TouchableOpacity>
            <Text className="text-[14px] text-[#007AFF] font-bold">
              Choose Fallback Emoji
            </Text>
          </View>

          {/* Form Fields */}
          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Full Name
            </Text>
            <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] px-4 h-14">
              <User size={20} color="#8E8E93" />
              <TextInput
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E] font-medium"
                placeholder="Yacine Benamar"
                placeholderTextColor="#C7C7CC"
                value={name}
                onChangeText={setName}
                editable={!isLoading}
                autoCapitalize="words"
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Contact Phone
            </Text>
            <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] px-4 h-14">
              <Phone size={20} color="#8E8E93" />
              <TextInput
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E] font-medium"
                placeholder="+90 555 111 2233"
                placeholderTextColor="#C7C7CC"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(value) => setPhone(value.replace(/[^\d+]/g, "").replace(/(?!^)\+/g, "").slice(0, 16))}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mb-4">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Email Address
            </Text>
            <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] px-4 h-14">
              <Mail size={20} color="#8E8E93" />
              <TextInput
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E] font-medium"
                placeholder="yacine@gmail.com"
                placeholderTextColor="#C7C7CC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                editable={!isLoading}
              />
            </View>
          </View>

          <View className="mb-6">
            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Emergency Contact
            </Text>
            <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] h-14 overflow-hidden">
              <TouchableOpacity
                onPress={() => !isLoading && setIsCountryModalVisible(true)}
                className="flex-row items-center px-3.5 h-full border-r border-black/5 bg-[#E5E5EA]/30"
              >
                <Text className="text-[20px] mr-1.5">
                  {selectedCountry.flag}
                </Text>
                <Text className="text-[15px] font-bold text-[#1C1C1E] mr-1.5">
                  {selectedCountry.dialCode}
                </Text>
                <ChevronDown size={16} color="#8E8E93" />
              </TouchableOpacity>
              <TextInput
                className="flex-1 h-full px-3.5 text-[17px] font-medium text-[#1C1C1E]"
                keyboardType="phone-pad"
                value={emergencyContact}
                onChangeText={(val) =>
                  setEmergencyContact(
                    val.replace(/\D/g, "").slice(0, selectedCountry.maxLength),
                  )
                }
                maxLength={selectedCountry.maxLength}
                editable={!isLoading}
                placeholder="555 999 0000"
                placeholderTextColor="#C7C7CC"
              />
            </View>
          </View>

          <View className="flex-row bg-[#EEF4FF] rounded-2xl p-4 mb-8">
            <Info size={20} color="#007AFF" className="mt-0.5 mr-3 shrink-0" />
            <Text className="flex-1 text-[13px] text-[#007AFF] leading-snug">
              Your name and avatar are shown to the biker for ID. Your contact
              info is never shared publicly.
            </Text>
          </View>
        </KeyboardAwareScrollView>

        <View className="px-6 pb-2 pt-4 bg-white border-t border-[#F2F2F7]/50">
          <TouchableOpacity
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center ${name.length > 2 && phone.replace(/\D/g, "").length >= 7 && !isLoading ? "bg-[#007AFF]" : "bg-[#007AFF]/50"}`}
            disabled={name.length <= 2 || phone.replace(/\D/g, "").length < 7 || isLoading}
          >
            <Text className="text-white text-[17px] font-extrabold">
              {isLoading ? "Saving..." : "Save Profile"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
                    className={`w-[22%] aspect-square items-center justify-center rounded-2xl mb-3 ${profileEmoji === emoji ? "bg-[#EEF4FF] border-2 border-[#007AFF]" : "bg-[#F2F2F7]"}`}
                  >
                    <Text className="text-[32px]">{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Country Modal */}
      <Modal
        visible={isCountryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] max-h-[70%] min-h-[50%] px-6 pt-4 pb-8">
            <View className="flex-row items-center justify-between mb-4 border-b border-[#F2F2F7] pb-4">
              <Text className="text-[20px] font-black text-[#1C1C1E]">
                Select Country
              </Text>
              <TouchableOpacity
                onPress={() => setIsCountryModalVisible(false)}
                className="w-8 h-8 bg-[#F2F2F7] rounded-full items-center justify-center"
              >
                <X size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setSelectedCountry(item);
                    setIsCountryModalVisible(false);
                    setEmergencyContact("");
                  }}
                  className="flex-row items-center justify-between py-4 border-b border-[#F2F2F7]"
                >
                  <View className="flex-row items-center">
                    <Text className="text-[24px] mr-3">{item.flag}</Text>
                    <Text className="text-[17px] font-semibold text-[#1C1C1E]">
                      {item.name}
                    </Text>
                  </View>
                  <Text className="text-[15px] font-bold text-[#8E8E93]">
                    {item.dialCode}
                  </Text>
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

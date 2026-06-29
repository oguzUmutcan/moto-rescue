import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Info, Smile, X } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COUNTRIES } from "../../constants/countries";

// --- FIREBASE IMPORTS ---
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebase";

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
  const [emergencyContact, setEmergencyContact] = useState("");
  const [profileEmoji, setProfileEmoji] = useState("🙋"); // Default Emoji

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

        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) setName(data.name);
          if (data.email) setEmail(data.email);
          if (data.profileEmoji) setProfileEmoji(data.profileEmoji);
          if (data.emergencyContact) {
            const match = COUNTRIES.find((c) =>
              data.emergencyContact.startsWith(c.dialCode),
            );
            if (match) {
              setSelectedCountry(match);
              setEmergencyContact(
                data.emergencyContact.slice(match.dialCode.length),
              );
            } else {
              setEmergencyContact(data.emergencyContact);
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

      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        emergencyContact: fullEmergencyContact,
        profileEmoji: profileEmoji, // Save the emoji string directly!
      });

      console.log("✅ Passenger Profile saved in Firestore!");
      router.push("/(passenger)/(tabs)/dashboard");
    } catch (error: any) {
      console.error("Error saving profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
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
            <ArrowLeft size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-[17px] font-extrabold text-[#1C1C1E]">
            Passenger Profile
          </Text>
          <View className="w-12" />
        </View>

        <ScrollView
          className="flex-1 px-6 pt-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Emoji Avatar Selector */}
          <View className="items-center mb-8">
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
              Choose Avatar
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
              editable={!isLoading}
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
              editable={!isLoading}
            />
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
        </ScrollView>

        <View className="px-6 pb-2 pt-4 bg-white border-t border-[#F2F2F7]/50">
          <TouchableOpacity
            onPress={handleSaveProfile}
            activeOpacity={0.8}
            className={`w-full h-14 rounded-2xl items-center justify-center ${name.length > 2 && !isLoading ? "bg-[#007AFF]" : "bg-[#007AFF]/50"}`}
            disabled={name.length <= 2 || isLoading}
          >
            <Text className="text-white text-[17px] font-extrabold">
              {isLoading ? "Saving..." : "Save Profile"}
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

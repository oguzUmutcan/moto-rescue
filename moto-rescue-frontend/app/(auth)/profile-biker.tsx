import { useRouter } from "expo-router";
import {
  ArrowLeft,
  ShieldCheck,
  Smile,
  UploadCloud,
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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

// --- FIREBASE IMPORTS ---
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "../../config/firebase";

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
  const [profileEmoji, setProfileEmoji] = useState("🦸"); // Default Biker Emoji

  const [isEmojiModalVisible, setIsEmojiModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isFormValid =
    name.length > 2 && plateNumber.length > 5 && hasUploadedID;

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        setName(auth.currentUser.displayName || "");

        const userDoc = await getDoc(doc(db, "users", auth.currentUser.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.name) setName(data.name);
          if (data.plateNumber) setPlateNumber(data.plateNumber);
          if (data.bio) setBio(data.bio);
          if (data.motorcycleModel) setMotorcycleModel(data.motorcycleModel);
          if (data.motorcycleColor) setMotorcycleColor(data.motorcycleColor);
          if (data.availableDays) setAvailableDays(data.availableDays);
          if (data.identityDocumentStatus === "pending" || data.identityDocumentStatus === "verified") {
            setHasUploadedID(true);
          }
          if (data.profileEmoji) setProfileEmoji(data.profileEmoji);
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
      const userRef = doc(db, "users", auth.currentUser.uid);
      await updateDoc(userRef, {
        name: name.trim(),
        plateNumber: plateNumber.trim().toUpperCase(),
        bio: bio.trim(),
        motorcycleModel: motorcycleModel.trim(),
        motorcycleColor: motorcycleColor.trim(),
        availableDays: availableDays,
        profileEmoji: profileEmoji, // Save Emoji String
      });

      console.log("✅ Biker Profile saved in Firestore!");
      router.push("/(biker)/(tabs)/dashboard");
    } catch (error: any) {
      console.error("Error saving biker profile:", error);
      Alert.alert("Error", "Failed to save profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDocumentUpload = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Permission required", "Photo access is required to upload your license.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled) return;

    setIsLoading(true);
    try {
      const asset = result.assets[0];
      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const extension = asset.fileName?.split(".").pop() || "jpg";
      const documentRef = ref(storage, `identityDocuments/${user.uid}/license.${extension}`);
      await uploadBytes(documentRef, blob, { contentType: asset.mimeType || "image/jpeg" });
      const documentUrl = await getDownloadURL(documentRef);
      await updateDoc(doc(db, "users", user.uid), {
        identityDocumentUrl: documentUrl,
        identityDocumentStatus: "pending",
      });
      setHasUploadedID(true);
    } catch (error) {
      console.error("Document upload failed", error);
      Alert.alert("Upload failed", "The document could not be uploaded. Please try again.");
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
          {/* Emoji Avatar Selector */}
          <View className="items-center mb-8">
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
              Choose Avatar
            </Text>
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
          <TouchableOpacity
            onPress={handleDocumentUpload}
            activeOpacity={0.8}
            disabled={isLoading}
            className={`w-full border-2 border-dashed rounded-[14px] p-5 mb-8 flex-row items-center transition-colors ${
              hasUploadedID
                ? "border-[#34C759] bg-[#EDFAF3]"
                : "border-[#C7C7CC] bg-[#FAFAFA]"
            }`}
          >
            <View
              className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${hasUploadedID ? "bg-[#34C759]" : "bg-[#F2F2F7]"}`}
            >
              {hasUploadedID ? (
                <ShieldCheck size={20} color="white" />
              ) : (
                <UploadCloud size={20} color="#8E8E93" />
              )}
            </View>
            <View className="flex-1">
              <Text
                className={`text-[15px] font-bold mb-0.5 ${hasUploadedID ? "text-[#34C759]" : "text-[#1C1C1E]"}`}
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

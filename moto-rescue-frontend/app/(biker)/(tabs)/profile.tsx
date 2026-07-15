import { useRouter } from "expo-router";
import { ChevronRight, Star } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- FIREBASE IMPORTS ---
import { signOut } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { userApi } from "../../../api/users";
import ProfilePhoto from "../../../components/profile-photo";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function BikerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [available, setAvailable] = useState([
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ]);
  const [notifs, setNotifs] = useState(true);

  // State for user data fetched from Firestore
  const [name, setName] = useState("Loading...");
  const [plateNumber, setPlateNumber] = useState("Loading...");
  const [bio, setBio] = useState("Loading...");
  const [profileEmoji, setProfileEmoji] = useState("🦸"); // Default Biker Emoji
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const data = await userApi.get();
          if (data) {
            setName(data.name || auth.currentUser.displayName || "Biker");
            setPlateNumber(data.plateNumber || "Not provided");
            setBio(data.bio || "No bio available");
            setProfileEmoji(data.profileEmoji || "⛔");
            setProfilePhotoPath(data.profilePhotoPath);
            setAvailable(
              data.availableDays || [
                false,
                false,
                false,
                false,
                false,
                false,
                false,
              ],
            );
          }
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleDeleteAccount = async () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: deleteAccount },
      ],
    );
  };

  const deleteAccount = async () => {
    if (!auth.currentUser) return;

    try {
      await userApi.delete();
      await signOut(auth);
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Error deleting account:", error);
      Alert.alert("Error", "Failed to delete account. Please try again.");
    }
  };

  const toggleDay = async (index: number) => {
    if (!auth.currentUser) return;

    // 1. Calculate the new array
    const newAvailableDays = available.map((val, i) =>
      i === index ? !val : val,
    );

    // 2. Optimistic Update: Instantly change local state so the button feels snappy
    setAvailable(newAvailableDays);

    // 3. Update Firestore in the background
    try {
      await userApi.update({ availableDays: newAvailableDays });
    } catch (error) {
      console.error("Error updating available days:", error);
      // Revert the UI back if the network request fails
      setAvailable(available);
    }
  };

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Dark Header */}
      <View className="bg-[#071510] shadow-md z-10 pt-12 pb-5">
        <View style={{ paddingTop: insets.top }}>
          <View className="px-5">
            <View className="flex-row items-start justify-between mb-4">
              <View className="flex-row items-center gap-3.5">
                <View className="relative">
                  <View className="rounded-full border-[3px] border-[#34C759]">
                    <ProfilePhoto fallbackEmoji={profileEmoji} storagePath={profilePhotoPath} onStoragePathChange={setProfilePhotoPath} dark />
                  </View>
                  <View className="absolute bottom-[-2px] right-[-2px] bg-[#34C759] rounded-full px-1.5 py-0.5 border-2 border-[#071510]">
                    <Text className="text-[9px] font-black text-white">
                      ✓ VERIFIED
                    </Text>
                  </View>
                </View>
                <View>
                  <Text className="text-[20px] font-black text-white tracking-tight">
                    {name}
                  </Text>
                  <View className="flex-row items-center mt-1 mb-0.5">
                    <Star size={12} color="#FF9500" fill="#FF9500" />
                    <Text className="text-[13px] text-white/70 font-semibold ml-1">
                      4.9 · Silver Rescuer 🥈
                    </Text>
                  </View>
                  <Text className="text-[12px] text-white/45">
                    Member since October 2023
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/profile-biker")}
                className="bg-white/10 rounded-xl px-3 py-1.5"
              >
                <Text className="text-[13px] font-bold text-white/60">
                  Edit
                </Text>
              </TouchableOpacity>
            </View>

            {/* Quick Stats */}
            <View className="flex-row gap-2.5">
              {[
                { v: "127", l: "Rescues", c: "text-[#34C759]" },
                { v: "4.9", l: "Rating", c: "text-[#FF9500]" },
                { v: "1,840", l: "km", c: "text-[#007AFF]" },
              ].map(({ v, l, c }) => (
                <View
                  key={l}
                  className="flex-1 bg-white/5 border border-white/5 rounded-2xl py-2.5 items-center"
                >
                  <Text
                    className={`text-[20px] font-black tracking-tight ${c}`}
                  >
                    {v}
                  </Text>
                  <Text className="text-[11px] text-white/45">{l}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Bio */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest mb-2">
            Bio
          </Text>
          <Text className="text-[14px] text-[#3C3C43] leading-relaxed">
            {bio}
          </Text>
        </View>

        {/* Motorcycle Info */}
        <View className="bg-white rounded-2xl mb-3 shadow-sm overflow-hidden">
          <Text className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest px-4 pt-3 pb-1.5">
            Motorcycle
          </Text>
          {[
            { e: "🏍", label: "Model", val: "Yamaha YBR 125" },
            { e: "🔢", label: "Plate", val: plateNumber },
            { e: "🎨", label: "Colour", val: "Dark Blue" },
          ].map(({ e, label, val }, i) => (
            <View
              key={i}
              className={`flex-row items-center px-4 py-2.5 gap-3 ${i > 0 ? "border-t border-[#F2F2F7]" : ""}`}
            >
              <Text className="text-[18px]">{e}</Text>
              <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
                {label}
              </Text>
              <Text className="text-[14px] text-[#8E8E93]">{val}</Text>
            </View>
          ))}
        </View>

        {/* Availability */}
        <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
          <Text className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest mb-3">
            Available Days
          </Text>
          <View className="flex-row justify-between">
            {DAYS.map((d, i) => (
              <TouchableOpacity
                key={d}
                onPress={() => toggleDay(i)}
                activeOpacity={0.7}
                className={`w-[38px] h-[38px] rounded-xl items-center justify-center ${
                  available[i] ? "bg-[#34C759]" : "bg-[#F2F2F7]"
                }`}
              >
                <Text
                  className={`text-[10px] font-black ${available[i] ? "text-white" : "text-[#AEAEB2]"}`}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Preferences */}
        <View className="bg-white rounded-2xl mb-5 shadow-sm overflow-hidden">
          <Text className="text-[12px] font-bold text-[#8E8E93] uppercase tracking-widest px-4 pt-3 pb-1.5">
            Preferences
          </Text>
          <View className="flex-row items-center px-4 py-2.5 gap-3 border-b border-[#F2F2F7]">
            <Text className="text-[18px]">🔔</Text>
            <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
              Request notifications
            </Text>
            <Switch
              value={notifs}
              onValueChange={setNotifs}
              trackColor={{ false: "#D1D1D6", true: "#34C759" }}
              thumbColor={
                Platform.OS === "ios"
                  ? "#FFFFFF"
                  : notifs
                    ? "#FFFFFF"
                    : "#F4F3F4"
              }
              ios_backgroundColor="#D1D1D6"
            />
          </View>
          <View className="flex-row items-center px-4 py-3 gap-3 border-b border-[#F2F2F7]">
            <Text className="text-[18px]">🆔</Text>
            <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
              Identity Document
            </Text>
            <Text className="text-[13px] font-bold text-[#34C759]">
              Verified ✓
            </Text>
          </View>
          <TouchableOpacity className="flex-row items-center px-4 py-3 gap-3">
            <Text className="text-[18px]">❓</Text>
            <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
              Help & Support
            </Text>
            <ChevronRight size={14} color="#C7C7CC" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={handleSignOut}
          className="w-full h-[50px] rounded-2xl bg-white border border-[#FFDDDD] items-center justify-center shadow-sm mb-4"
        >
          <Text className="text-[#FF3B30] text-[15px] font-bold">Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          className="w-full h-[50px] rounded-2xl bg-white border border-[#FFDDDD] items-center justify-center shadow-sm mb-4"
        >
          <Text className="text-[#FF3B30] text-[15px] font-bold">
            ⚠️ Delete Account ⚠️
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

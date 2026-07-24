// Note: This code is strictly for the Expo React Native environment.
// Web preview errors for 'expo-router', 'lucide-react-native', 'react-native', etc., are expected and can be ignored.
import { useRouter } from "expo-router";
import { Check, ChevronRight } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- FIREBASE IMPORTS ---
import { signOut } from "firebase/auth";
import { auth } from "../../../config/firebase";
import { userApi } from "../../../api/users";
import ProfilePhoto from "../../../components/profile-photo";
import { rescueApi } from "../../../api/rescues";
import { registerPushNotifications, unregisterPushNotifications } from "../../../utils/push-notifications";
import LanguageSelector from "../../../components/language-selector";
import { formatDate } from "../../../localization/i18n";
import LegalModal, { LegalModalType } from "../../../components/legal-modals";

export default function PassengerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifs, setNotifs] = useState(true);
  const [nearby, setNearby] = useState(true);
  const [legalModalType, setLegalModalType] = useState<LegalModalType>(null);

  // State for user data
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Loading...");
  const [emergencyContact, setEmergencyContact] = useState("Not set");
  const [profileEmoji, setProfileEmoji] = useState("⛔"); // Default Passenger Emoji
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null);
  const [totalRequests, setTotalRequests] = useState(0);
  const [completedRescues, setCompletedRescues] = useState(0);
  const [memberSince, setMemberSince] = useState("Unknown");

  // Fetch User Data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const data = await userApi.get();
          if (data) {
            setName(data.name || auth.currentUser.displayName || "Passenger");
            setEmail(data.email || auth.currentUser.email || "");
            setPhone(data.phone || "");
            setEmergencyContact(data.emergencyContact || "Not set");
            setNotifs(data.notificationsEnabled);
            setProfileEmoji(data.profileEmoji || "⛔");
            setProfilePhotoPath(data.profilePhotoPath);
            setMemberSince(data.createdAt ? formatDate(data.createdAt, { month: "short", year: "numeric" }) : "Unknown");
          }
          const history = await rescueApi.history();
          setTotalRequests(history.length);
          setCompletedRescues(history.filter((ride) => ride.status === "completed").length);
        } catch (error) {
          console.error("Error fetching profile data:", error);
        }
      }
    };

    fetchUserData();
  }, []);

  // Handle Firebase Sign Out
  const handleSignOut = async () => {
    try {
      await unregisterPushNotifications().catch((error) => console.warn("Could not clear push token", error));
      await signOut(auth);
      // Route back to the login screen, clearing the navigation stack
      router.replace("/(auth)/login");
    } catch (error: any) {
      console.error("Sign out error:", error);
      Alert.alert("Error", "Failed to sign out. Please try again.");
    }
  };

  const handleNotificationsChange = async (enabled: boolean) => {
    const previous = notifs;
    setNotifs(enabled);
    try {
      await userApi.update({ notificationsEnabled: enabled });
      if (enabled) {
        await registerPushNotifications();
      } else {
        await unregisterPushNotifications();
      }
    } catch (error) {
      setNotifs(previous);
      Alert.alert("Could not update notifications", error instanceof Error ? error.message : "Please try again.");
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

  return (
    <View className="flex-1 bg-[#F2F2F7]">
      {/* Header - Edge to Edge Background */}
      <View
        className="bg-white shadow-sm z-10 pb-4"
        style={{ paddingTop: insets.top }}
      >
        <View className="flex-row items-center justify-between px-5 pt-4">
          <Text className="text-[24px] font-black text-[#1C1C1E] tracking-tight">
            Profile
          </Text>
          <TouchableOpacity
            onPress={() => router.navigate("/(auth)/profile-passenger")}
          >
            <Text className="text-[14px] font-bold text-[#007AFF]">Edit</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      >
        {/* Identity Card */}
        <View className="bg-white rounded-[20px] p-5 mb-4 shadow-sm">
          <View className="flex-row items-center gap-3.5 mb-4">
            <View className="relative">
              <ProfilePhoto fallbackEmoji={profileEmoji} storagePath={profilePhotoPath} onStoragePathChange={setProfilePhotoPath} />
              <View className="absolute bottom-0 right-0 w-[18px] h-[18px] rounded-full bg-[#34C759] border-[2px] border-white items-center justify-center">
                <Check size={9} color="white" strokeWidth={3} />
              </View>
            </View>
            <View className="flex-1">
              <Text className="text-[20px] font-black text-[#1C1C1E] tracking-tight">
                {name}
              </Text>
              <Text className="text-[13px] text-[#8E8E93] mt-0.5">
                Community Member
              </Text>
              <Text className="text-[13px] text-[#8E8E93]">{phone}</Text>
            </View>
          </View>

          {/* Stats */}
          <View className="flex-row border-t border-[#F2F2F7] pt-3.5">
            {[
              { v: String(completedRescues), l: "Completed", c: "text-[#007AFF]" },
              { v: String(totalRequests), l: "Requests", c: "text-[#34C759]" },
              { v: memberSince, l: "Member Since", c: "text-[#8E8E93]" },
            ].map(({ v, l, c }, i, arr) => (
              <View
                key={l}
                className={`flex-1 items-center ${i < arr.length - 1 ? "border-r border-[#F2F2F7]" : ""}`}
              >
                <Text className={`text-[22px] font-black tracking-tight ${c}`}>
                  {v}
                </Text>
                <Text className="text-[11px] text-[#8E8E93]">{l}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Personal Info */}
        <View className="bg-white rounded-2xl mb-3 shadow-sm overflow-hidden">
          <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest px-4 pt-3 pb-1.5">
            Personal Info
          </Text>
          {[
            { e: "👤", label: "Full Name", val: name },
            { e: "📧", label: "Email", val: email },
            { e: "🆘", label: "Emergency Contact", val: emergencyContact },
          ].map(({ e, label, val }, i) => (
            <View
              key={i}
              className={`flex-row items-center px-4 py-3 gap-3 ${i > 0 ? "border-t border-[#F2F2F7]" : ""}`}
            >
              <Text className="text-[18px]">{e}</Text>
              <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
                {label}
              </Text>
              <Text className="text-[14px] text-[#8E8E93]">{val}</Text>
            </View>
          ))}
        </View>

        {/* Notifications */}
        <View className="bg-white rounded-2xl mb-3 shadow-sm overflow-hidden">
          <Text className="text-[13px] font-bold text-[#8E8E93] uppercase tracking-widest px-4 pt-3 pb-1.5">
            Notifications
          </Text>
          {[
            {
              e: "🔔",
              label: "Push notifications",
              val: notifs,
              set: handleNotificationsChange,
            },
            {
              e: "📍",
              label: "Show bikers nearby",
              val: nearby,
              set: setNearby,
            },
          ].map(({ e, label, val, set }, i) => (
            <View
              key={i}
              className={`flex-row items-center px-4 py-2.5 gap-3 ${i > 0 ? "border-t border-[#F2F2F7]" : ""}`}
            >
              <Text className="text-[18px]">{e}</Text>
              <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
                {label}
              </Text>
              <Switch
                value={val}
                onValueChange={set}
                trackColor={{ false: "#D1D1D6", true: "#34C759" }}
                thumbColor={
                  Platform.OS === "ios"
                    ? "#FFFFFF"
                    : val
                      ? "#FFFFFF"
                      : "#F4F3F4"
                }
                ios_backgroundColor="#D1D1D6"
              />
            </View>
          ))}
        </View>

        {/* More */}
        <View className="bg-white rounded-2xl mb-5 shadow-sm overflow-hidden">
          {[
            { e: "❓", label: "Help & Support", key: "help" as const },
            { e: "📄", label: "Terms of Service", key: "terms" as const },
            { e: "🔒", label: "Privacy Policy", key: "privacy" as const },
          ].map(({ e, label, key }, i) => (
            <TouchableOpacity
              key={key}
              onPress={() => setLegalModalType(key)}
              className={`flex-row items-center px-4 py-3.5 gap-3 ${i > 0 ? "border-t border-[#F2F2F7]" : ""}`}
            >
              <Text className="text-[18px]">{e}</Text>
              <Text className="flex-1 text-[15px] text-[#1C1C1E] font-medium">
                {label}
              </Text>
              <ChevronRight size={14} color="#C7C7CC" />
            </TouchableOpacity>
          ))}
        </View>

        <LegalModal type={legalModalType} onClose={() => setLegalModalType(null)} />

        <View className="mb-3">
          <LanguageSelector />
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={handleSignOut}
          activeOpacity={0.7}
          className="w-full h-[50px] rounded-2xl bg-white border border-[#FFDDDD] items-center justify-center shadow-sm mb-4"
        >
          <Text className="text-[#FF3B30] text-[15px] font-bold">Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={handleDeleteAccount}
          activeOpacity={0.7}
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

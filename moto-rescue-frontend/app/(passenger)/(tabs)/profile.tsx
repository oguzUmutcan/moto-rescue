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
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- FIREBASE IMPORTS ---
import { deleteUser, signOut } from "firebase/auth";
import { deleteDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";

export default function PassengerProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [notifs, setNotifs] = useState(true);
  const [nearby, setNearby] = useState(true);

  // State for user data
  const [name, setName] = useState("Loading...");
  const [email, setEmail] = useState("Loading...");
  const [phone, setPhone] = useState("Loading...");
  const [emergencyContact, setEmergencyContact] = useState("Not set");
  const [profileEmoji, setProfileEmoji] = useState("⛔"); // Default Passenger Emoji

  // Fetch User Data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (auth.currentUser) {
        try {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setName(data.name || auth.currentUser.displayName || "Passenger");
            setEmail(data.email || auth.currentUser.email || "");
            setPhone(data.phone || "");
            setEmergencyContact(data.emergencyContact || "Not set");
            setProfileEmoji(data.profileEmoji || "⛔");
          }
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
      await signOut(auth);
      // Route back to the login screen, clearing the navigation stack
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
      // Delete user document from Firestore
      const userDocRef = doc(db, "users", auth.currentUser.uid);
      await deleteDoc(userDocRef);

      // Delete user from Firebase Authentication
      await deleteUser(auth.currentUser);

      // Sign out the user
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
            onPress={() => router.push("/(auth)/profile-passenger")}
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
              <View className="w-[72px] h-[72px] rounded-full bg-[#EEF4FF] items-center justify-center">
                <Text className="text-[32px]">{profileEmoji}</Text>
              </View>
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
              { v: "6", l: "Rescues", c: "text-[#007AFF]" },
              { v: "4.8", l: "Avg Rating", c: "text-[#FF9500]" },
              { v: "2h", l: "Time Saved", c: "text-[#34C759]" },
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
              set: setNotifs,
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
            { e: "❓", label: "Help & Support" },
            { e: "📄", label: "Terms of Service" },
            { e: "🔒", label: "Privacy Policy" },
          ].map(({ e, label }, i) => (
            <TouchableOpacity
              key={i}
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

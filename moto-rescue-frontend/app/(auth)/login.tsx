import { useRouter } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import React, { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// --- CENTRAL FIREBASE IMPORTS ---
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "../../config/firebase";
import { userApi } from "../../api/users";
import { profileRoute } from "../../utils/app-routing";

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Modal specific state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert(
        "Missing Fields",
        "Please enter both your email and password.",
      );
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      Alert.alert("Invalid Email", "Enter a complete email address such as biker@example.com.");
      return;
    }

    Keyboard.dismiss();
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(
        auth,
        normalizedEmail,
        password,
      );
      const userData = await userApi.get();

      router.replace(userData ? profileRoute(userData) : "/(auth)/profile-select");
    } catch (error: any) {
      let friendlyError = "An error occurred during login.";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        friendlyError = "No account matches this email and password. Check the biker account credentials or reset its password.";
      } else if (error.code === "auth/invalid-email") {
        friendlyError = "Please enter a valid email address.";
      } else if (error instanceof Error) {
        friendlyError = error.message;
      }

      Alert.alert("Login Failed", friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEmail = async () => {
    if (!resetEmail.trim()) return;

    Keyboard.dismiss();

    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setShowForgotModal(false);
      setResetEmail(""); // clear the input

      setTimeout(() => {
        Alert.alert(
          "Reset Link Sent",
          "If an account exists for that email, we've sent instructions to reset your password.",
        );
      }, 500); // Slight delay so the modal closes smoothly before the alert pops up
    } catch (error: any) {
      console.error("Password Reset Error:", error);
      let friendlyError = "Could not send password reset email.";
      if (error.code === "auth/invalid-email")
        friendlyError = "Please enter a valid email address.";

      Alert.alert("Error", friendlyError);
    }
  };

  return (
    <View
      className="flex-1 bg-white"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 24,
      }}
    >
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="px-6 pt-4 mb-6">
          <TouchableOpacity
            onPress={() => router.back()}
            className="p-2 -ml-2 w-12"
            disabled={isLoading}
          >
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6 justify-center">
          <View className="mb-10">
            <Text className="text-[32px] font-black text-[#1C1C1E] mb-2">
              Welcome Back
            </Text>
            <Text className="text-[16px] text-[#8E8E93]">
              Sign in to continue your journey.
            </Text>
          </View>

          <View className="space-y-4 mb-8">
            <View className="flex-row items-center bg-[#F2F2F7] rounded-2xl px-4 h-14">
              <Mail size={20} color="#8E8E93" />
              <TextInput
                placeholder="Email Address"
                value={email}
                onChangeText={setEmail}
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E]"
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>
            <View style={{ height: 16 }} />
            <View className="flex-row items-center bg-[#F2F2F7] rounded-2xl px-4 h-14">
              <Lock size={20} color="#8E8E93" />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E]"
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} color="#8E8E93" />
                ) : (
                  <Eye size={20} color="#8E8E93" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            activeOpacity={0.8}
            disabled={isLoading}
            className={`w-full h-14 rounded-2xl items-center justify-center shadow-sm ${
              isLoading ? "bg-[#007AFF]/60" : "bg-[#007AFF]"
            }`}
          >
            <Text className="text-[17px] font-extrabold text-white">
              {isLoading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mt-6 items-center p-2"
            onPress={() => setShowForgotModal(true)}
            disabled={isLoading}
          >
            <Text className="text-[#007AFF] font-semibold text-[15px]">
              Forgot Password?
            </Text>
          </TouchableOpacity>

          <View className="flex-row justify-center mt-auto mb-4 pt-6">
            <Text className="text-[#8E8E93] text-[15px]">
              Don&apos;t have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.navigate("/(auth)/register")}>
              <Text className="text-[#007AFF] text-[15px] font-bold">
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {}
      <Modal
        visible={showForgotModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowForgotModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1 justify-center items-center bg-black/50 px-6"
        >
          <View className="bg-white w-full max-w-[400px] rounded-[24px] p-6 shadow-xl">
            <Text className="text-[20px] font-black text-[#1C1C1E] mb-2 text-center">
              Reset Password
            </Text>
            <Text className="text-[14px] text-[#8E8E93] text-center mb-6 leading-relaxed">
              Enter your registered email address to receive a password reset
              link.
            </Text>

            <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-4 h-14 mb-6">
              <Mail size={20} color="#8E8E93" />
              <TextInput
                className="flex-1 ml-3 text-[16px] text-[#1C1C1E]"
                placeholder="email@example.com"
                placeholderTextColor="#C7C7CC"
                keyboardType="email-address"
                autoCapitalize="none"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoFocus={true}
              />
            </View>

            <View className="flex-row justify-between gap-3">
              <TouchableOpacity
                onPress={() => {
                  setShowForgotModal(false);
                  setResetEmail("");
                }}
                activeOpacity={0.7}
                className="flex-1 h-12 bg-[#F2F2F7] rounded-xl items-center justify-center"
              >
                <Text className="text-[#8E8E93] text-[16px] font-bold">
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSubmitEmail}
                activeOpacity={0.8}
                disabled={!resetEmail.trim()}
                className={`flex-1 h-12 rounded-xl items-center justify-center ${
                  resetEmail.trim() ? "bg-[#007AFF]" : "bg-[#007AFF]/50"
                }`}
              >
                <Text className="text-white text-[16px] font-bold">
                  Send Link
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

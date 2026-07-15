import nativeAuth, { FirebaseAuthTypes } from "@react-native-firebase/auth";
import { useRouter } from "expo-router";
import { ArrowLeft, Edit2, Phone, User } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getIdToken, signInWithEmailAndPassword, updateProfile } from "firebase/auth";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { userApi } from "../../api/users";
import { auth } from "../../config/firebase";
import { useRegistration } from "../../contexts/registration";

export default function ConfirmPhoneScreen() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [confirmation, setConfirmation] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
  const [code, setCode] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const isCompletingRegistration = useRef(false);
  const { draft, clearDraft } = useRegistration();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!draft && !isCompletingRegistration.current) router.replace("/(auth)/register");
  }, [draft, router]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = setInterval(() => setResendSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendSeconds]);

  if (!draft) return null;
  const { phone, dialCode, name, email, password } = draft;
  const fullPhoneNumber = `${dialCode}${phone}`;

  const sendCode = async () => {
    if (isLoading || resendSeconds > 0) return;
    setIsLoading(true);
    try {
      await nativeAuth().signOut();
      const result = await nativeAuth().signInWithPhoneNumber(fullPhoneNumber, confirmation !== null);
      setConfirmation(result);
      setCode("");
      setResendSeconds(60);
      Alert.alert("Code sent", `Enter the 6-digit code sent to ${fullPhoneNumber}.`);
    } catch (error) {
      Alert.alert("Could not send code", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const verifyAndCreateAccount = async () => {
    if (!confirmation || code.length !== 6 || isLoading) return;
    setIsLoading(true);
    let phoneUser: FirebaseAuthTypes.User | null = null;
    let emailLinked = false;
    try {
      const phoneCredential = await confirmation.confirm(code);
      if (!phoneCredential) throw new Error("Phone verification did not complete.");
      phoneUser = phoneCredential.user;
      const emailCredential = nativeAuth.EmailAuthProvider.credential(email, password);
      await phoneUser.linkWithCredential(emailCredential);
      emailLinked = true;
      await nativeAuth().signOut();

      const webCredential = await signInWithEmailAndPassword(auth, email, password);
      await updateProfile(webCredential.user, { displayName: name.trim() });
      await getIdToken(webCredential.user, true);
      await userApi.create({ name: name.trim(), phone: fullPhoneNumber });

      isCompletingRegistration.current = true;
      clearDraft();
      router.replace("/(auth)/profile-select");
    } catch (error) {
      if (phoneUser && !emailLinked) await phoneUser.delete().catch(() => undefined);
      Alert.alert("Verification failed", error instanceof Error ? error.message : "Check the code and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-white">
      <View className="flex-1 bg-white" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
        <StatusBar barStyle="dark-content" />
        <View className="px-6 pt-4 mb-6">
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2 w-12" disabled={isLoading}>
            <ArrowLeft size={24} color="#1C1C1E" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 px-6">
          <Text className="text-[32px] font-black text-[#1C1C1E] mb-2">
            {confirmation ? "Verify Phone" : "Confirm Details"}
          </Text>
          <Text className="text-[16px] text-[#8E8E93] mb-8">
            {confirmation ? "Enter the SMS code to securely create your account." : "We will send an SMS code before creating your account."}
          </Text>

          <View className="bg-[#F2F2F7] rounded-3xl p-6 mb-8">
            <View className="flex-row items-center mb-6">
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4"><User size={24} color="#007AFF" /></View>
              <View><Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">Name</Text><Text className="text-[17px] font-semibold text-[#1C1C1E]">{name}</Text></View>
            </View>
            <View className="h-[1px] bg-[#E5E5EA] mb-6" />
            <View className="flex-row items-center">
              <View className="w-12 h-12 bg-white rounded-full items-center justify-center mr-4"><Phone size={24} color="#007AFF" /></View>
              <View className="flex-1"><Text className="text-[13px] text-[#8E8E93] uppercase font-bold tracking-wider">Phone Number</Text><Text className="text-[17px] font-semibold text-[#1C1C1E]">{dialCode} {phone}</Text></View>
              {!confirmation && <TouchableOpacity onPress={() => router.back()} className="p-2" disabled={isLoading}><Edit2 size={20} color="#007AFF" /></TouchableOpacity>}
            </View>
          </View>

          {confirmation && (
            <TextInput
              value={code}
              onChangeText={(value) => setCode(value.replace(/\D/g, "").slice(0, 6))}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
              textContentType="oneTimeCode"
              placeholder="000000"
              className="h-16 rounded-2xl bg-[#F2F2F7] text-center text-[28px] font-black tracking-[10px] text-[#1C1C1E] mb-4"
            />
          )}

          <TouchableOpacity
            onPress={() => void (confirmation ? verifyAndCreateAccount() : sendCode())}
            disabled={isLoading || (confirmation !== null && code.length !== 6)}
            className={`w-full h-14 rounded-2xl items-center justify-center ${isLoading || (confirmation !== null && code.length !== 6) ? "bg-[#007AFF]/50" : "bg-[#007AFF]"}`}
          >
            <Text className="text-[17px] font-extrabold text-white">{isLoading ? "Please wait..." : confirmation ? "Verify & Create Account" : "Send Verification Code"}</Text>
          </TouchableOpacity>

          {confirmation && (
            <TouchableOpacity onPress={() => void sendCode()} disabled={isLoading || resendSeconds > 0} className="py-4">
              <Text className={`text-center font-bold ${resendSeconds > 0 ? "text-[#AEAEB2]" : "text-[#007AFF]"}`}>
                {resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend code"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

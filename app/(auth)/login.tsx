import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
// Make sure to import these native icons!
import { ChevronDown, X } from "lucide-react-native";
import { COUNTRIES } from "../../constants/countries"; // Import the countries data

COUNTRIES.sort((a, b) => a.name.localeCompare(b.name)); // Sort countries alphabetically

export default function LoginScreen() {
  const [phone, setPhone] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  // 2. Add state for the country picker
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Defaults to Turkey
  const [isModalVisible, setIsModalVisible] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isPhoneValid = phone.length >= selectedCountry.minLength;

  const handleSendCode = () => {
    // Navigate to OTP Screen
    router.push({
      pathname: "/(auth)/otp",
      params: { phone, dialCode: selectedCountry.dialCode },
    });
    // console.log("Send code to:", phone);
  };

  const renderCountryItem = ({ item }: { item: (typeof COUNTRIES)[0] }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        setIsModalVisible(false);
        setPhone(""); // Clear phone when switching countries to prevent length bugs
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
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View
          className="flex-1 bg-white"
          style={{
            paddingTop: insets?.top ? insets.top + 20 : 60,
            paddingBottom: insets?.bottom > 0 ? insets.bottom : 24,
          }}
        >
          {/* Main Content */}
          <View className="flex-1 px-6 pt-4">
            <View className="w-[52px] h-[52px] rounded-2xl bg-[#007AFF] items-center justify-center mb-5">
              <Text className="text-[26px]">🏍</Text>
            </View>

            <Text className="text-[30px] font-black text-[#1C1C1E] tracking-tight mb-1.5">
              Welcome back
            </Text>
            <Text className="text-[15px] text-[#8E8E93] mb-7">
              Enter your number to continue
            </Text>

            <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
              Phone Number
            </Text>

            <View
              className={`flex-row items-center bg-[#F2F2F7] rounded-[14px] h-[52px] border-2 overflow-hidden ${
                isFocused ? "border-[#007AFF]" : "border-transparent"
              }`}
            >
              {/* 3. Make the Country Code Prefix Touchable! */}
              <TouchableOpacity
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.7}
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

              {/* Actual Text Input */}
              <TextInput
                className="flex-1 h-full px-3.5 text-[17px] font-medium text-[#1C1C1E]"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={(val) => {
                  const cleaned = val
                    .replace(/\D/g, "")
                    .slice(0, selectedCountry.maxLength);
                  setPhone(cleaned);
                }}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                maxLength={selectedCountry.maxLength}
              />
            </View>

            <Text className="text-[13px] text-[#8E8E93] leading-relaxed mt-2.5 mb-7">
              We'll send a 6-digit code to confirm your number.
            </Text>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSendCode}
              activeOpacity={0.8}
              disabled={!isPhoneValid}
              className={`w-full h-14 rounded-2xl items-center justify-center ${
                isPhoneValid ? "bg-[#007AFF]" : "bg-[#007AFF]/50"
              }`}
            >
              <Text className="text-white text-[17px] font-extrabold">
                Send Code
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>

      {/* 4. The Country Picker Modal (Bottom Sheet Style) */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        {/* Dark Background Overlay */}
        <View className="flex-1 bg-black/40 justify-end">
          {/* White Bottom Sheet */}
          <View className="bg-white rounded-t-[32px] max-h-[70%] min-h-[50%] px-6 pt-4 pb-8">
            {/* Modal Header */}
            <View className="flex-row items-center justify-between mb-4 border-b border-[#F2F2F7] pb-4">
              <Text className="text-[20px] font-black text-[#1C1C1E]">
                Select Country
              </Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                className="w-8 h-8 bg-[#F2F2F7] rounded-full items-center justify-center"
              >
                <X size={18} color="#8E8E93" />
              </TouchableOpacity>
            </View>

            {/* Country List */}
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.id}
              renderItem={renderCountryItem}
              showsVerticalScrollIndicator={false}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

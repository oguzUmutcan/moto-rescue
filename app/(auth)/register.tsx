// Note: This code is strictly for the Expo React Native environment.
// Please ignore any web preview build errors for missing native dependencies.
import { useRouter } from "expo-router";
import { ArrowLeft, ChevronDown, Eye, EyeOff, X } from "lucide-react-native";
import React, { useState } from "react";
import {
  FlatList,
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

export default function RegisterScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const router = useRouter();
  const insets = useSafeAreaInsets();

  const isFormValid =
    name && email && password && phone.length >= selectedCountry.minLength;

  const pushToVerifyCreds = () => {
    router.push({
      pathname: "/(auth)/verify-creds",
      params: {
        phone,
        dialCode: selectedCountry.dialCode,
        name,
        email,
        password,
      },
    });
  };

  const renderCountryItem = ({ item }: { item: (typeof COUNTRIES)[0] }) => (
    <TouchableOpacity
      onPress={() => {
        setSelectedCountry(item);
        setIsModalVisible(false);
        setPhone("");
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
      <View
        className="px-4 border-b border-[#F2F2F7] z-10 bg-white"
        style={{ paddingTop: insets.top + 10, paddingBottom: 12 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="p-2 w-12">
          <ArrowLeft size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        className="flex-1 px-6 pt-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text className="text-[30px] font-black text-[#1C1C1E] tracking-tight mb-2">
          Create Account
        </Text>
        <Text className="text-[15px] text-[#8E8E93] mb-8">
          Join the MotoRescue community
        </Text>

        <View className="mb-4">
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Full Name
          </Text>
          <TextInput
            className="w-full h-14 bg-[#F2F2F7] rounded-[14px] px-4 text-[16px] text-[#1C1C1E] font-medium"
            placeholder="Type your full name"
            placeholderTextColor="#C7C7CC"
            value={name}
            onChangeText={setName}
          />
        </View>

        <View className="mb-4">
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Email Address
          </Text>
          <TextInput
            className="w-full h-14 bg-[#F2F2F7] rounded-[14px] px-4 text-[16px] text-[#1C1C1E] font-medium"
            placeholder="name@example.com"
            placeholderTextColor="#C7C7CC"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View className="mb-4">
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Password
          </Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] px-4 h-14">
            <TextInput
              className="flex-1 text-[16px] text-[#1C1C1E] font-medium"
              placeholder="Create a strong password"
              placeholderTextColor="#C7C7CC"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
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

        <View className="mb-8">
          <Text className="text-[12px] font-bold text-[#8E8E93] tracking-wider uppercase mb-2">
            Phone Number
          </Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-[14px] h-14 overflow-hidden">
            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              className="flex-row items-center px-3.5 h-full border-r border-black/5 bg-[#E5E5EA]/30"
            >
              <Text className="text-[20px] mr-1.5">{selectedCountry.flag}</Text>
              <Text className="text-[15px] font-bold text-[#1C1C1E] mr-1.5">
                {selectedCountry.dialCode}
              </Text>
              <ChevronDown size={16} color="#8E8E93" />
            </TouchableOpacity>
            <TextInput
              className="flex-1 h-full px-3.5 text-[17px] font-medium text-[#1C1C1E]"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(val) =>
                setPhone(
                  val.replace(/\D/g, "").slice(0, selectedCountry.maxLength),
                )
              }
              maxLength={selectedCountry.maxLength}
            />
          </View>
        </View>

        <TouchableOpacity
          onPress={pushToVerifyCreds}
          disabled={isLoading || !isFormValid}
          activeOpacity={0.8}
          className={`w-full h-14 rounded-2xl items-center justify-center mb-10 ${isFormValid ? "bg-[#007AFF]" : "bg-[#007AFF]/50"}`}
        >
          <Text className="text-white text-[17px] font-extrabold">
            {isLoading ? "Creating..." : "Create Account"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Country Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-[32px] max-h-[70%] min-h-[50%] px-6 pt-4 pb-8">
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

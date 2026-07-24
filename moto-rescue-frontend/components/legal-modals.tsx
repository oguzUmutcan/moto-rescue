import { ExternalLink, HelpCircle, Phone, ShieldCheck, FileText, X } from "lucide-react-native";
import React from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export type LegalModalType = "help" | "terms" | "privacy" | null;

type LegalModalProps = {
  type: LegalModalType;
  onClose: () => void;
};

export default function LegalModal({ type, onClose }: LegalModalProps) {
  if (!type) return null;

  const handleCallEmergency = () => {
    Linking.openURL("tel:112").catch(() => undefined);
  };

  const handleEmailSupport = () => {
    Linking.openURL("mailto:support@motorescue.com?subject=MotoRescue%20Support%20Request").catch(() => undefined);
  };

  return (
    <Modal
      visible={Boolean(type)}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl max-h-[85%] overflow-hidden">
          {/* Header */}
          <View className="flex-row items-center justify-between px-5 py-4 border-b border-[#F2F2F7]">
            <View className="flex-row items-center gap-2.5">
              {type === "help" && <HelpCircle size={22} color="#007AFF" />}
              {type === "terms" && <FileText size={22} color="#007AFF" />}
              {type === "privacy" && <ShieldCheck size={22} color="#34C759" />}
              <Text className="text-[18px] font-black text-[#1C1C1E]">
                {type === "help" && "Help & Support"}
                {type === "terms" && "Terms of Service"}
                {type === "privacy" && "Privacy Policy"}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              className="w-8 h-8 rounded-full bg-[#F2F2F7] items-center justify-center"
              accessibilityLabel="Close modal"
            >
              <X size={18} color="#8E8E93" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            className="px-5 py-4"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {type === "help" && (
              <View className="gap-5">
                <View className="bg-[#FFF5F5] border border-[#FFE5E5] rounded-2xl p-4">
                  <Text className="text-[15px] font-bold text-[#FF3B30] mb-1">
                    Emergency Assistance
                  </Text>
                  <Text className="text-[13px] text-[#4A4A4A] mb-3 leading-5">
                    If you or someone else is in immediate physical danger, medical emergency, or accident, contact emergency services immediately.
                  </Text>
                  <TouchableOpacity
                    onPress={handleCallEmergency}
                    className="bg-[#FF3B30] rounded-xl py-3 flex-row items-center justify-center gap-2"
                  >
                    <Phone size={16} color="white" />
                    <Text className="text-white font-black text-[14px]">
                      Call 112 Emergency
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="bg-[#F2F2F7] rounded-2xl p-4">
                  <Text className="text-[15px] font-bold text-[#1C1C1E] mb-2">
                    Frequently Asked Questions
                  </Text>
                  <View className="gap-3">
                    <View>
                      <Text className="text-[13px] font-semibold text-[#1C1C1E]">
                        How does MotoRescue work?
                      </Text>
                      <Text className="text-[12px] text-[#636366] mt-0.5 leading-4">
                        Passengers request assistance when stuck or stranded. Nearby verified motorcycle riders receive alerts and provide fast transport or aid.
                      </Text>
                    </View>
                    <View className="border-t border-[#E5E5EA] pt-2.5">
                      <Text className="text-[13px] font-semibold text-[#1C1C1E]">
                        What if a biker is unavailable?
                      </Text>
                      <Text className="text-[12px] text-[#636366] mt-0.5 leading-4">
                        The system automatically expands the search radius up to 6 km. You can cancel your request at any time without penalty.
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={handleEmailSupport}
                  className="bg-[#007AFF] rounded-2xl py-3.5 px-4 flex-row items-center justify-between"
                >
                  <View>
                    <Text className="text-white font-bold text-[14px]">
                      Contact Support Team
                    </Text>
                    <Text className="text-white/80 text-[12px]">
                      support@motorescue.com
                    </Text>
                  </View>
                  <ExternalLink size={18} color="white" />
                </TouchableOpacity>
              </View>
            )}

            {type === "terms" && (
              <View className="gap-4">
                <Text className="text-[12px] text-[#8E8E93] font-medium">
                  Last updated: July 2026
                </Text>

                <View className="gap-3">
                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    1. Community Platform Service
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    MotoRescue connects passengers in urgent need of transport or roadside guidance with independent motorcycle riders. MotoRescue is a community dispatch network.
                  </Text>

                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    2. Safety Requirements & Helmets
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    All passengers and bikers must wear an approved protective helmet during rides. Bikers must maintain a valid driver&apos;s license and motorcycle registration.
                  </Text>

                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    3. Boarding Code Security
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    Rides begin only when the passenger provides their 4-digit boarding code to the biker upon arrival. Never board a vehicle without verification.
                  </Text>
                </View>
              </View>
            )}

            {type === "privacy" && (
              <View className="gap-4">
                <Text className="text-[12px] text-[#8E8E93] font-medium">
                  Last updated: July 2026
                </Text>

                <View className="gap-3">
                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    1. Location Data Usage
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    MotoRescue collects precise GPS location data during active rescue requests to match passengers with nearby bikers and display live rescue progress.
                  </Text>

                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    2. Data Security & Contact Sharing
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    Your phone number is shared with your assigned biker or passenger strictly during an active rescue for coordination purposes.
                  </Text>

                  <Text className="text-[14px] font-bold text-[#1C1C1E]">
                    3. Account & Data Control
                  </Text>
                  <Text className="text-[13px] text-[#3A3A3C] leading-5">
                    You can request profile deletion or access your stored profile information at any time by contacting privacy@motorescue.com.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

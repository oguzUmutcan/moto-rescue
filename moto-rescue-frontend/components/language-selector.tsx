import { Check, Languages } from "lucide-react-native";
import React from "react";

import { Text, TouchableOpacity, View } from "@/components/localized-native";
import { useLanguage } from "@/localization/language-context";
import { SUPPORTED_LANGUAGES } from "@/localization/i18n";

type LanguageSelectorProps = {
  compact?: boolean;
};

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const { language, setLanguage, t } = useLanguage();

  return (
    <View className={compact ? "" : "bg-white rounded-2xl p-4"}>
      {!compact && (
        <View className="flex-row items-center mb-3">
          <Languages size={18} color="#007AFF" />
          <Text className="text-[15px] font-black text-[#1C1C1E] ml-2">
            {t("Language")}
          </Text>
        </View>
      )}
      <View className="flex-row gap-2">
        {SUPPORTED_LANGUAGES.map((option) => {
          const selected = language === option.code;
          return (
            <TouchableOpacity
              key={option.code}
              onPress={() => void setLanguage(option.code)}
              className={`flex-1 rounded-xl px-3 py-3 flex-row items-center justify-center ${
                selected ? "bg-[#007AFF]" : "bg-[#F2F2F7]"
              }`}
              accessibilityLabel={option.nativeLabel}
            >
              {selected && <Check size={15} color="white" />}
              <Text className={`font-black ml-1 ${selected ? "text-white" : "text-[#1C1C1E]"}`}>
                {option.nativeLabel}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

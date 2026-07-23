import React from "react";
import * as Native from "react-native";

import { useLanguage } from "@/localization/language-context";
import { getActiveLanguage, translate, translateError } from "@/localization/i18n";

export * from "react-native";

function translateChildren(children: React.ReactNode, language: "en" | "tr"): React.ReactNode {
  if (typeof children === "string") return translate(children, language);
  if (Array.isArray(children)) return children.map((child) => translateChildren(child, language));
  return children;
}

export const Text = React.forwardRef<React.ElementRef<typeof Native.Text>, Native.TextProps>(
  function LocalizedText({ children, ...props }, ref) {
    const { language } = useLanguage();
    return (
      <Native.Text ref={ref} {...props}>
        {translateChildren(children, language)}
      </Native.Text>
    );
  },
);

export const TextInput = React.forwardRef<
  React.ElementRef<typeof Native.TextInput>,
  Native.TextInputProps
>(function LocalizedTextInput({ placeholder, accessibilityLabel, ...props }, ref) {
  const { language } = useLanguage();
  return (
    <Native.TextInput
      ref={ref}
      placeholder={translate(placeholder, language)}
      accessibilityLabel={translate(accessibilityLabel, language)}
      {...props}
    />
  );
});

export const TouchableOpacity = React.forwardRef<
  React.ElementRef<typeof Native.TouchableOpacity>,
  Native.TouchableOpacityProps
>(function LocalizedTouchableOpacity({ accessibilityLabel, ...props }, ref) {
  const { language } = useLanguage();
  return (
    <Native.TouchableOpacity
      ref={ref}
      accessibilityLabel={translate(accessibilityLabel, language)}
      {...props}
    />
  );
});

export const Alert = {
  ...Native.Alert,
  alert(
    title: string,
    message?: string,
    buttons?: Native.AlertButton[],
    options?: Native.AlertOptions,
  ) {
    Native.Alert.alert(
      translate(title),
      message == null
        ? undefined
        : getActiveLanguage() === "tr" && translate(message) === message
          ? translateError(message)
          : translate(message),
      buttons?.map((button) => ({ ...button, text: translate(button.text) })),
      options,
    );
  },
};

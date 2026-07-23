import React from "react";
import * as Native from "react-native";

import { useLanguage } from "@/localization/language-context";
import { getActiveLanguage, translate, translateError } from "@/localization/i18n";

export * from "react-native";

function translateChildren(children: React.ReactNode): React.ReactNode {
  if (typeof children === "string") return translate(children);
  if (Array.isArray(children)) return children.map(translateChildren);
  return children;
}

export const Text = React.forwardRef<React.ElementRef<typeof Native.Text>, Native.TextProps>(
  function LocalizedText({ children, ...props }, ref) {
    useLanguage();
    return <Native.Text ref={ref} {...props}>{translateChildren(children)}</Native.Text>;
  },
);

export const TextInput = React.forwardRef<
  React.ElementRef<typeof Native.TextInput>,
  Native.TextInputProps
>(function LocalizedTextInput({ placeholder, accessibilityLabel, ...props }, ref) {
  useLanguage();
  return (
    <Native.TextInput
      ref={ref}
      placeholder={translate(placeholder)}
      accessibilityLabel={translate(accessibilityLabel)}
      {...props}
    />
  );
});

export const TouchableOpacity = React.forwardRef<
  React.ElementRef<typeof Native.TouchableOpacity>,
  Native.TouchableOpacityProps
>(function LocalizedTouchableOpacity({ accessibilityLabel, ...props }, ref) {
  useLanguage();
  return (
    <Native.TouchableOpacity
      ref={ref}
      accessibilityLabel={translate(accessibilityLabel)}
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

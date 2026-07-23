import React from "react";
import { fireEvent, render, waitFor } from "@testing-library/react-native";

import { Text, TouchableOpacity } from "@/components/localized-native";
import { LanguageProvider, useLanguage } from "@/localization/language-context";

jest.mock("expo-secure-store", () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("@/config/firebase", () => ({ auth: { currentUser: null } }));
jest.mock("@/api/users", () => ({ userApi: { update: jest.fn() } }));

function SwitchExample() {
  const { setLanguage } = useLanguage();
  return (
    <>
      <Text>Get Started</Text>
      <TouchableOpacity testID="turkish" onPress={() => void setLanguage("tr")} />
    </>
  );
}

test("translates the currently rendered screen immediately", async () => {
  const screen = await render(
    <LanguageProvider>
      <SwitchExample />
    </LanguageProvider>,
  );

  expect(screen.getByText("Get Started")).toBeTruthy();
  await fireEvent.press(screen.getByTestId("turkish"));
  await waitFor(() => expect(screen.getByText("Başlayın")).toBeTruthy());
});

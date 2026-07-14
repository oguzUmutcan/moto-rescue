import { Stack } from "expo-router";

import "@/global.css";
import { RegistrationProvider } from "@/contexts/registration";

export default function RootLayout() {
  return (
    <RegistrationProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </RegistrationProvider>
  );
}

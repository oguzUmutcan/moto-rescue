import React from "react";
// In Expo, install and import from 'lucide-react-native'
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WelcomeScreen from "./onboarding/welcome";

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); // Hook to get safe area insets for padding
  // When we set up navigation later, we will use Expo Router here
  const handleNext = () => {
    router.push("/onboarding/passenger");
  };

  return <WelcomeScreen onNext={handleNext} insets={insets} />;
}

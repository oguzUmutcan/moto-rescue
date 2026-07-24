import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import WelcomeScreen from "./onboarding/welcome";
import { getCachedProfile } from "@/api/users";
import { profileRoute } from "@/utils/app-routing";
import { View } from "react-native";

export default function App() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCachedProfile().then(cached => {
      if (!active) return;
      if (cached) {
        // Instant Launch - route based on local cache
        router.replace(profileRoute(cached));
      } else {
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [router]);

  const handleNext = () => {
    router.navigate("/onboarding/passenger");
  };

  if (loading) {
    // Show splash background color while checking 0ms cache
    return <View style={{ flex: 1, backgroundColor: "#0B132A" }} />;
  }

  return <WelcomeScreen onNext={handleNext} insets={insets} />;
}

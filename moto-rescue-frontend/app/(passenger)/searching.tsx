import { useLocalSearchParams, useRouter } from "expo-router";
import { CheckCircle, Clock } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
    Text,
    TouchableOpacity,
    View
} from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withRepeat,
    withTiming,
} from "react-native-reanimated";
import { auth } from "../../config/firebase";
import { rescueApi, RescueRequest } from "../../api/rescues";
import LocationMap from "../../components/location-map";
import ProfileAvatar from "../../components/profile-avatar";

// Helper component for the pulsing dots animation
const AnimatedDot = ({
  delay,
  isOrange,
}: {
  delay: number;
  isOrange: boolean;
}) => {
  const scale = useSharedValue(0.85);
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true),
    );
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 600 }), -1, true),
    );
  }, [delay, opacity, scale]);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      className={`w-[9px] h-[9px] rounded-full mx-1 ${isOrange ? "bg-[#FF9500]" : "bg-[#E5E5EA]"}`}
      style={style}
    />
  );
};

export default function PassengerSearchingScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [secs, setSecs] = useState(300); // 5 minutes
  const [matched, setMatched] = useState(false);
  const [request, setRequest] = useState<RescueRequest | null>(null);

  // Spinner Animation
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Start continuous spin
    rotation.value = withRepeat(
      withTiming(360, { duration: 1000, easing: Easing.linear }),
      -1,
      false,
    );

    // Countdown Timer
    const countdownTimer = setInterval(() => {
      setSecs((s) => (s > 0 ? s - 1 : 0));
    }, 1000);

    return () => {
      clearInterval(countdownTimer);
    };
  }, [rotation]);

  useEffect(() => {
    if (!requestId || !auth.currentUser) {
      router.replace("/(passenger)/(tabs)/dashboard");
      return;
    }
    let active = true;
    const refresh = async () => {
      try {
        const request = await rescueApi.get(requestId);
        if (!active) return;
        setRequest(request);
        setMatched(request.status === "accepted");
        setSecs(Math.max(0, Math.ceil((new Date(request.expiresAt).getTime() - Date.now()) / 1000)));
        if (request.status === "in_progress" || request.status === "completed") {
          router.replace({ pathname: "/(passenger)/ride", params: { requestId } });
        }
        if (request.status === "cancelled") {
          router.replace("/(passenger)/(tabs)/dashboard");
        }
      } catch (error) {
        console.error("Could not refresh rescue request", error);
      }
    };
    void refresh();
    const timer = setInterval(refresh, 3000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [requestId, router]);

  const animatedSpin = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleCancel = async () => {
    if (requestId) {
      await rescueApi.cancel(requestId);
    }
    router.replace("/(passenger)/(tabs)/dashboard");
  };

  const handleMatch = () => {
    // Navigate to the Active Ride map!
    router.replace({ pathname: "/(passenger)/ride", params: { requestId } });
  };

  const m = Math.floor(secs / 60);
  const s = secs % 60;

  return (
    <View className="flex-1 bg-[#E5EBF0] relative">
      {request && (
        <LocationMap
          initialRegion={{ latitude: request.latitude, longitude: request.longitude, latitudeDelta: 0.04, longitudeDelta: 0.04 }}
          selectedCoordinate={{ latitude: request.latitude, longitude: request.longitude }}
        />
      )}

      {/* OVERLAY CONTENT */}
      <View className="absolute inset-0 items-center justify-center px-6">
        {/* Animated Spinner & Icon */}
        <View className="relative items-center justify-center mb-6 w-[112px] h-[112px]">
          <Animated.View
            className="absolute w-full h-full rounded-full border-[4px] border-white/40"
            style={[animatedSpin, { borderTopColor: "#FF9500" }]}
          />
          <View className="absolute items-center justify-center">
            <Text className="text-[42px]">🏍</Text>
          </View>
        </View>

        {matched ? (
          // --- MATCHED STATE ---
          <View className="bg-white rounded-[22px] p-6 shadow-2xl w-full items-center">
            <ProfileAvatar storagePath={request?.bikerProfilePhotoPath ?? null} size={72} />
            <Text className="text-[22px] font-black text-[#1C1C1E] mb-1.5">
              Hero Found!
            </Text>
            <Text className="text-[14px] text-[#8E8E93] mb-5">
              {request?.bikerName ?? "Your biker"} is on the way
            </Text>

            <TouchableOpacity
              onPress={handleMatch}
              activeOpacity={0.8}
              className="w-full h-[54px] rounded-2xl bg-[#34C759] items-center justify-center shadow-md"
              style={{
                shadowColor: "#34C759",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 8,
              }}
            >
              <Text className="text-white text-[17px] font-black tracking-wide">
                View Biker
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          // --- SEARCHING STATE ---
          <View className="bg-white rounded-[22px] p-5 shadow-2xl w-full">
            <Text className="text-[21px] font-black text-[#1C1C1E] mb-1.5 text-center">
              Searching for Heroes…
            </Text>
            <Text className="text-[14px] text-[#8E8E93] mb-4 text-center">
              Alerting verified bikers within 6 km
            </Text>

            {/* Pulsing Dots */}
            <View className="flex-row justify-center mb-5">
              {[0, 1, 2, 3, 4].map((i) => (
                <AnimatedDot key={i} delay={i * 150} isOrange={i < 3} />
              ))}
            </View>

            {/* Countdown Box */}
            <View className="bg-[#FFF8E1] rounded-xl py-2.5 px-4 flex-row items-center justify-center mb-3.5">
              <Clock size={15} color="#FF9500" className="mr-2" />
              <Text className="text-[15px] font-black text-[#F59E0B]">
                Timeout in {m}:{String(s).padStart(2, "0")}
              </Text>
            </View>

            {/* Status Checklist */}
            {[
              { text: "Nearby verified bikers alerted", done: true },
              { text: "Checking availability…", done: false },
            ].map((item, i) => (
              <View
                key={i}
                className={`flex-row items-center px-3 py-2.5 rounded-[10px] mb-1.5 ${item.done ? "bg-[#EDFAF3]" : "bg-[#F2F2F7]"}`}
              >
                {item.done ? (
                  <CheckCircle size={14} color="#34C759" className="mr-2" />
                ) : (
                  <Clock size={14} color="#8E8E93" className="mr-2" />
                )}
                <Text
                  className={`text-[13px] ${item.done ? "text-[#34C759] font-bold" : "text-[#8E8E93] font-medium"}`}
                >
                  {item.text}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Cancel Request Button */}
        {request?.status !== "in_progress" && (
          <TouchableOpacity onPress={handleCancel} activeOpacity={0.7} className="mt-4 bg-white/90 rounded-xl px-6 py-3">
            <Text className="text-[14px] font-bold text-[#FF3B30]">Cancel Request</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

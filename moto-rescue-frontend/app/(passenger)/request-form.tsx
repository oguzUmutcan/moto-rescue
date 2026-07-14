import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDown, LocateFixed, MapPin, X, Zap } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rescueApi } from "../../api/rescues";
import { auth } from "../../config/firebase";

const URGENCY_OPTIONS = [
  "🎓 Exam / Academic",
  "🏥 Medical",
  "💼 Work / Interview",
  "✈️ Airport / Travel",
  "🏛️ Official Appointment",
  "⚠️ Other urgent need",
];

type Coordinates = { latitude: number; longitude: number };

function addressLabel(address?: Location.LocationGeocodedAddress): string {
  if (!address) return "Current GPS location";
  return [address.name, address.street, address.district, address.city]
    .filter((part, index, values) => part && values.indexOf(part) === index)
    .join(", ") || "Current GPS location";
}

export default function RequestFormScreen() {
  const router = useRouter();
  const [pickupMode, setPickupMode] = useState<"current" | "manual">("current");
  const [currentPickup, setCurrentPickup] = useState<Coordinates | null>(null);
  const [pickupLabel, setPickupLabel] = useState("Finding current location...");
  const [manualPickup, setManualPickup] = useState("");
  const [destination, setDestination] = useState("");
  const [urgency, setUrgency] = useState(URGENCY_OPTIONS[0]);
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [needsHelmet, setNeedsHelmet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          if (active) setPickupMode("manual");
          return;
        }
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const addresses = await Location.reverseGeocodeAsync(coordinates).catch(() => []);
        if (active) {
          setCurrentPickup(coordinates);
          setPickupLabel(addressLabel(addresses[0]));
        }
      } catch {
        if (active) {
          setPickupMode("manual");
          setPickupLabel("Current location unavailable");
        }
      }
    })();
    return () => { active = false; };
  }, []);

  const geocode = async (label: string, fieldName: string): Promise<Coordinates> => {
    const results = await Location.geocodeAsync(label.trim());
    if (!results.length) throw new Error(`${fieldName} address could not be found. Please enter a more specific address.`);
    return { latitude: results[0].latitude, longitude: results[0].longitude };
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || isSubmitting) return;
    if (pickupMode === "manual" && !manualPickup.trim()) {
      Alert.alert("Pickup required", "Enter a pickup address or select your current location.");
      return;
    }
    if (!destination.trim()) {
      Alert.alert("Destination required", "Enter a specific destination address.");
      return;
    }

    setIsSubmitting(true);
    try {
      const pickup = pickupMode === "current"
        ? currentPickup ?? (() => { throw new Error("Current location is not ready. Try again or enter it manually."); })()
        : await geocode(manualPickup, "Pickup");
      const destinationCoordinates = await geocode(destination, "Destination");
      const request = await rescueApi.create({
        ...pickup,
        destinationLabel: destination.trim(),
        destinationLatitude: destinationCoordinates.latitude,
        destinationLongitude: destinationCoordinates.longitude,
        urgency,
        needsHelmet,
      });
      router.replace({ pathname: "/(passenger)/searching", params: { requestId: request.id } });
    } catch (error) {
      Alert.alert("Request failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 justify-end bg-black/40">
      <View className="bg-white rounded-t-[24px] pt-3 px-5 pb-8 shadow-2xl max-h-[92%]">
        <View className="w-9 h-1 rounded-full bg-[#D1D1D6] self-center mb-4" />
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[21px] font-black text-[#1C1C1E]">Request a Rescue 🚨</Text>
          <TouchableOpacity onPress={() => router.back()} className="w-[30px] h-[30px] rounded-full bg-[#F2F2F7] items-center justify-center">
            <X size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">Pickup</Text>
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity onPress={() => setPickupMode("current")} className={`flex-1 rounded-xl px-3 py-3 flex-row items-center ${pickupMode === "current" ? "bg-[#007AFF]" : "bg-[#F2F2F7]"}`}>
              <LocateFixed size={16} color={pickupMode === "current" ? "white" : "#007AFF"} />
              <Text className={`ml-2 font-bold ${pickupMode === "current" ? "text-white" : "text-[#1C1C1E]"}`}>My location</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPickupMode("manual")} className={`flex-1 rounded-xl px-3 py-3 flex-row items-center ${pickupMode === "manual" ? "bg-[#007AFF]" : "bg-[#F2F2F7]"}`}>
              <MapPin size={16} color={pickupMode === "manual" ? "white" : "#007AFF"} />
              <Text className={`ml-2 font-bold ${pickupMode === "manual" ? "text-white" : "text-[#1C1C1E]"}`}>Enter address</Text>
            </TouchableOpacity>
          </View>
          {pickupMode === "current" ? (
            <View className="bg-[#EEF4FF] rounded-xl px-3.5 py-3 mb-4"><Text className="text-[#1C1C1E] font-medium">{pickupLabel}</Text></View>
          ) : (
            <TextInput value={manualPickup} onChangeText={setManualPickup} placeholder="Street, building, district..." className="bg-[#F2F2F7] rounded-xl px-3.5 py-3.5 mb-4 text-[#1C1C1E]" />
          )}

          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">Destination</Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5 mb-4 border border-[#D1D1D6]">
            <MapPin size={16} color="#FF3B30" />
            <TextInput value={destination} onChangeText={setDestination} placeholder="Enter destination address" returnKeyType="done" className="flex-1 px-2.5 py-3.5 text-[#1C1C1E]" />
          </View>

          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">Urgency Type</Text>
          <TouchableOpacity onPress={() => setUrgencyOpen((open) => !open)} className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5">
            <Text className="text-[14px] text-[#1C1C1E] font-bold">{urgency}</Text>
            <ChevronDown size={18} color="#8E8E93" />
          </TouchableOpacity>
          {urgencyOpen && (
            <View className="mt-1 mb-3 rounded-xl overflow-hidden border border-[#E5E5EA]">
              {URGENCY_OPTIONS.map((option) => (
                <TouchableOpacity key={option} onPress={() => { setUrgency(option); setUrgencyOpen(false); }} className={`px-3.5 py-3 border-b border-[#E5E5EA] ${option === urgency ? "bg-[#EEF4FF]" : "bg-white"}`}>
                  <Text className={`text-[14px] ${option === urgency ? "font-black text-[#007AFF]" : "font-medium text-[#1C1C1E]"}`}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5 my-4">
            <View className="flex-1"><Text className="text-[14px] font-bold text-[#1C1C1E]">⛑️ I need a helmet</Text><Text className="text-[12px] text-[#8E8E93]">Biker will bring an extra helmet</Text></View>
            <Switch value={needsHelmet} onValueChange={setNeedsHelmet} trackColor={{ false: "#D1D1D6", true: "#34C759" }} />
          </View>

          <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting} className={`w-full h-14 rounded-2xl items-center justify-center flex-row ${isSubmitting ? "bg-[#FFB75E]" : "bg-[#FF9500]"}`}>
            <Zap size={20} color="white" fill="white" />
            <Text className="text-white text-[18px] font-black ml-2">{isSubmitting ? "Locating addresses..." : "Request Rescue"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

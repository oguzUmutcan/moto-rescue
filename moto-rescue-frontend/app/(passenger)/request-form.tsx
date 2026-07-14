import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { ChevronDown, LocateFixed, Map, MapPin, X, Zap } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert,
  Dimensions, Keyboard, KeyboardAvoidingView,
  Modal, Platform,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { rescueApi } from "../../api/rescues";
import { auth } from "../../config/firebase";
import LocationMap from "../../components/location-map";
import type { MapRegion } from "../../components/location-map.types";

const URGENCY_OPTIONS = [
  "🎓 Exam / Academic",
  "🏥 Medical",
  "💼 Work / Interview",
  "✈️ Airport / Travel",
  "🏛️ Official Appointment",
  "⚠️ Other urgent need",
];

type Coordinates = { latitude: number; longitude: number };
type Suggestion = Coordinates & { label: string; details: string };

function useAddressSuggestions(query: string, enabled: boolean) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || query.trim().length < 3) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const matches = (await Location.geocodeAsync(query.trim())).slice(0, 5);
        const placeLabel = query.trim();
        const resolved = await Promise.all(matches.map(async (match) => {
          const addresses = await Location.reverseGeocodeAsync(match).catch(() => []);
          return {
            latitude: match.latitude,
            longitude: match.longitude,
            label: placeLabel,
            details: addresses[0]
              ? addressLabel(addresses[0])
              : `${match.latitude.toFixed(5)}, ${match.longitude.toFixed(5)}`,
          };
        }));
        const unique = resolved.filter((item, index, all) =>
          all.findIndex((other) => other.details === item.details) === index,
        );
        if (active) setSuggestions(unique);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 550);
    return () => { active = false; clearTimeout(timer); };
  }, [enabled, query]);

  return { suggestions, loading, clear: () => setSuggestions([]) };
}

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
  const [manualPickupCoordinates, setManualPickupCoordinates] = useState<Coordinates | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoordinates, setDestinationCoordinates] = useState<Coordinates | null>(null);
  const [urgency, setUrgency] = useState(URGENCY_OPTIONS[0]);
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [needsHelmet, setNeedsHelmet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapTarget, setMapTarget] = useState<"pickup" | "destination" | null>(null);
  const [mapSelection, setMapSelection] = useState<Coordinates | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const formScrollRef = useRef<ScrollView>(null);
  const pickupSearch = useAddressSuggestions(manualPickup, manualPickupCoordinates === null);
  const destinationSearch = useAddressSuggestions(destination, destinationCoordinates === null);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const show = Keyboard.addListener("keyboardDidShow", (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => setKeyboardHeight(0));
    return () => { show.remove(); hide.remove(); };
  }, []);

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

  const openMap = (target: "pickup" | "destination") => {
    const existing = target === "pickup" ? manualPickupCoordinates : destinationCoordinates;
    setMapSelection(existing ?? currentPickup ?? { latitude: 36.7538, longitude: 3.0588 });
    setMapTarget(target);
  };

  const confirmMapSelection = async () => {
    if (!mapTarget || !mapSelection) return;
    try {
      const addresses = await Location.reverseGeocodeAsync(mapSelection);
      const label = addressLabel(addresses[0]);
      if (mapTarget === "pickup") {
        setPickupMode("manual");
        setManualPickup(label);
        setManualPickupCoordinates(mapSelection);
        pickupSearch.clear();
      } else {
        setDestination(label);
        setDestinationCoordinates(mapSelection);
        destinationSearch.clear();
      }
      setMapTarget(null);
    } catch {
      Alert.alert("Location unavailable", "The selected point could not be converted to an address.");
    }
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
        : manualPickupCoordinates ?? await geocode(manualPickup, "Pickup");
      const resolvedDestination = destinationCoordinates ?? await geocode(destination, "Destination");
      const request = await rescueApi.create({
        ...pickup,
        pickupLabel: pickupMode === "current" ? pickupLabel : manualPickup.trim(),
        destinationLabel: destination.trim(),
        destinationLatitude: resolvedDestination.latitude,
        destinationLongitude: resolvedDestination.longitude,
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
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      className="flex-1 justify-end bg-black/40"
      style={{ paddingBottom: Platform.OS === "android" ? keyboardHeight : 0 }}
    >
      <View
        className="bg-white rounded-t-[24px] pt-3 px-5 pb-8 shadow-2xl"
        style={{ maxHeight: keyboardHeight > 0 ? Dimensions.get("window").height - keyboardHeight - 20 : "92%" }}
      >
        <View className="w-9 h-1 rounded-full bg-[#D1D1D6] self-center mb-4" />
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[21px] font-black text-[#1C1C1E]">Request a Rescue 🚨</Text>
          <TouchableOpacity onPress={() => router.back()} className="w-[30px] h-[30px] rounded-full bg-[#F2F2F7] items-center justify-center">
            <X size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <ScrollView ref={formScrollRef} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingBottom: 12 }}>
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
            <View className="mb-4">
              <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5">
                <TextInput value={manualPickup} onChangeText={(text) => { setManualPickup(text); setManualPickupCoordinates(null); }} placeholder="Search pickup address" className="flex-1 py-3.5 text-[#1C1C1E]" />
                {pickupSearch.loading && <ActivityIndicator size="small" color="#007AFF" />}
                <TouchableOpacity onPress={() => openMap("pickup")} className="ml-2 p-2"><Map size={19} color="#007AFF" /></TouchableOpacity>
              </View>
              {pickupSearch.suggestions.length > 0 && (
                <View className="rounded-xl border border-[#E5E5EA] overflow-hidden mt-1">
                  {pickupSearch.suggestions.map((item) => (
                    <TouchableOpacity key={`${item.latitude}-${item.longitude}`} onPress={() => { setManualPickup(item.label); setManualPickupCoordinates(item); pickupSearch.clear(); }} className="bg-white px-3 py-3 border-b border-[#E5E5EA] flex-row">
                      <MapPin size={15} color="#007AFF" />
                      <View className="ml-2 flex-1"><Text className="font-bold text-[#1C1C1E]">{item.label}</Text><Text className="text-[12px] text-[#8E8E93] mt-0.5">{item.details}</Text></View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}

          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">Destination</Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5 border border-[#D1D1D6]">
            <MapPin size={16} color="#FF3B30" />
            <TextInput
              value={destination}
              onChangeText={(text) => { setDestination(text); setDestinationCoordinates(null); }}
              onFocus={() => setTimeout(() => formScrollRef.current?.scrollTo({ y: 210, animated: true }), 250)}
              placeholder="Search destination"
              returnKeyType="search"
              className="flex-1 px-2.5 py-3.5 text-[#1C1C1E]"
            />
            {destinationSearch.loading && <ActivityIndicator size="small" color="#007AFF" />}
            <TouchableOpacity onPress={() => openMap("destination")} className="ml-1 p-2"><Map size={19} color="#007AFF" /></TouchableOpacity>
          </View>
          {destinationSearch.suggestions.length > 0 && (
            <View className="rounded-xl border border-[#E5E5EA] overflow-hidden mt-1 mb-3">
              {destinationSearch.suggestions.map((item) => (
                <TouchableOpacity key={`${item.latitude}-${item.longitude}`} onPress={() => { setDestination(item.label); setDestinationCoordinates(item); destinationSearch.clear(); }} className="bg-white px-3 py-3 border-b border-[#E5E5EA] flex-row">
                  <MapPin size={15} color="#FF3B30" />
                  <View className="ml-2 flex-1"><Text className="font-bold text-[#1C1C1E]">{item.label}</Text><Text className="text-[12px] text-[#8E8E93] mt-0.5">{item.details}</Text></View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          {destinationSearch.suggestions.length === 0 && <View className="mb-4" />}

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

      <Modal visible={mapTarget !== null} animationType="slide" onRequestClose={() => setMapTarget(null)}>
        <View className="flex-1 bg-white">
          <View className="absolute top-0 left-0 right-0 z-10 px-4 pt-14 pb-3 bg-white/95 flex-row items-center justify-between shadow-sm">
            <TouchableOpacity onPress={() => setMapTarget(null)} className="w-10 h-10 rounded-full bg-[#F2F2F7] items-center justify-center"><X size={20} color="#1C1C1E" /></TouchableOpacity>
            <View className="items-center"><Text className="font-black text-[17px]">Choose on map</Text><Text className="text-[12px] text-[#8E8E93]">Tap the exact point</Text></View>
            <View className="w-10" />
          </View>
          <LocationMap
            initialRegion={{ latitude: mapSelection?.latitude ?? 36.7538, longitude: mapSelection?.longitude ?? 3.0588, latitudeDelta: 0.02, longitudeDelta: 0.02 } as MapRegion}
            selectedCoordinate={mapSelection}
            onCoordinateSelect={setMapSelection}
          />
          <View className="absolute left-4 right-4 bottom-10 bg-white rounded-2xl p-4 shadow-lg">
            <Text className="text-[#8E8E93] text-[12px] font-bold mb-1">SELECTED POINT</Text>
            <Text className="font-bold text-[#1C1C1E] mb-3">{mapSelection ? `${mapSelection.latitude.toFixed(5)}, ${mapSelection.longitude.toFixed(5)}` : "Tap a point on the map"}</Text>
            <TouchableOpacity onPress={confirmMapSelection} disabled={!mapSelection} className="h-13 py-4 rounded-xl bg-[#007AFF] items-center"><Text className="text-white font-black">Use this location</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

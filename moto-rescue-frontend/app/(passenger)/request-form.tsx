import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "@/components/localized-native";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronDown,
  LocateFixed,
  Map,
  MapPin,
  X,
  Zap,
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { placesApi } from "../../api/places";
import { rescueApi } from "../../api/rescues";
import LocationMap from "../../components/location-map";
import type { MapRegion } from "../../components/location-map.types";
import { auth } from "../../config/firebase";
import { getAvailablePosition } from "../../utils/device-location";

const URGENCY_OPTIONS = [
  "🎓 Exam / Academic",
  "🏥 Medical",
  "💼 Work / Interview",
  "✈️ Airport / Travel",
  "🏛️ Official Appointment",
  "⚠️ Other urgent need",
];

type Coordinates = { latitude: number; longitude: number };
type Suggestion = {
  id: string;
  label: string;
  details: string;
  distanceKm: number | null;
  coordinates?: Coordinates;
  placeId?: string;
  source: "google" | "device";
};

const createSessionToken = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2)}`;

function distanceInKm(from: Coordinates, to: Coordinates): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = radians(to.latitude - from.latitude);
  const dLon = radians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(radians(from.latitude)) *
      Math.cos(radians(to.latitude)) *
      Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function useAddressSuggestions(
  query: string,
  enabled: boolean,
  origin: Coordinates | null,
  locationContext: string,
) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const sessionToken = useRef(createSessionToken());

  useEffect(() => {
    if (!enabled || query.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const searchText = query.trim();
        try {
          const response = await placesApi.autocomplete(
            searchText,
            origin,
            sessionToken.current,
          );
          if (active && response.predictions.length > 0) {
            setSuggestions(
              response.predictions.map((prediction) => ({
                id: prediction.placeId,
                placeId: prediction.placeId,
                label: prediction.label,
                details: prediction.details,
                distanceKm:
                  prediction.distanceMeters === null
                    ? null
                    : prediction.distanceMeters / 1000,
                source: "google",
              })),
            );
            return;
          }
        } catch {
          // Google Places is optional at runtime; keep the device geocoder as a free/offline fallback.
        }
        const searches = [
          ...new Set([
            searchText,
            locationContext ? `${searchText}, ${locationContext}` : searchText,
          ]),
        ];
        const batches = await Promise.all(
          searches.map((value) => Location.geocodeAsync(value).catch(() => [])),
        );
        const matches = batches.flat().slice(0, 12);
        const placeLabel = query.trim();
        const resolved = await Promise.all(
          matches.map(async (match) => {
            const addresses = await Location.reverseGeocodeAsync(match).catch(
              () => [],
            );
            return {
              id: `${match.latitude}-${match.longitude}`,
              coordinates: {
                latitude: match.latitude,
                longitude: match.longitude,
              },
              label: placeLabel,
              details: addresses[0]
                ? addressLabel(addresses[0])
                : `${match.latitude.toFixed(5)}, ${match.longitude.toFixed(5)}`,
              distanceKm: origin ? distanceInKm(origin, match) : null,
              source: "device" as const,
            };
          }),
        );
        const unique = resolved
          .filter(
            (item, index, all) =>
              all.findIndex(
                (other) =>
                  Math.abs(
                    other.coordinates.latitude - item.coordinates.latitude,
                  ) < 0.00005 &&
                  Math.abs(
                    other.coordinates.longitude - item.coordinates.longitude,
                  ) < 0.00005,
              ) === index,
          )
          .sort(
            (left, right) =>
              (left.distanceKm ?? Number.MAX_VALUE) -
              (right.distanceKm ?? Number.MAX_VALUE),
          )
          .slice(0, 8);
        if (active) setSuggestions(unique);
      } catch {
        if (active) setSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 550);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [enabled, locationContext, origin, query]);

  const resolve = async (suggestion: Suggestion) => {
    if (suggestion.coordinates)
      return { label: suggestion.label, coordinates: suggestion.coordinates };
    if (!suggestion.placeId)
      throw new Error("Place coordinates are unavailable.");
    const details = await placesApi.details(
      suggestion.placeId,
      sessionToken.current,
    );
    sessionToken.current = createSessionToken();
    return {
      label: details.label || suggestion.label,
      coordinates: { latitude: details.latitude, longitude: details.longitude },
    };
  };

  return { suggestions, loading, resolve, clear: () => setSuggestions([]) };
}

function addressLabel(address?: Location.LocationGeocodedAddress): string {
  if (!address) return "Current GPS location";
  return (
    [address.name, address.street, address.district, address.city]
      .filter((part, index, values) => part && values.indexOf(part) === index)
      .join(", ") || "Current GPS location"
  );
}

export default function RequestFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ focus?: string | string[] }>();
  const focusTarget = Array.isArray(params.focus)
    ? params.focus[0]
    : params.focus;
  const destinationInputRef = useRef<React.ElementRef<typeof TextInput>>(null);
  const [pickupMode, setPickupMode] = useState<"current" | "manual">("current");
  const [currentPickup, setCurrentPickup] = useState<Coordinates | null>(null);
  const [pickupLabel, setPickupLabel] = useState("Finding current location...");
  const [manualPickup, setManualPickup] = useState("");
  const [manualPickupCoordinates, setManualPickupCoordinates] =
    useState<Coordinates | null>(null);
  const [destination, setDestination] = useState("");
  const [destinationCoordinates, setDestinationCoordinates] =
    useState<Coordinates | null>(null);
  const [urgency, setUrgency] = useState(URGENCY_OPTIONS[0]);
  const [urgencyOpen, setUrgencyOpen] = useState(false);
  const [needsHelmet, setNeedsHelmet] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapTarget, setMapTarget] = useState<"pickup" | "destination" | null>(
    null,
  );
  const [mapSelection, setMapSelection] = useState<Coordinates | null>(null);
  const locationContext = pickupLabel.split(",").slice(-2).join(",").trim();
  const pickupSearch = useAddressSuggestions(
    manualPickup,
    manualPickupCoordinates === null,
    currentPickup,
    locationContext,
  );
  const destinationSearch = useAddressSuggestions(
    destination,
    destinationCoordinates === null,
    currentPickup,
    locationContext,
  );

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (permission.status !== "granted") {
          if (active) setPickupMode("manual");
          return;
        }
        const location = await getAvailablePosition();
        const coordinates = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        const addresses = await Location.reverseGeocodeAsync(coordinates).catch(
          () => [],
        );
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
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (focusTarget !== "destination") return;
    const timer = setTimeout(() => destinationInputRef.current?.focus(), 400);
    return () => clearTimeout(timer);
  }, [focusTarget]);

  const geocode = async (
    label: string,
    fieldName: string,
  ): Promise<Coordinates> => {
    const results = await Location.geocodeAsync(label.trim());
    if (!results.length)
      throw new Error(
        `${fieldName} address could not be found. Please enter a more specific address.`,
      );
    return { latitude: results[0].latitude, longitude: results[0].longitude };
  };

  const chooseSuggestion = async (
    target: "pickup" | "destination",
    item: Suggestion,
  ) => {
    try {
      const search = target === "pickup" ? pickupSearch : destinationSearch;
      const resolved = await search.resolve(item);
      if (target === "pickup") {
        setManualPickup(resolved.label);
        setManualPickupCoordinates(resolved.coordinates);
      } else {
        setDestination(resolved.label);
        setDestinationCoordinates(resolved.coordinates);
      }
      search.clear();
    } catch (error) {
      Alert.alert(
        "Could not select place",
        error instanceof Error ? error.message : "Please try again.",
      );
    }
  };

  const openMap = (target: "pickup" | "destination") => {
    const existing =
      target === "pickup" ? manualPickupCoordinates : destinationCoordinates;
    setMapSelection(
      existing ?? currentPickup ?? { latitude: 36.7538, longitude: 3.0588 },
    );
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
      Alert.alert(
        "Location unavailable",
        "The selected point could not be converted to an address.",
      );
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser || isSubmitting) return;
    if (pickupMode === "manual" && !manualPickup.trim()) {
      Alert.alert(
        "Pickup required",
        "Enter a pickup address or select your current location.",
      );
      return;
    }
    if (!destination.trim()) {
      Alert.alert(
        "Destination required",
        "Enter a specific destination address.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const pickup =
        pickupMode === "current"
          ? (currentPickup ??
            (() => {
              throw new Error(
                "Current location is not ready. Try again or enter it manually.",
              );
            })())
          : (manualPickupCoordinates ??
            (await geocode(manualPickup, "Pickup")));
      const resolvedDestination =
        destinationCoordinates ?? (await geocode(destination, "Destination"));
      const request = await rescueApi.create({
        ...pickup,
        pickupLabel:
          pickupMode === "current" ? pickupLabel : manualPickup.trim(),
        destinationLabel: destination.trim(),
        destinationLatitude: resolvedDestination.latitude,
        destinationLongitude: resolvedDestination.longitude,
        urgency,
        needsHelmet,
      });
      router.replace({
        pathname: "/(passenger)/searching",
        params: { requestId: request.id },
      });
    } catch (error) {
      Alert.alert(
        "Request failed",
        error instanceof Error ? error.message : "Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="flex-1 justify-end bg-black/40">
      <View
        className="bg-white rounded-t-[24px] pt-3 px-5 pb-8 shadow-2xl"
        style={{
          maxHeight: "92%",
        }}
      >
        <View className="w-9 h-1 rounded-full bg-[#D1D1D6] self-center mb-4" />
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-[21px] font-black text-[#1C1C1E]">
            Request a Rescue 🚨
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            className="w-[30px] h-[30px] rounded-full bg-[#F2F2F7] items-center justify-center"
          >
            <X size={16} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        <KeyboardAwareScrollView
          bottomOffset={16}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 12 }}
        >
          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Pickup
          </Text>
          <View className="flex-row gap-2 mb-2">
            <TouchableOpacity
              onPress={() => setPickupMode("current")}
              className={`flex-1 rounded-xl px-3 py-3 flex-row items-center ${pickupMode === "current" ? "bg-[#007AFF]" : "bg-[#F2F2F7]"}`}
            >
              <LocateFixed
                size={16}
                color={pickupMode === "current" ? "white" : "#007AFF"}
              />
              <Text
                className={`ml-2 font-bold ${pickupMode === "current" ? "text-white" : "text-[#1C1C1E]"}`}
              >
                My location
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPickupMode("manual")}
              className={`flex-1 rounded-xl px-3 py-3 flex-row items-center ${pickupMode === "manual" ? "bg-[#007AFF]" : "bg-[#F2F2F7]"}`}
            >
              <MapPin
                size={16}
                color={pickupMode === "manual" ? "white" : "#007AFF"}
              />
              <Text
                className={`ml-2 font-bold ${pickupMode === "manual" ? "text-white" : "text-[#1C1C1E]"}`}
              >
                Enter address
              </Text>
            </TouchableOpacity>
          </View>
          {pickupMode === "current" ? (
            <View className="bg-[#EEF4FF] rounded-xl px-3.5 py-3 mb-4">
              <Text className="text-[#1C1C1E] font-medium">{pickupLabel}</Text>
            </View>
          ) : (
            <View className="mb-4">
              <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5">
                <TextInput
                  value={manualPickup}
                  onChangeText={(text) => {
                    setManualPickup(text);
                    setManualPickupCoordinates(null);
                  }}
                  placeholder="Search pickup address"
                  className="flex-1 py-3.5 text-[#1C1C1E]"
                />
                {pickupSearch.loading && (
                  <ActivityIndicator size="small" color="#007AFF" />
                )}
                <TouchableOpacity
                  onPress={() => openMap("pickup")}
                  className="ml-2 p-2"
                >
                  <Map size={19} color="#007AFF" />
                </TouchableOpacity>
              </View>
              {pickupSearch.suggestions.length > 0 && (
                <ScrollView
                  nestedScrollEnabled
                  keyboardShouldPersistTaps="handled"
                  className="rounded-xl border border-[#E5E5EA] mt-1"
                  style={{ maxHeight: 220 }}
                >
                  {pickupSearch.suggestions.map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => void chooseSuggestion("pickup", item)}
                      className="bg-white px-3 py-3 border-b border-[#E5E5EA] flex-row"
                    >
                      <MapPin size={15} color="#007AFF" />
                      <View className="ml-2 flex-1">
                        <View className="flex-row justify-between">
                          <Text className="font-bold text-[#1C1C1E] flex-1">
                            {item.label}
                          </Text>
                          {item.distanceKm !== null && (
                            <Text className="text-[11px] font-bold text-[#007AFF] ml-2">
                              {item.distanceKm < 1
                                ? `${Math.round(item.distanceKm * 1000)} m`
                                : `${item.distanceKm.toFixed(1)} km`}
                            </Text>
                          )}
                        </View>
                        <Text className="text-[12px] text-[#8E8E93] mt-0.5">
                          {item.details}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  {pickupSearch.suggestions.some(
                    (item) => item.source === "google",
                  ) && (
                    <Text className="bg-white px-3 py-2 text-right text-[11px] font-bold text-[#8E8E93]">
                      Powered by Google
                    </Text>
                  )}
                </ScrollView>
              )}
            </View>
          )}

          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Destination
          </Text>
          <View className="flex-row items-center bg-[#F2F2F7] rounded-xl px-3.5 border border-[#D1D1D6]">
            <MapPin size={16} color="#FF3B30" />
            <TextInput
              ref={destinationInputRef}
              value={destination}
              onChangeText={(text) => {
                setDestination(text);
                setDestinationCoordinates(null);
              }}
              placeholder="Search destination"
              returnKeyType="search"
              className="flex-1 px-2.5 py-3.5 text-[#1C1C1E]"
            />
            {destinationSearch.loading && (
              <ActivityIndicator size="small" color="#007AFF" />
            )}
            <TouchableOpacity
              onPress={() => openMap("destination")}
              className="ml-1 p-2"
            >
              <Map size={19} color="#007AFF" />
            </TouchableOpacity>
          </View>
          {destinationSearch.suggestions.length > 0 && (
            <ScrollView
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
              className="rounded-xl border border-[#E5E5EA] mt-1 mb-3"
              style={{ maxHeight: 240 }}
            >
              {destinationSearch.suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => void chooseSuggestion("destination", item)}
                  className="bg-white px-3 py-3 border-b border-[#E5E5EA] flex-row"
                >
                  <MapPin size={15} color="#FF3B30" />
                  <View className="ml-2 flex-1">
                    <View className="flex-row justify-between">
                      <Text className="font-bold text-[#1C1C1E] flex-1">
                        {item.label}
                      </Text>
                      {item.distanceKm !== null && (
                        <Text className="text-[11px] font-bold text-[#007AFF] ml-2">
                          {item.distanceKm < 1
                            ? `${Math.round(item.distanceKm * 1000)} m`
                            : `${item.distanceKm.toFixed(1)} km`}
                        </Text>
                      )}
                    </View>
                    <Text className="text-[12px] text-[#8E8E93] mt-0.5">
                      {item.details}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
              {destinationSearch.suggestions.some(
                (item) => item.source === "google",
              ) && (
                <Text className="bg-white px-3 py-2 text-right text-[11px] font-bold text-[#8E8E93]">
                  Powered by Google
                </Text>
              )}
            </ScrollView>
          )}
          {destinationSearch.suggestions.length === 0 && (
            <View className="mb-4" />
          )}

          <Text className="text-[11px] font-bold text-[#8E8E93] tracking-widest uppercase mb-1.5">
            Urgency Type
          </Text>
          <TouchableOpacity
            onPress={() => setUrgencyOpen((open) => !open)}
            className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5"
          >
            <Text className="text-[14px] text-[#1C1C1E] font-bold">
              {urgency}
            </Text>
            <ChevronDown size={18} color="#8E8E93" />
          </TouchableOpacity>
          {urgencyOpen && (
            <View className="mt-1 mb-3 rounded-xl overflow-hidden border border-[#E5E5EA]">
              {URGENCY_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setUrgency(option);
                    setUrgencyOpen(false);
                  }}
                  className={`px-3.5 py-3 border-b border-[#E5E5EA] ${option === urgency ? "bg-[#EEF4FF]" : "bg-white"}`}
                >
                  <Text
                    className={`text-[14px] ${option === urgency ? "font-black text-[#007AFF]" : "font-medium text-[#1C1C1E]"}`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <View className="flex-row items-center justify-between bg-[#F2F2F7] rounded-xl px-3.5 py-3.5 my-4">
            <View className="flex-1">
              <Text className="text-[14px] font-bold text-[#1C1C1E]">
                ⛑️ I need a helmet
              </Text>
              <Text className="text-[12px] text-[#8E8E93]">
                Biker will bring an extra helmet
              </Text>
            </View>
            <Switch
              value={needsHelmet}
              onValueChange={setNeedsHelmet}
              trackColor={{ false: "#D1D1D6", true: "#34C759" }}
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            className={`w-full h-14 rounded-2xl items-center justify-center flex-row ${isSubmitting ? "bg-[#FFB75E]" : "bg-[#FF9500]"}`}
          >
            <Zap size={20} color="white" fill="white" />
            <Text className="text-white text-[18px] font-black ml-2">
              {isSubmitting ? "Locating addresses..." : "Request Rescue"}
            </Text>
          </TouchableOpacity>
        </KeyboardAwareScrollView>
      </View>

      <Modal
        visible={mapTarget !== null}
        animationType="slide"
        onRequestClose={() => setMapTarget(null)}
      >
        <View className="flex-1 bg-white">
          <View className="absolute top-0 left-0 right-0 z-10 px-4 pt-14 pb-3 bg-white/95 flex-row items-center justify-between shadow-sm">
            <TouchableOpacity
              onPress={() => setMapTarget(null)}
              className="w-10 h-10 rounded-full bg-[#F2F2F7] items-center justify-center"
            >
              <X size={20} color="#1C1C1E" />
            </TouchableOpacity>
            <View className="items-center">
              <Text className="font-black text-[17px]">Choose on map</Text>
              <Text className="text-[12px] text-[#8E8E93]">
                Tap the exact point
              </Text>
            </View>
            <View className="w-10" />
          </View>
          <LocationMap
            initialRegion={
              {
                latitude: mapSelection?.latitude ?? 36.7538,
                longitude: mapSelection?.longitude ?? 3.0588,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              } as MapRegion
            }
            selectedCoordinate={mapSelection}
            onCoordinateSelect={setMapSelection}
          />
          <View className="absolute left-4 right-4 bottom-10 bg-white rounded-2xl p-4 shadow-lg">
            <Text className="text-[#8E8E93] text-[12px] font-bold mb-1">
              SELECTED POINT
            </Text>
            <Text className="font-bold text-[#1C1C1E] mb-3">
              {mapSelection
                ? `${mapSelection.latitude.toFixed(5)}, ${mapSelection.longitude.toFixed(5)}`
                : "Tap a point on the map"}
            </Text>
            <TouchableOpacity
              onPress={confirmMapSelection}
              disabled={!mapSelection}
              className="h-13 py-4 rounded-xl bg-[#007AFF] items-center"
            >
              <Text className="text-white font-black">Use this location</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

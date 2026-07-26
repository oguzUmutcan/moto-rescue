import { useLocalSearchParams, useRouter } from "expo-router";
import { useIsFocused } from "@react-navigation/native";
import { AlertCircle, MapPin } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "@/components/localized-native";
import { rescueApi, RescueRequest } from "../../api/rescues";
import LocationMap from "../../components/location-map";
import ProfileAvatar from "../../components/profile-avatar";
import { auth } from "../../config/firebase";
import {
  dismissIncomingRequest,
  ensureIncomingRequestPresented,
  handleIncomingRequest,
} from "../../utils/request-presentation";

function HomeBar() {
  return (
    <View style={{ alignItems: "center", paddingVertical: 8 }}>
      <View
        style={{
          width: 134,
          height: 5,
          borderRadius: 3,
          backgroundColor: "rgba(0,0,0,0.18)",
        }}
      />
    </View>
  );
}

function distanceKm(request: RescueRequest) {
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const dLat = radians(request.destinationLatitude - request.latitude);
  const dLon = radians(request.destinationLongitude - request.longitude);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(radians(request.latitude))
    * Math.cos(radians(request.destinationLatitude))
    * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function IncomingRequestScreen() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const params = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const [secs, setSecs] = useState(30);
  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [accepting, setAccepting] = useState(false);
  const requestExpiryRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!requestId) return;
    ensureIncomingRequestPresented(requestId);
    return () => dismissIncomingRequest(requestId, requestExpiryRef.current);
  }, [requestId]);

  useEffect(() => {
    if (!isFocused || !requestId) return;
    rescueApi.get(requestId)
      .then((nextRequest) => {
        setRequest(nextRequest);
        requestExpiryRef.current = nextRequest.expiresAt
          ? new Date(nextRequest.expiresAt).getTime()
          : undefined;
      })
      .catch((error) => {
        console.error("Could not load rescue request", error);
        handleIncomingRequest(requestId);
        router.back();
      });
  }, [isFocused, requestId, router]);

  useEffect(() => {
    if (!isFocused) return;
    setSecs(30);
    const countdownTimer = setInterval(() => {
      setSecs((current) => Math.max(0, current - 1));
    }, 1000);
    const expiryTimer = setTimeout(() => {
      if (requestId) dismissIncomingRequest(requestId, requestExpiryRef.current);
      router.back();
    }, 30_000);

    return () => {
      clearInterval(countdownTimer);
      clearTimeout(expiryTimer);
    };
  }, [isFocused, requestId, router]);

  const handleAccept = async () => {
    const biker = auth.currentUser;
    if (!biker || !requestId || accepting) return;
    setAccepting(true);
    try {
      await rescueApi.accept(requestId);
      handleIncomingRequest(requestId);
      router.replace(`/(biker)/navigation?requestId=${encodeURIComponent(requestId)}`);
    } catch (error) {
      Alert.alert("Could not accept request", error instanceof Error ? error.message : "Please try again");
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    if (requestId) dismissIncomingRequest(requestId, requestExpiryRef.current);
    router.back();
  };

  const pct = (secs / 30) * 100;
  const pickupCoordinate = request ? { latitude: request.latitude, longitude: request.longitude } : null;
  const rideDistanceKm = request ? distanceKm(request) : null;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0F1E" }}>
      <View style={StyleSheet.absoluteFill}>
        {pickupCoordinate ? (
          <LocationMap
            initialRegion={{
              ...pickupCoordinate,
              latitudeDelta: 0.04,
              longitudeDelta: 0.04,
            }}
            selectedCoordinate={pickupCoordinate}
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#1a2a4a" }]} />
        )}
      </View>

      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(10,15,30,0.72)" }]} />

      <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]}>
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
          }}
        >
          <View style={{ height: 5, backgroundColor: "#F2F2F7", width: "100%" }}>
            <View style={{ height: "100%", backgroundColor: "#FF3B30", width: `${pct}%` }} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "#FF3B30",
                    marginRight: 8,
                  }}
                />
                <Text style={{ fontSize: 13, fontWeight: "900", color: "#FF3B30", letterSpacing: 0.5 }}>
                  INCOMING RESCUE REQUEST
                </Text>
              </View>

              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#FF3B30",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: "900", color: "white" }}>{secs}</Text>
              </View>
            </View>

            <View style={{ backgroundColor: "#F2F2F7", borderRadius: 16, padding: 14, marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{ marginRight: 12 }}>
                  <ProfileAvatar storagePath={request?.passengerProfilePhotoPath ?? null} size={46} fallbackEmoji="P" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, fontWeight: "800", color: "#1C1C1E" }}>
                    {request?.passengerName ?? "Passenger"}
                  </Text>
                  <Text style={{ fontSize: 12, color: "#8E8E93", marginTop: 2 }}>
                    Passenger request
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: "#FFE5E5",
                    borderRadius: 20,
                    paddingVertical: 4,
                    paddingHorizontal: 10,
                    borderWidth: 1,
                    borderColor: "#FF3B30",
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: "800", color: "#FF3B30" }}>
                    {request?.urgency ?? "REQUEST"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#007AFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MapPin size={13} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#8E8E93" }}>Pickup</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E" }}>
                    {request?.pickupLabel ?? "Loading pickup..."}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#007AFF" }}>Nearby</Text>
              </View>

              <View style={{ width: 2, height: 18, backgroundColor: "#E5E5EA", marginLeft: 14, marginVertical: 4 }} />

              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: "#FF3B30",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MapPin size={13} color="white" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, color: "#8E8E93" }}>Destination</Text>
                  <Text style={{ fontSize: 14, fontWeight: "700", color: "#1C1C1E" }}>
                    {request?.destinationLabel ?? "Loading destination..."}
                  </Text>
                </View>
                <Text style={{ fontSize: 14, fontWeight: "800", color: "#FF3B30" }}>
                  {rideDistanceKm === null ? "" : `${rideDistanceKm.toFixed(1)} km`}
                </Text>
              </View>
            </View>

            <View
              style={{
                backgroundColor: "#FFE5E5",
                borderRadius: 12,
                paddingVertical: 9,
                paddingHorizontal: 13,
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 14,
              }}
            >
              <AlertCircle size={15} color="#FF3B30" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 13, color: "#FF3B30", fontWeight: "700" }}>
                {request?.urgency ?? "Rescue request"} - {request?.needsHelmet ? "Needs helmet" : "Helmet not requested"}
              </Text>
            </View>

            <TouchableOpacity
              onPress={handleAccept}
              disabled={accepting || !request}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: accepting || !request ? "#8E8E93" : "#34C759",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 9,
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
                {accepting ? "Accepting..." : "Accept Rescue"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecline}
              style={{ width: "100%", paddingVertical: 12, alignItems: "center", justifyContent: "center", marginBottom: 10 }}
            >
              <Text style={{ color: "#8E8E93", fontSize: 15, fontWeight: "700" }}>Decline</Text>
            </TouchableOpacity>
          </View>
          <HomeBar />
        </View>
      </View>
    </View>
  );
}

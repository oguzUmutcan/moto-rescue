import React, { useEffect, useState } from "react";
// Pure React Native implementation
import { useLocalSearchParams, useRouter } from "expo-router";
import { AlertCircle, MapPin, Star } from "lucide-react-native";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { auth } from "../../config/firebase";
import { rescueApi, RescueRequest } from "../../api/rescues";

// --- Minimal Map Background ---
function MapBg() {
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: "#1a2a4a", opacity: 0.5 },
      ]}
    >
      {/* Mock map lines */}
      <View
        style={{
          position: "absolute",
          left: 62,
          width: 10,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 146,
          width: 10,
          height: "100%",
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />
      <View
        style={{
          position: "absolute",
          top: 316,
          width: "100%",
          height: 10,
          backgroundColor: "rgba(255,255,255,0.1)",
        }}
      />
      {/* Mock User Location */}
      <View
        style={{
          position: "absolute",
          left: 190,
          top: 415,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "rgba(0,122,255,0.2)",
          marginLeft: -28,
          marginTop: -28,
        }}
      />
      <View
        style={{
          position: "absolute",
          left: 190,
          top: 415,
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#007AFF",
          marginLeft: -8,
          marginTop: -8,
        }}
      />
    </View>
  );
}

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

// --- The Exact Figma Biker Incoming Component ---
export default function IncomingRequestScreen() {
  const router = useRouter();
  const { requestId } = useLocalSearchParams<{ requestId: string }>();
  const [secs, setSecs] = useState(30);
  const [request, setRequest] = useState<RescueRequest | null>(null);

  useEffect(() => {
    if (!requestId) return;
    rescueApi.get(requestId)
      .then(setRequest)
      .catch((error) => {
        console.error("Could not load rescue request", error);
        router.back();
      });
  }, [requestId, router]);

  const handleAccept = async () => {
    const biker = auth.currentUser;
    if (!biker || !requestId) return;
    try {
      await rescueApi.accept(requestId);
      router.replace({ pathname: "/(biker)/navigation", params: { requestId } });
    } catch (error) {
      Alert.alert("Could not accept request", error instanceof Error ? error.message : "Please try again");
    }
  };

  const handleDecline = () => {
    // Go back to the Biker Dashboard
    router.back();
  };

  useEffect(() => {
    const t = setInterval(() => {
      setSecs((s) => {
        if (s <= 1) {
          clearInterval(t);
          router.back(); // Auto-decline when timer hits 0
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [router]);

  const pct = (secs / 30) * 100;

  return (
    <View style={{ flex: 1, backgroundColor: "#0A0F1E" }}>
      {/* Dark Map Background */}
      <View style={StyleSheet.absoluteFill}>
        <MapBg />
      </View>

      {/* Dark Overlay Tint */}
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(10,15,30,0.72)" },
        ]}
      />

      {/* Bottom Sheet Container */}
      <View style={[StyleSheet.absoluteFill, { justifyContent: "flex-end" }]}>
        <View
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            overflow: "hidden",
          }}
        >
          {/* Red Countdown bar */}
          <View
            style={{ height: 5, backgroundColor: "#F2F2F7", width: "100%" }}
          >
            <View
              style={{
                height: "100%",
                backgroundColor: "#FF3B30",
                width: `${pct}%`,
              }}
            />
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            {/* Header: Title and Timer */}
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
                    shadowColor: "#FF3B30",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.25,
                    shadowRadius: 3,
                    elevation: 2,
                    marginRight: 8,
                  }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "900",
                    color: "#FF3B30",
                    letterSpacing: 0.5,
                  }}
                >
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
                <Text
                  style={{ fontSize: 18, fontWeight: "900", color: "white" }}
                >
                  {secs}
                </Text>
              </View>
            </View>

            {/* Passenger Info Card */}
            <View
              style={{
                backgroundColor: "#F2F2F7",
                borderRadius: 16,
                padding: 14,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 23,
                    backgroundColor: "#007AFF",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <Text style={{ fontSize: 20 }}>🙋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: "800",
                      color: "#1C1C1E",
                    }}
                  >
                    {request?.passengerName ?? "Passenger"}
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 2,
                    }}
                  >
                    <Star size={11} color="#FF9500" fill="#FF9500" />
                    <Text
                      style={{ fontSize: 12, color: "#8E8E93", marginLeft: 4 }}
                    >
                      4.8 · First request
                    </Text>
                  </View>
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
                  <Text
                    style={{
                      fontSize: 11,
                      fontWeight: "800",
                      color: "#FF3B30",
                    }}
                  >
                    {request?.urgency ?? "URGENT"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Route Summary */}
            <View style={{ marginBottom: 12 }}>
              {/* Pickup Point */}
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
                  <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                    Pickup · 850 m away
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1C1C1E",
                    }}
                  >
                    {request ? `${request.latitude.toFixed(5)}, ${request.longitude.toFixed(5)}` : "Loading pickup..."}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#007AFF" }}
                >
                  ~3 min
                </Text>
              </View>

              {/* Connecting Line */}
              <View
                style={{
                  width: 2,
                  height: 18,
                  backgroundColor: "#E5E5EA",
                  marginLeft: 14,
                  marginVertical: 4,
                }}
              />

              {/* Destination Point */}
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
                  <Text style={{ fontSize: 11, color: "#8E8E93" }}>
                    Destination
                  </Text>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "700",
                      color: "#1C1C1E",
                    }}
                  >
                    {request?.destinationLabel ?? "Loading destination..."}
                  </Text>
                </View>
                <Text
                  style={{ fontSize: 14, fontWeight: "800", color: "#FF3B30" }}
                >
                  ~12 min
                </Text>
              </View>
            </View>

            {/* Urgency Banner */}
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
              <AlertCircle
                size={15}
                color="#FF3B30"
                style={{ marginRight: 8 }}
              />
              <Text
                style={{ fontSize: 13, color: "#FF3B30", fontWeight: "700" }}
              >
                {request?.urgency ?? "Urgent request"} · {request?.needsHelmet ? "Needs helmet" : "Helmet not requested"}
              </Text>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity
              onPress={handleAccept}
              style={{
                width: "100%",
                height: 56,
                borderRadius: 16,
                backgroundColor: "#34C759",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 9,
                shadowColor: "#34C759",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.4,
                shadowRadius: 20,
                elevation: 8,
              }}
            >
              <Text style={{ color: "white", fontSize: 18, fontWeight: "900" }}>
                ✓ Accept Rescue
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleDecline}
              style={{
                width: "100%",
                paddingVertical: 12,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: "#8E8E93", fontSize: 15, fontWeight: "700" }}
              >
                Decline
              </Text>
            </TouchableOpacity>
          </View>
          <HomeBar />
        </View>
      </View>
    </View>
  );
}

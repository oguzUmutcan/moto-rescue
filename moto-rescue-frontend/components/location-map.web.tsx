import React, { forwardRef, useImperativeHandle } from "react";
import { StyleSheet, Text, View } from "@/components/localized-native";
import type { LocationMapHandle, LocationMapProps } from "./location-map.types";

const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>((_props, ref) => {
  useImperativeHandle(ref, () => ({ animateToRegion: () => undefined }));
  return (
    <View style={[StyleSheet.absoluteFillObject, styles.map]}>
      <Text style={styles.label}>Map preview is available in the mobile app.</Text>
    </View>
  );
});

LocationMap.displayName = "LocationMap";
export default LocationMap;

const styles = StyleSheet.create({
  map: { alignItems: "center", backgroundColor: "#E5EBF0", justifyContent: "center" },
  label: { color: "#8E8E93", fontWeight: "600" },
});

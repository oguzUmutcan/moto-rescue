import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "@/components/localized-native";
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import type { LocationMapHandle, LocationMapProps } from "./location-map.types";

const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ initialRegion, selectedCoordinate, bikerCoordinate, onCoordinateSelect }, ref) => {
    const mapRef = useRef<MapView>(null);
    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration) => mapRef.current?.animateToRegion(region, duration),
    }));

    return (
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={initialRegion}
        onPress={(event: MapPressEvent) => onCoordinateSelect?.(event.nativeEvent.coordinate)}
      >
        {selectedCoordinate && <Marker coordinate={selectedCoordinate} pinColor="#FF3B30" />}
        {bikerCoordinate && <Marker coordinate={bikerCoordinate} title="Your biker" pinColor="#34C759" />}
      </MapView>
    );
  },
);

LocationMap.displayName = "LocationMap";
export default LocationMap;

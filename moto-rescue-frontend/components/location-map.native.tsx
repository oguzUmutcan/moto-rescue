import React, { forwardRef, useImperativeHandle, useRef } from "react";
import { StyleSheet } from "react-native";
import MapView, { MapPressEvent, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import type { LocationMapHandle, LocationMapProps } from "./location-map.types";

const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || "";

const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ initialRegion, selectedCoordinate, bikerCoordinate, routeOrigin, routeDestination, onEtaChange, onCoordinateSelect }, ref) => {
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
        {routeOrigin && routeDestination && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={routeOrigin}
            destination={routeDestination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#007AFF"
            onReady={(result) => {
              if (onEtaChange) onEtaChange(result.duration, result.distance);
            }}
          />
        )}
      </MapView>
    );
  },
);

LocationMap.displayName = "LocationMap";
export default LocationMap;

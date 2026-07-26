import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import MapView, { MapPressEvent, Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { directionsApi } from "@/api/directions";
import { decodePolyline } from "@/utils/polyline";
import type { LocationMapHandle, LocationMapProps } from "./location-map.types";

const LocationMap = forwardRef<LocationMapHandle, LocationMapProps>(
  ({ initialRegion, selectedCoordinate, bikerCoordinate, routeOrigin, routeDestination, onEtaChange, onCoordinateSelect }, ref) => {
    const mapRef = useRef<MapView>(null);
    const onEtaChangeRef = useRef(onEtaChange);
    const [routeCoordinates, setRouteCoordinates] = useState<
      { latitude: number; longitude: number }[]
    >([]);
    useImperativeHandle(ref, () => ({
      animateToRegion: (region, duration) => mapRef.current?.animateToRegion(region, duration),
    }));

    onEtaChangeRef.current = onEtaChange;
    const originLatitude = routeOrigin?.latitude;
    const originLongitude = routeOrigin?.longitude;
    const destinationLatitude = routeDestination?.latitude;
    const destinationLongitude = routeDestination?.longitude;

    useEffect(() => {
      if (
        originLatitude == null
        || originLongitude == null
        || destinationLatitude == null
        || destinationLongitude == null
      ) {
        setRouteCoordinates([]);
        return;
      }

      let active = true;
      void directionsApi.route(
        { latitude: originLatitude, longitude: originLongitude },
        { latitude: destinationLatitude, longitude: destinationLongitude },
      ).then((route) => {
        if (!active) return;
        setRouteCoordinates(decodePolyline(route.encodedPolyline));
        onEtaChangeRef.current?.(route.durationMinutes, route.distanceKm);
      }).catch((error) => {
        if (active) {
          setRouteCoordinates([]);
          console.warn("Could not load route geometry", error);
        }
      });

      return () => {
        active = false;
      };
    }, [destinationLatitude, destinationLongitude, originLatitude, originLongitude]);

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
        {routeCoordinates.length > 1 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="#007AFF"
          />
        )}
      </MapView>
    );
  },
);

LocationMap.displayName = "LocationMap";
export default LocationMap;

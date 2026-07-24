export type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

export type LocationMapHandle = {
  animateToRegion: (region: MapRegion, duration?: number) => void;
};

export type LocationMapProps = {
  initialRegion: MapRegion;
  selectedCoordinate?: { latitude: number; longitude: number } | null;
  bikerCoordinate?: { latitude: number; longitude: number } | null;
  routeOrigin?: { latitude: number; longitude: number } | null;
  routeDestination?: { latitude: number; longitude: number } | null;
  onEtaChange?: (etaMinutes: number, distanceKm: number) => void;
  onCoordinateSelect?: (coordinate: { latitude: number; longitude: number }) => void;
};

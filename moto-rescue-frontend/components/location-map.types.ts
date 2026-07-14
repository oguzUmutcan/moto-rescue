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
  onCoordinateSelect?: (coordinate: { latitude: number; longitude: number }) => void;
};

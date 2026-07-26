import { apiRequest } from "./client";

type Coordinates = {
  latitude: number;
  longitude: number;
};

export type RouteResult = {
  encodedPolyline: string;
  distanceKm: number;
  durationMinutes: number;
};

export const directionsApi = {
  route: (origin: Coordinates, destination: Coordinates) =>
    apiRequest<RouteResult>("/api/directions", {
      method: "POST",
      body: JSON.stringify({
        originLatitude: origin.latitude,
        originLongitude: origin.longitude,
        destinationLatitude: destination.latitude,
        destinationLongitude: destination.longitude,
      }),
    }),
};

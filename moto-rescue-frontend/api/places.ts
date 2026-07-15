import { apiRequest } from "./client";

export type PlacePrediction = {
  placeId: string;
  label: string;
  details: string;
  distanceMeters: number | null;
};

export type PlaceDetails = {
  placeId: string;
  label: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
};

export const placesApi = {
  autocomplete: (input: string, origin: { latitude: number; longitude: number } | null, sessionToken: string) =>
    apiRequest<{ predictions: PlacePrediction[] }>("/api/places/autocomplete", {
      method: "POST",
      body: JSON.stringify({ input, latitude: origin?.latitude, longitude: origin?.longitude, sessionToken }),
    }),
  details: (placeId: string, sessionToken: string) =>
    apiRequest<PlaceDetails>(`/api/places/${encodeURIComponent(placeId)}?sessionToken=${encodeURIComponent(sessionToken)}`),
};

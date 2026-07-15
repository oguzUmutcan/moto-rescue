import * as Location from "expo-location";

export async function getAvailablePosition(maxLastKnownAgeMs = 120_000) {
  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Location services are disabled.");
  }

  try {
    return await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
  } catch (currentError) {
    const lastKnown = await Location.getLastKnownPositionAsync({
      maxAge: maxLastKnownAgeMs,
      requiredAccuracy: 1_000,
    });
    if (lastKnown) return lastKnown;
    throw currentError;
  }
}

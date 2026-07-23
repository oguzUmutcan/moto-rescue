import * as Location from "expo-location";

export async function getAvailablePosition(maxLastKnownAgeMs = 120_000) {
  const currentPermission = await Location.getForegroundPermissionsAsync();
  const finalPermission = currentPermission.status === "granted"
    ? currentPermission
    : currentPermission.canAskAgain
      ? await Location.requestForegroundPermissionsAsync()
      : currentPermission;

  if (finalPermission.status !== "granted") {
    throw new Error("Location permission is required. Enable it in Android Settings and try again.");
  }

  const servicesEnabled = await Location.hasServicesEnabledAsync();
  if (!servicesEnabled) {
    throw new Error("Location services are disabled. Turn on device location and try again.");
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

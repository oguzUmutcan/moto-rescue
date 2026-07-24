import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import { userApi } from '../api/users';
import { rescueApi } from '../api/rescues';

export const LOCATION_TASK_NAME = 'background-location-task';

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error("Background Location Task Error:", error.message);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    if (locations && locations.length > 0) {
      const location = locations[0];
      try {
        // We update the general online location
        await userApi.updateLocation(location.coords.latitude, location.coords.longitude);
        
        // Check if there is an active rescue, and if so, update the biker location on the rescue
        const activeRescue = await rescueApi.active();
        if (activeRescue) {
          await rescueApi.updateBikerLocation(activeRescue.id, location.coords.latitude, location.coords.longitude);
        }
      } catch (err) {
        // Might fail if network is down or user is logged out, ignore silently in background
      }
    }
  }
});

export const startBackgroundLocationTracking = async () => {
  const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
  if (foregroundStatus !== 'granted') {
    return false;
  }
  
  const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
  if (backgroundStatus !== 'granted') {
    return false;
  }

  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (!isRegistered) {
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.High,
      distanceInterval: 10, // update every 10 meters
      deferredUpdatesInterval: 5000, // wait at least 5 seconds before updating
      foregroundService: {
        notificationTitle: "MotoRescue is active",
        notificationBody: "Sharing your location to match rescues.",
        notificationColor: "#FF9500",
      },
      showsBackgroundLocationIndicator: true,
      pausesUpdatesAutomatically: false,
    });
  }
  return true;
};

export const stopBackgroundLocationTracking = async () => {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(LOCATION_TASK_NAME);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  }
};

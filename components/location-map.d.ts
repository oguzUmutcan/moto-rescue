import type React from "react";
import type { LocationMapHandle, LocationMapProps } from "./location-map.types";

declare const LocationMap: React.ForwardRefExoticComponent<
  LocationMapProps & React.RefAttributes<LocationMapHandle>
>;

export default LocationMap;

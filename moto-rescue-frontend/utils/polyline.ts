type Coordinates = {
  latitude: number;
  longitude: number;
};

export function decodePolyline(encoded: string): Coordinates[] {
  const coordinates: Coordinates[] = [];
  let latitude = 0;
  let longitude = 0;
  let index = 0;

  while (index < encoded.length) {
    const latitudeDelta = decodeValue(encoded, index);
    index = latitudeDelta.nextIndex;
    const longitudeDelta = decodeValue(encoded, index);
    index = longitudeDelta.nextIndex;
    latitude += latitudeDelta.value;
    longitude += longitudeDelta.value;
    coordinates.push({
      latitude: latitude / 100_000,
      longitude: longitude / 100_000,
    });
  }

  return coordinates;
}

function decodeValue(encoded: string, startIndex: number) {
  let result = 0;
  let shift = 0;
  let index = startIndex;
  let byte: number;

  do {
    if (index >= encoded.length) {
      throw new Error("Invalid encoded polyline");
    }
    byte = encoded.charCodeAt(index) - 63;
    index += 1;
    result |= (byte & 0x1f) << shift;
    shift += 5;
  } while (byte >= 0x20);

  return {
    value: result & 1 ? ~(result >> 1) : result >> 1,
    nextIndex: index,
  };
}

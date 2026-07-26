import { decodePolyline } from "@/utils/polyline";

describe("Google encoded polylines", () => {
  test("decodes the documented sample geometry", () => {
    expect(decodePolyline("_p~iF~ps|U_ulLnnqC_mqNvxq`@")).toEqual([
      { latitude: 38.5, longitude: -120.2 },
      { latitude: 40.7, longitude: -120.95 },
      { latitude: 43.252, longitude: -126.453 },
    ]);
  });

  test("rejects truncated geometry", () => {
    expect(() => decodePolyline("_p~iF")).toThrow("Invalid encoded polyline");
  });
});

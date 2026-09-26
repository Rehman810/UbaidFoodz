export type CheckoutLocation = {
  latitude: number;
  longitude: number;
  accuracy?: number;
};

/** Request browser location at checkout; returns null if denied or unavailable. */
export function getCheckoutLocation(timeoutMs = 8000): Promise<CheckoutLocation | null> {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 60_000 }
    );
  });
}

export function mapsLink(lat: number | string, lng: number | string) {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

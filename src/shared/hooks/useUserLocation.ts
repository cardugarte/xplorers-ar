import { Accuracy, getCurrentPositionAsync, requestForegroundPermissionsAsync } from "expo-location";
import { useCallback, useState } from "react";

interface UserLocation {
  lat: number;
  lng: number;
}

interface UseUserLocationReturn {
  location: UserLocation | null;
  loading: boolean;
  error: string | null;
  requestLocation: () => Promise<UserLocation | null>;
}

export function useUserLocation(): UseUserLocationReturn {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async (): Promise<UserLocation | null> => {
    setLoading(true);
    setError(null);

    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de ubicación denegado");
        setLoading(false);
        return null;
      }

      const position = await getCurrentPositionAsync({
        accuracy: Accuracy.Balanced,
      });

      const coords: UserLocation = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      setLocation(coords);
      setLoading(false);
      return coords;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error obteniendo ubicación";
      setError(message);
      setLoading(false);
      return null;
    }
  }, []);

  return { location, loading, error, requestLocation };
}

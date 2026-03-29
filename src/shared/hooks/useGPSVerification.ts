import { Accuracy, getCurrentPositionAsync, requestForegroundPermissionsAsync } from "expo-location";
import { useCallback, useState } from "react";

const EARTH_RADIUS_KM = 6371;
const DEFAULT_PROXIMITY_KM = 0.5; // 500m

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface VerificationResult {
  isNear: boolean;
  distanceKm: number;
  userLat: number;
  userLng: number;
  timestamp: number;
}

interface UseGPSVerificationReturn {
  result: VerificationResult | null;
  isVerifying: boolean;
  error: string | null;
  verify: () => Promise<VerificationResult | null>;
}

export function useGPSVerification(
  targetLat: number,
  targetLng: number,
  proximityKm = DEFAULT_PROXIMITY_KM,
): UseGPSVerificationReturn {
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const verify = useCallback(async (): Promise<VerificationResult | null> => {
    setIsVerifying(true);
    setError(null);

    try {
      const { status } = await requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setError("Permiso de ubicación denegado");
        setIsVerifying(false);
        return null;
      }

      const location = await getCurrentPositionAsync({ accuracy: Accuracy.High });
      const distanceKm = haversineDistance(
        location.coords.latitude,
        location.coords.longitude,
        targetLat,
        targetLng,
      );

      const verification: VerificationResult = {
        isNear: distanceKm <= proximityKm,
        distanceKm,
        userLat: location.coords.latitude,
        userLng: location.coords.longitude,
        timestamp: Date.now(),
      };

      setResult(verification);
      setIsVerifying(false);
      return verification;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al obtener ubicación";
      setError(message);
      setIsVerifying(false);
      return null;
    }
  }, [targetLat, targetLng, proximityKm]);

  return { result, isVerifying, error, verify };
}

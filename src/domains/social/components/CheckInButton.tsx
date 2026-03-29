import { MapPin } from "lucide-react-native";
import { ActivityIndicator, Alert, Pressable, Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import { useUserLocation } from "@/src/shared/hooks/useUserLocation";

import { useCheckIn, canCheckIn } from "../useCheckIns";

interface CheckInButtonProps {
  campingId: string;
  campingName: string;
  campingSlug: string;
  venuePubkey: string;
  geohash: string;
  lat: number;
  lng: number;
}

/**
 * GPS-verified check-in button for the camping detail screen.
 *
 * Flow:
 * 1. User taps button
 * 2. Request GPS location
 * 3. Verify proximity (<= 500m)
 * 4. Publish check-in events on Nostr
 */
export function CheckInButton({
  campingId,
  campingName,
  campingSlug,
  venuePubkey,
  geohash,
  lat,
  lng,
}: CheckInButtonProps) {
  const dark = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;

  const { requestLocation, loading: locationLoading } = useUserLocation();
  const checkIn = useCheckIn();

  const onCooldown = !canCheckIn(campingId);
  const isLoading = locationLoading || checkIn.isPending;

  async function handleCheckIn() {
    if (onCooldown) {
      Alert.alert(
        "Check-in reciente",
        "Ya hiciste check-in en este camping hace menos de 1 hora.",
      );
      return;
    }

    const location = await requestLocation();
    if (!location) {
      Alert.alert(
        "Ubicación necesaria",
        "Necesitamos tu ubicación para verificar que estás en el camping.",
      );
      return;
    }

    checkIn.mutate(
      {
        campingId,
        campingName,
        campingSlug,
        venuePubkey,
        geohash,
        lat,
        lng,
        userLat: location.lat,
        userLng: location.lng,
      },
      {
        onSuccess: () => {
          Alert.alert("Check-in exitoso", `Registraste tu visita en ${campingName}`);
        },
        onError: (error) => {
          Alert.alert("No se pudo hacer check-in", error.message);
        },
      },
    );
  }

  return (
    <Pressable onPress={handleCheckIn} disabled={isLoading}>
      <GlassView
        level="andes"
        className="flex-row items-center justify-center gap-2 rounded-glass-sm py-3"
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={textColors.brand} />
        ) : (
          <>
            <MapPin size={18} color={textColors.brand} />
            <Text
              className="font-label text-sm uppercase tracking-wide"
              style={{ color: textColors.brand }}
            >
              {onCooldown ? "Check-in reciente" : "Check-in"}
            </Text>
          </>
        )}
      </GlassView>
    </Pressable>
  );
}

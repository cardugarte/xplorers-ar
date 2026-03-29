import { useLocalSearchParams, useRouter, Stack } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import { useCamping } from "@/src/domains/camping/hooks";
import { useCreateReservation } from "@/src/domains/reservations/hooks";
import { DateRangePicker } from "@/src/domains/reservations/components/DateRangePicker";
import { GuestCounter } from "@/src/domains/reservations/components/GuestCounter";
import { BookingSummary } from "@/src/domains/reservations/components/BookingSummary";

export default function ReserveScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  const { data: camping, isPending: campingLoading } = useCamping(id!);
  const { mutate: createReservation, isPending: isSubmitting } =
    useCreateReservation();

  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState(1);
  const [notes, setNotes] = useState("");

  const isValid = checkIn !== null && checkOut !== null;
  const borderColor = dark ? "#36424d" : "#e3eaef";

  function handleSubmit() {
    if (!checkIn || !checkOut) return;

    createReservation(
      {
        camping_id: id!,
        check_in: checkIn.toISOString().split("T")[0]!,
        check_out: checkOut.toISOString().split("T")[0]!,
        guests,
        notes: notes.trim() || undefined,
      },
      {
        onSuccess: () => {
          Alert.alert(
            "¡Reserva enviada!",
            "Tu reserva quedó en estado pendiente. El camping te va a confirmar a la brevedad.",
            [{ text: "OK", onPress: () => router.back() }],
          );
        },
        onError: (error) => {
          const message =
            error instanceof Error
              ? error.message
              : "Ocurrió un error al enviar la reserva.";
          Alert.alert("Error", message);
        },
      },
    );
  }

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View className="flex-1 bg-[#fafbfc] dark:bg-[#1e2730]">
          {/* Header */}
          <View
            className="flex-row items-center gap-2 px-4 pb-2"
            style={{ paddingTop: insets.top + 8 }}
          >
            <Pressable onPress={() => router.back()} hitSlop={8}>
              <View className="rounded-full bg-[#e3eaef] p-1.5 dark:bg-[#36424d]">
                <ChevronLeft size={20} color={colors.primary} />
              </View>
            </Pressable>
            <Text
              className="flex-1 font-heading text-lg"
              style={{ color: colors.primary }}
              numberOfLines={1}
            >
              {campingLoading ? "Reservar" : (camping?.name ?? "Reservar")}
            </Text>
          </View>

          {campingLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={colors.brand} />
            </View>
          ) : (
            <ScrollView
              className="flex-1"
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerClassName="px-4 pb-8 gap-5"
              contentContainerStyle={{ paddingTop: 12 }}
            >
              {/* Step label */}
              <Text
                className="font-label text-xs uppercase tracking-wide"
                style={{ color: colors.secondary }}
              >
                Seleccioná tus fechas
              </Text>

              {/* Date picker */}
              <DateRangePicker
                checkIn={checkIn}
                checkOut={checkOut}
                onCheckInChange={(date) => {
                  setCheckIn(date);
                  // Reset checkout if it's before the new check-in
                  if (checkOut && checkOut <= date) setCheckOut(null);
                }}
                onCheckOutChange={setCheckOut}
              />

              {/* Guest counter */}
              <GuestCounter value={guests} onChange={setGuests} />

              {/* Notes */}
              <GlassView
                level="soft"
                className="rounded-glass-sm p-3"
                style={{ borderWidth: 1, borderColor }}
              >
                <Text
                  className="font-label text-xs mb-2"
                  style={{ color: colors.secondary }}
                >
                  Notas (opcional)
                </Text>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Ej: llegamos tarde, necesitamos lugar para carpa grande…"
                  placeholderTextColor={colors.secondary}
                  multiline
                  numberOfLines={3}
                  maxLength={500}
                  className="font-body text-sm"
                  style={{
                    color: colors.primary,
                    minHeight: 64,
                    textAlignVertical: "top",
                  }}
                />
              </GlassView>

              {/* Booking summary — shown only when dates are selected */}
              {checkIn && checkOut && camping && (
                <>
                  <Text
                    className="font-label text-xs uppercase tracking-wide"
                    style={{ color: colors.secondary }}
                  >
                    Resumen de reserva
                  </Text>
                  <BookingSummary
                    campingName={camping.name}
                    checkIn={checkIn}
                    checkOut={checkOut}
                    guests={guests}
                    prices={camping.prices}
                  />
                </>
              )}

              {/* Spacer so footer doesn't overlap content */}
              <View style={{ height: 100 }} />
            </ScrollView>
          )}

          {/* Footer CTA */}
          <View
            className="border-t border-[#e3eaef] px-4 py-3 dark:border-[#36424d]"
            style={{ paddingBottom: insets.bottom + 12 }}
          >
            <Pressable
              onPress={handleSubmit}
              disabled={!isValid || isSubmitting}
              className="items-center justify-center rounded-glass-sm py-4"
              style={{
                backgroundColor:
                  isValid && !isSubmitting
                    ? dark
                      ? "#2d8653"
                      : "#175533"
                    : borderColor,
              }}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text
                  className="font-label text-sm uppercase tracking-wide"
                  style={{
                    color: isValid ? "#fff" : colors.secondary,
                  }}
                >
                  {isValid ? "Confirmar reserva" : "Seleccioná las fechas"}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

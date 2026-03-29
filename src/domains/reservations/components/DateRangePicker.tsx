import { Calendar } from "lucide-react-native";
import { useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  useColorScheme,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

interface DateRangePickerProps {
  checkIn: Date | null;
  checkOut: Date | null;
  onCheckInChange: (date: Date) => void;
  onCheckOutChange: (date: Date) => void;
  minDate?: Date;
}

type PickerMode = "check_in" | "check_out" | null;

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const WEEKDAYS = ["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sa"];

function formatDate(date: Date | null): string {
  if (!date) return "Seleccionar";
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface CalendarGridProps {
  year: number;
  month: number;
  checkIn: Date | null;
  checkOut: Date | null;
  minDate: Date;
  mode: PickerMode;
  onSelectDate: (date: Date) => void;
  colors: typeof glassText.light | typeof glassText.dark;
  dark: boolean;
}

function CalendarGrid({
  year,
  month,
  checkIn,
  checkOut,
  minDate,
  mode,
  onSelectDate,
  colors,
  dark,
}: CalendarGridProps) {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  // Pad to complete last row
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View className="mt-3">
      {/* Weekday headers */}
      <View className="flex-row mb-1">
        {WEEKDAYS.map((wd) => (
          <View key={wd} className="flex-1 items-center">
            <Text
              className="font-label text-xs"
              style={{ color: colors.secondary }}
            >
              {wd}
            </Text>
          </View>
        ))}
      </View>

      {/* Day rows */}
      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} className="flex-row mb-1">
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            if (!day) {
              return <View key={`empty-${colIdx}`} className="flex-1 aspect-square" />;
            }

            const date = startOfDay(new Date(year, month, day));
            const isBeforeMin = date < startOfDay(minDate);
            const isCheckIn = checkIn ? isSameDay(date, checkIn) : false;
            const isCheckOut = checkOut ? isSameDay(date, checkOut) : false;
            const isInRange =
              checkIn &&
              checkOut &&
              date > startOfDay(checkIn) &&
              date < startOfDay(checkOut);
            const isDisabled =
              isBeforeMin ||
              (mode === "check_out" && checkIn ? date <= startOfDay(checkIn) : false);
            const isSelected = isCheckIn || isCheckOut;

            return (
              <Pressable
                key={day}
                className="flex-1 aspect-square items-center justify-center mx-0.5 rounded-full"
                style={{
                  backgroundColor: isSelected
                    ? dark ? "#2d8653" : "#175533"
                    : isInRange
                    ? dark ? "rgba(45,134,83,0.18)" : "rgba(23,85,51,0.10)"
                    : "transparent",
                  opacity: isDisabled ? 0.3 : 1,
                }}
                disabled={isDisabled}
                onPress={() => onSelectDate(date)}
              >
                <Text
                  className="font-body text-sm"
                  style={{
                    color: isSelected
                      ? "#fff"
                      : isInRange
                      ? colors.brand
                      : colors.primary,
                    fontWeight: isSelected ? "700" : "400",
                  }}
                >
                  {day}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

export function DateRangePicker({
  checkIn,
  checkOut,
  onCheckInChange,
  onCheckOutChange,
  minDate = new Date(),
}: DateRangePickerProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const insets = useSafeAreaInsets();

  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const today = startOfDay(minDate);

  // Calendar navigation state
  const [calYear, setCalYear] = useState(() => today.getFullYear());
  const [calMonth, setCalMonth] = useState(() => today.getMonth());

  function openPicker(mode: PickerMode) {
    const ref = mode === "check_out" && checkIn ? checkIn : today;
    setCalYear(ref.getFullYear());
    setCalMonth(ref.getMonth());
    setPickerMode(mode);
  }

  function handleSelectDate(date: Date) {
    if (pickerMode === "check_in") {
      onCheckInChange(date);
      // Auto-advance to check_out
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      setCalYear(nextDay.getFullYear());
      setCalMonth(nextDay.getMonth());
      setPickerMode("check_out");
    } else {
      onCheckOutChange(date);
      setPickerMode(null);
    }
  }

  function prevMonth() {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  }

  const bgColor = dark ? "#1e2730" : "#fafbfc";
  const borderColor = dark ? "#36424d" : "#e3eaef";

  return (
    <View className="gap-3">
      {/* Date trigger buttons */}
      <View className="flex-row gap-3">
        {/* Check-in */}
        <Pressable className="flex-1" onPress={() => openPicker("check_in")}>
          <GlassView
            level="soft"
            className="rounded-glass-sm p-3"
            style={{
              borderWidth: 1.5,
              borderColor: pickerMode === "check_in" ? colors.brand : borderColor,
            }}
          >
            <Text className="font-label text-xs mb-1" style={{ color: colors.secondary }}>
              Llegada
            </Text>
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color={colors.brand} />
              <Text className="font-body text-sm" style={{ color: colors.primary }}>
                {formatDate(checkIn)}
              </Text>
            </View>
          </GlassView>
        </Pressable>

        {/* Check-out */}
        <Pressable className="flex-1" onPress={() => openPicker("check_out")}>
          <GlassView
            level="soft"
            className="rounded-glass-sm p-3"
            style={{
              borderWidth: 1.5,
              borderColor: pickerMode === "check_out" ? colors.brand : borderColor,
            }}
          >
            <Text className="font-label text-xs mb-1" style={{ color: colors.secondary }}>
              Salida
            </Text>
            <View className="flex-row items-center gap-2">
              <Calendar size={14} color={colors.brand} />
              <Text className="font-body text-sm" style={{ color: colors.primary }}>
                {formatDate(checkOut)}
              </Text>
            </View>
          </GlassView>
        </Pressable>
      </View>

      {/* Calendar Modal */}
      <Modal
        visible={pickerMode !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setPickerMode(null)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
          onPress={() => setPickerMode(null)}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View
              style={{
                backgroundColor: bgColor,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                paddingBottom: insets.bottom + 16,
                paddingTop: 16,
                paddingHorizontal: 16,
              }}
            >
              {/* Modal header */}
              <View className="flex-row items-center justify-between mb-2">
                <Text className="font-heading text-base" style={{ color: colors.primary }}>
                  {pickerMode === "check_in" ? "Fecha de llegada" : "Fecha de salida"}
                </Text>
                <Pressable onPress={() => setPickerMode(null)}>
                  <Text className="font-label text-sm" style={{ color: colors.brand }}>
                    Cerrar
                  </Text>
                </Pressable>
              </View>

              {/* Month navigation */}
              <View className="flex-row items-center justify-between mt-2">
                <Pressable onPress={prevMonth} hitSlop={8}>
                  <Text className="font-label text-lg" style={{ color: colors.brand }}>‹</Text>
                </Pressable>
                <Text className="font-heading text-base" style={{ color: colors.primary }}>
                  {MONTHS[calMonth]} {calYear}
                </Text>
                <Pressable onPress={nextMonth} hitSlop={8}>
                  <Text className="font-label text-lg" style={{ color: colors.brand }}>›</Text>
                </Pressable>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <CalendarGrid
                  year={calYear}
                  month={calMonth}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  minDate={today}
                  mode={pickerMode}
                  onSelectDate={handleSelectDate}
                  colors={colors}
                  dark={dark}
                />
              </ScrollView>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

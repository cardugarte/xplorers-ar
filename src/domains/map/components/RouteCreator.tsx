import { MapPin, Navigation, FileText, X, Plus, Check } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";
import type { Camping } from "@/src/domains/camping/types";
import { parseGPX, type GPXWaypoint } from "../utils/gpx-parser";
import { usePublishRoute } from "../useUserRoutes";

interface RouteCreatorProps {
  /** Pre-loaded campings from the catalog to select from. */
  availableCampings: Camping[];
  onSuccess?: () => void;
  onCancel?: () => void;
}

/**
 * Form component to create and publish a user-generated camping route.
 *
 * Lets the user:
 *   - Enter name + description
 *   - Select campings from the catalog
 *   - Paste GPX XML (optional) to import waypoints
 *   - Publish to Nostr as kind:30402
 */
export function RouteCreator({
  availableCampings,
  onSuccess,
  onCancel,
}: RouteCreatorProps) {
  const dark = useColorScheme() === "dark";
  const text = glassText[dark ? "dark" : "light"];

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [gpxText, setGpxText] = useState("");
  const [waypoints, setWaypoints] = useState<GPXWaypoint[]>([]);
  const [gpxExpanded, setGpxExpanded] = useState(false);

  const publishRoute = usePublishRoute();

  function toggleCamping(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleParseGPX() {
    if (!gpxText.trim()) return;
    const result = parseGPX(gpxText);
    if (result.error) {
      Alert.alert("Error GPX", result.error);
      return;
    }
    if (result.waypoints.length === 0) {
      Alert.alert("GPX vacío", "No se encontraron waypoints en el archivo.");
      return;
    }
    setWaypoints(result.waypoints);
    Alert.alert(
      "GPX importado",
      `Se cargaron ${result.waypoints.length} waypoints${result.trackName ? ` de "${result.trackName}"` : ""}.`,
    );
  }

  function handleClearGPX() {
    setGpxText("");
    setWaypoints([]);
  }

  async function handlePublish() {
    if (!name.trim()) {
      Alert.alert("Nombre requerido", "Ingresá un nombre para la ruta.");
      return;
    }
    if (selectedIds.size === 0 && waypoints.length === 0) {
      Alert.alert(
        "Ruta vacía",
        "Seleccioná al menos un camping o importá waypoints GPX.",
      );
      return;
    }

    try {
      await publishRoute.mutateAsync({
        name: name.trim(),
        description: description.trim(),
        campingIds: Array.from(selectedIds),
        waypoints,
      });
      Alert.alert(
        "Ruta publicada",
        "Tu ruta fue compartida en Nostr exitosamente.",
      );
      onSuccess?.();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error al publicar la ruta.";
      Alert.alert("Error", message);
    }
  }

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <GlassView level="ultra" className="mx-4 mt-4 rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Navigation size={20} color={text.brand} />
            <Text
              className="font-heading text-lg"
              style={{ color: text.primary }}
            >
              Crear ruta
            </Text>
          </View>
          {onCancel && (
            <TouchableOpacity onPress={onCancel} hitSlop={8}>
              <X size={20} color={text.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </GlassView>

      {/* Name + description */}
      <GlassView level="mid" className="mx-4 mt-3 rounded-2xl p-4 gap-3">
        <Text className="font-label text-sm" style={{ color: text.secondary }}>
          NOMBRE DE LA RUTA
        </Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Ej: Circuito Andino Patagónico"
          placeholderTextColor={text.secondary}
          style={{ color: text.primary }}
          className="font-body text-base py-2 border-b border-white/10"
          maxLength={80}
        />

        <Text
          className="font-label text-sm mt-2"
          style={{ color: text.secondary }}
        >
          DESCRIPCIÓN
        </Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Contá de qué trata la ruta..."
          placeholderTextColor={text.secondary}
          style={{ color: text.primary }}
          className="font-body text-base py-2"
          multiline
          numberOfLines={3}
          maxLength={500}
        />
      </GlassView>

      {/* Camping selector */}
      <GlassView level="mid" className="mx-4 mt-3 rounded-2xl p-4">
        <View className="flex-row items-center gap-2 mb-3">
          <MapPin size={16} color={text.brand} />
          <Text className="font-label text-sm" style={{ color: text.secondary }}>
            CAMPINGS ({selectedIds.size} seleccionados)
          </Text>
        </View>

        {availableCampings.length === 0 ? (
          <Text className="font-body text-sm" style={{ color: text.secondary }}>
            No hay campings disponibles.
          </Text>
        ) : (
          <View className="gap-2">
            {availableCampings.map((camping) => {
              const selected = selectedIds.has(camping.id);
              return (
                <TouchableOpacity
                  key={camping.id}
                  onPress={() => toggleCamping(camping.id)}
                  activeOpacity={0.7}
                >
                  <GlassView
                    level={selected ? "andes" : "soft"}
                    className="rounded-xl p-3 flex-row items-center justify-between"
                  >
                    <View className="flex-1 mr-3">
                      <Text
                        className="font-body text-sm font-medium"
                        style={{ color: text.primary }}
                        numberOfLines={1}
                      >
                        {camping.name}
                      </Text>
                      <Text
                        className="font-label text-xs mt-0.5"
                        style={{ color: text.secondary }}
                      >
                        {camping.province}
                      </Text>
                    </View>
                    {selected && (
                      <Check size={16} color={text.brand} />
                    )}
                  </GlassView>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </GlassView>

      {/* GPX import */}
      <GlassView level="mid" className="mx-4 mt-3 rounded-2xl p-4">
        <TouchableOpacity
          onPress={() => setGpxExpanded((v) => !v)}
          className="flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center gap-2">
            <FileText size={16} color={text.secondary} />
            <Text
              className="font-label text-sm"
              style={{ color: text.secondary }}
            >
              IMPORTAR GPX (opcional)
            </Text>
          </View>
          <View className="flex-row items-center gap-2">
            {waypoints.length > 0 && (
              <Text
                className="font-label text-xs"
                style={{ color: text.brand }}
              >
                {waypoints.length} waypoints
              </Text>
            )}
            <Plus
              size={16}
              color={text.secondary}
              style={{
                transform: [{ rotate: gpxExpanded ? "45deg" : "0deg" }],
              }}
            />
          </View>
        </TouchableOpacity>

        {gpxExpanded && (
          <View className="mt-3 gap-3">
            <TextInput
              value={gpxText}
              onChangeText={setGpxText}
              placeholder="Pegá el contenido del archivo .gpx aquí..."
              placeholderTextColor={text.secondary}
              style={{ color: text.primary, height: 100, textAlignVertical: "top" }}
              className="font-body text-xs p-2 rounded-lg bg-black/5 dark:bg-white/5"
              multiline
            />
            <View className="flex-row gap-2">
              <TouchableOpacity
                onPress={handleParseGPX}
                className="flex-1 rounded-xl py-2 items-center"
                style={{
                  backgroundColor: dark
                    ? "rgba(80,164,114,0.25)"
                    : "rgba(30,100,60,0.15)",
                }}
                activeOpacity={0.7}
              >
                <Text className="font-label text-sm" style={{ color: text.brand }}>
                  Parsear GPX
                </Text>
              </TouchableOpacity>
              {waypoints.length > 0 && (
                <TouchableOpacity
                  onPress={handleClearGPX}
                  className="px-4 rounded-xl py-2 items-center"
                  style={{
                    backgroundColor: dark
                      ? "rgba(255,100,80,0.15)"
                      : "rgba(180,50,20,0.08)",
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    className="font-label text-sm"
                    style={{ color: dark ? "#ff8d2a" : "#b03807" }}
                  >
                    Limpiar
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </GlassView>

      {/* Publish button */}
      <View className="mx-4 mt-4">
        <TouchableOpacity
          onPress={handlePublish}
          disabled={publishRoute.isPending}
          activeOpacity={0.8}
          className="rounded-2xl py-4 items-center justify-center"
          style={{
            backgroundColor: dark
              ? "rgba(80,164,114,0.4)"
              : "rgba(30,100,60,0.85)",
            opacity: publishRoute.isPending ? 0.6 : 1,
          }}
        >
          {publishRoute.isPending ? (
            <ActivityIndicator color={dark ? "#daf0ff" : "#fff"} />
          ) : (
            <Text
              className="font-heading text-base"
              style={{ color: dark ? "#daf0ff" : "#fff" }}
            >
              Publicar en Nostr
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

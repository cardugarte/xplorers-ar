import { Send } from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText, semantic } from "@/src/shared/theme/tokens";

import { StarRating } from "./StarRating";

interface ReviewFormProps {
  /** Called when the user submits the review */
  onSubmit: (rating: number, content: string) => void;
  /** Whether the mutation is in progress */
  isPending?: boolean;
}

/**
 * Form for writing a camping review: star rating + text input + submit.
 */
export function ReviewForm({ onSubmit, isPending = false }: ReviewFormProps) {
  const dark = useColorScheme() === "dark";
  const textColors = dark ? glassText.dark : glassText.light;
  const bgColors = dark ? semantic.dark : semantic.light;

  const [rating, setRating] = useState(0);
  const [content, setContent] = useState("");

  const canSubmit = rating > 0 && content.trim().length > 0 && !isPending;

  function handleSubmit() {
    if (!canSubmit) return;
    onSubmit(rating, content.trim());
    setRating(0);
    setContent("");
  }

  return (
    <GlassView level="soft" className="mx-4 rounded-glass p-4">
      <Text
        className="font-heading text-base"
        style={{ color: textColors.primary }}
      >
        Dejá tu review
      </Text>

      {/* Star selector */}
      <View className="mt-3">
        <StarRating value={rating} onChange={setRating} size={28} />
      </View>

      {/* Text input */}
      <TextInput
        className="mt-3 min-h-[80px] rounded-glass-sm bg-[#e3eaef] p-3 font-body text-sm dark:bg-[#36424d]"
        style={{ color: textColors.primary, textAlignVertical: "top" }}
        placeholder="Contá tu experiencia..."
        placeholderTextColor={bgColors.text.tertiary}
        multiline
        value={content}
        onChangeText={setContent}
        editable={!isPending}
        maxLength={500}
      />

      {/* Character count + submit */}
      <View className="mt-3 flex-row items-center justify-between">
        <Text
          className="font-body text-xs"
          style={{ color: textColors.secondary }}
        >
          {content.length}/500
        </Text>

        <Pressable
          className="flex-row items-center gap-2 rounded-glass-sm px-4 py-2"
          style={{
            backgroundColor: canSubmit
              ? dark
                ? "rgba(80,164,114,0.25)"
                : "rgba(45,134,83,0.15)"
              : dark
                ? "rgba(255,255,255,0.05)"
                : "rgba(0,0,0,0.05)",
          }}
          onPress={handleSubmit}
          disabled={!canSubmit}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={textColors.brand} />
          ) : (
            <>
              <Send size={14} color={canSubmit ? textColors.brand : textColors.secondary} />
              <Text
                className="font-label text-sm uppercase"
                style={{ color: canSubmit ? textColors.brand : textColors.secondary }}
              >
                Enviar
              </Text>
            </>
          )}
        </Pressable>
      </View>
    </GlassView>
  );
}

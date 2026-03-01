import * as Haptics from "expo-haptics";
import { Globe, Mail, MessageCircle, Phone } from "lucide-react-native";
import { Linking, Pressable, Text, View, useColorScheme } from "react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import type { Contact } from "../types";

interface ContactAction {
  key: string;
  icon: typeof Phone;
  label: string;
  url: string;
}

interface CampingContactSectionProps {
  contact: Contact | null;
  campingName: string;
}

export function CampingContactSection({
  contact,
  campingName,
}: CampingContactSectionProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;

  if (!contact) return null;

  const actions: ContactAction[] = [];

  if (contact.phone) {
    actions.push({
      key: "phone",
      icon: Phone,
      label: contact.phone,
      url: `tel:${contact.phone}`,
    });
  }

  if (contact.whatsapp) {
    const text = encodeURIComponent(
      `Hola! Quería consultar sobre ${campingName}`,
    );
    actions.push({
      key: "whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
      url: `whatsapp://send?phone=${contact.whatsapp}&text=${text}`,
    });
  }

  if (contact.email) {
    actions.push({
      key: "email",
      icon: Mail,
      label: contact.email,
      url: `mailto:${contact.email}`,
    });
  }

  if (contact.website) {
    actions.push({
      key: "website",
      icon: Globe,
      label: contact.website.replace(/^https?:\/\//, ""),
      url: contact.website,
    });
  }

  if (actions.length === 0) return null;

  const handlePress = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Linking.openURL(url);
  };

  return (
    <View className="px-4">
      <Text
        className="mb-3 font-label text-sm uppercase tracking-wider"
        style={{ color: colors.secondary }}
      >
        Contacto
      </Text>
      <View className="gap-2">
        {actions.map(({ key, icon: Icon, label, url }) => (
          <Pressable key={key} onPress={() => handlePress(url)}>
            <GlassView
              level="btn"
              className="flex-row items-center gap-3 rounded-glass-sm px-4 py-3"
            >
              <Icon size={18} color={colors.brand} />
              <Text
                className="flex-1 font-body text-sm"
                style={{ color: colors.primary }}
                numberOfLines={1}
              >
                {label}
              </Text>
            </GlassView>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

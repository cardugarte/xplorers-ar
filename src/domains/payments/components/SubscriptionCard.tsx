import {
  ActivityIndicator,
  Pressable,
  Text,
  useColorScheme,
  View,
} from "react-native";
import {
  Award,
  BarChart3,
  CalendarCheck,
  Camera,
  Crown,
  Search,
  Zap,
} from "lucide-react-native";

import { GlassView } from "@/src/shared/components/GlassView";
import { glassText } from "@/src/shared/theme/tokens";

import type {
  OwnerSubscription,
  SubscriptionPlan,
} from "../types";
import { PRO_BENEFITS, SUBSCRIPTION_PRICES } from "../types";

// ── Helpers ──

function formatSats(sats: number): string {
  return sats.toLocaleString("es-AR");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function daysUntil(iso: string): number {
  const diff = new Date(iso).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ── Plan display config ──

const PLAN_CONFIG: Record<
  SubscriptionPlan,
  { label: string; description: string; glassLevel: "mid" | "andes" | "crepusculo" }
> = {
  free: {
    label: "Gratuito",
    description: "Listado básico en el directorio",
    glassLevel: "mid",
  },
  pro: {
    label: "Pro",
    description: "Prioridad en búsqueda, reservas, analytics",
    glassLevel: "andes",
  },
  premium: {
    label: "Premium",
    description: "Todo Pro + fotos ilimitadas, soporte prioritario",
    glassLevel: "crepusculo",
  },
};

// ── Benefit list item ──

interface BenefitProps {
  icon: React.ReactNode;
  label: string;
  included: boolean;
  textColor: string;
  mutedColor: string;
}

function BenefitItem({ icon, label, included, textColor, mutedColor }: BenefitProps) {
  return (
    <View className="flex-row items-center gap-2 py-1">
      {icon}
      <Text
        className="flex-1 font-body text-sm"
        style={{ color: included ? textColor : mutedColor, opacity: included ? 1 : 0.5 }}
      >
        {label}
      </Text>
    </View>
  );
}

// ── Props ──

interface SubscriptionCardProps {
  plan: SubscriptionPlan;
  subscription: OwnerSubscription | null;
  isUpgrading?: boolean;
  onUpgrade: (plan: Exclude<SubscriptionPlan, "free">) => void;
  onCancel?: () => void;
}

/**
 * Displays a subscription plan with benefits and upgrade/cancel actions.
 *
 * Shows current plan status when active, or upgrade CTA when on free tier.
 */
export function SubscriptionCard({
  plan,
  subscription,
  isUpgrading = false,
  onUpgrade,
  onCancel,
}: SubscriptionCardProps) {
  const dark = useColorScheme() === "dark";
  const colors = dark ? glassText.dark : glassText.light;
  const config = PLAN_CONFIG[plan];
  const price = SUBSCRIPTION_PRICES[plan];
  const isActive = subscription?.plan === plan && subscription.status === "active";
  const isPastDue = subscription?.plan === plan && subscription.status === "past_due";
  const iconColor = plan === "pro" ? colors.brand : plan === "premium" ? colors.accent : colors.secondary;
  const iconSize = 16;

  return (
    <GlassView level={config.glassLevel} className="mb-4 rounded-2xl p-5">
      {/* Header */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-2">
          {plan === "premium" ? (
            <Crown size={22} color={colors.accent} />
          ) : plan === "pro" ? (
            <Award size={22} color={colors.brand} />
          ) : null}
          <Text
            className="font-heading text-lg"
            style={{ color: colors.primary }}
          >
            {config.label}
          </Text>
        </View>

        {isActive && (
          <GlassView level="btn" className="rounded-full px-3 py-1">
            <Text
              className="font-label text-xs"
              style={{ color: colors.brand }}
            >
              Activo
            </Text>
          </GlassView>
        )}
        {isPastDue && (
          <GlassView level="btn" className="rounded-full px-3 py-1">
            <Text
              className="font-label text-xs"
              style={{ color: colors.accent }}
            >
              Pago pendiente
            </Text>
          </GlassView>
        )}
      </View>

      {/* Description */}
      <Text
        className="mt-1 font-body text-sm"
        style={{ color: colors.secondary }}
      >
        {config.description}
      </Text>

      {/* Price */}
      {price > 0 && (
        <View className="mt-3 flex-row items-baseline">
          <Zap size={14} color={colors.accent} />
          <Text
            className="ml-1 font-display text-2xl"
            style={{ color: colors.primary }}
          >
            {formatSats(price)}
          </Text>
          <Text
            className="ml-1 font-body text-sm"
            style={{ color: colors.secondary }}
          >
            sats/mes
          </Text>
        </View>
      )}

      {/* Benefits */}
      <View className="mt-4">
        <BenefitItem
          icon={<Search size={iconSize} color={iconColor} />}
          label="Prioridad en búsqueda"
          included={plan !== "free"}
          textColor={colors.primary}
          mutedColor={colors.secondary}
        />
        <BenefitItem
          icon={<BarChart3 size={iconSize} color={iconColor} />}
          label="Dashboard de analytics"
          included={plan !== "free"}
          textColor={colors.primary}
          mutedColor={colors.secondary}
        />
        <BenefitItem
          icon={<CalendarCheck size={iconSize} color={iconColor} />}
          label="Reservas habilitadas"
          included={plan !== "free"}
          textColor={colors.primary}
          mutedColor={colors.secondary}
        />
        <BenefitItem
          icon={<Camera size={iconSize} color={iconColor} />}
          label={plan === "premium" ? "Fotos ilimitadas" : plan === "pro" ? "Hasta 20 fotos" : "Hasta 5 fotos"}
          included
          textColor={colors.primary}
          mutedColor={colors.secondary}
        />
      </View>

      {/* Active subscription info */}
      {isActive && subscription && (
        <GlassView level="btn" className="mt-4 rounded-xl px-4 py-3">
          <View className="flex-row justify-between">
            <Text
              className="font-label text-xs"
              style={{ color: colors.secondary }}
            >
              Vence
            </Text>
            <Text
              className="font-label text-xs"
              style={{ color: colors.primary }}
            >
              {formatDate(subscription.expires_at)} ({daysUntil(subscription.expires_at)} días)
            </Text>
          </View>
        </GlassView>
      )}

      {/* Upgrade button */}
      {!isActive && plan !== "free" && (
        <Pressable
          onPress={() => onUpgrade(plan as Exclude<SubscriptionPlan, "free">)}
          disabled={isUpgrading}
          className="mt-4"
        >
          <GlassView
            level="andes"
            className="flex-row items-center justify-center rounded-2xl px-6 py-3.5"
          >
            {isUpgrading ? (
              <ActivityIndicator size="small" color={colors.brand} />
            ) : (
              <>
                <Zap size={16} color={dark ? "#83c29a" : "#175533"} />
                <Text
                  className="ml-2 font-heading text-sm"
                  style={{ color: colors.brand }}
                >
                  Suscribirse a {config.label}
                </Text>
              </>
            )}
          </GlassView>
        </Pressable>
      )}

      {/* Cancel button */}
      {isActive && onCancel && (
        <Pressable onPress={onCancel} className="mt-3">
          <Text
            className="text-center font-label text-xs"
            style={{ color: colors.secondary }}
          >
            Cancelar suscripción
          </Text>
        </Pressable>
      )}
    </GlassView>
  );
}

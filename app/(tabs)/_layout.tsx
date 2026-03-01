import { Tabs } from "expo-router";
import { Platform } from "react-native";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#16a34a",
        tabBarStyle: Platform.select({
          ios: { position: "absolute" },
          default: {},
        }),
      }}
    >
      <Tabs.Screen
        name="map"
        options={{
          title: "Mapa",
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: "Explorar",
        }}
      />
      <Tabs.Screen
        name="social"
        options={{
          title: "Social",
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
        }}
      />
    </Tabs>
  );
}

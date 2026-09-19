import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";

import { DesktopNav } from "@/components/ui/desktop-nav";
import { useScreenSize } from "@/hooks/use-screen-size";

export default function TabLayout() {
  // Mobile (native or narrow/tablet web) keeps the existing bottom tab
  // bar untouched. Only a wide *web* window swaps it for a desktop header
  // nav — Platform.OS gates this so Android/iOS never hit this branch
  // regardless of window/screen size.
  const screenSize = useScreenSize();
  const isDesktopWeb = Platform.OS === "web" && screenSize === "desktop";

  return (
    <Tabs
      screenOptions={{
        headerShown: isDesktopWeb,
        header: isDesktopWeb ? () => <DesktopNav /> : undefined,
        tabBarStyle: isDesktopWeb ? { display: "none" } : undefined,
        tabBarActiveTintColor: "#087F75",
        tabBarInactiveTintColor: "#64748B",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Ana Sayfa",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="service"
        options={{
          title: "Taleplerim",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tracking"
        options={{
          title: "Takip",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          href: null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

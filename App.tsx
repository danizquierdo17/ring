import { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Home, CalendarDays, Settings } from "lucide-react-native";

// lucide-react-native types resolve to the web SVG types in this project's TS
// config; casting to any avoids the false-positive error at the call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HomeIcon = Home as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CalendarIcon = CalendarDays as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SettingsIcon = Settings as React.ComponentType<any>;

import { initializeDatabase } from "./src/infra/db/client";
import { HomeScreen } from "./src/features/cycle/ui/HomeScreen";
import { CalendarScreen } from "./src/features/calendar/ui/CalendarScreen";
import { SettingsScreen } from "./src/features/settings/ui/SettingsScreen";
// TODO: Reactivate when development build is ready (Expo Go SDK 53+ has issues with local notifications)
// import { useNotificationsReconciliation } from "./src/features/notifications/hooks/useNotificationsReconciliation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RootTabParamList = {
  Inicio: undefined;
  Calendario: undefined;
  Ajustes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();

// ---------------------------------------------------------------------------
// Loading fallback while SQLite initialises
// ---------------------------------------------------------------------------

function DBLoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reconciliation — runs once after SQLite is ready, inside SQLiteProvider
// TODO: Reactivate when development build is ready
// ---------------------------------------------------------------------------

// function NotificationsInit() {
//   useNotificationsReconciliation();
//   return null;
// }

// ---------------------------------------------------------------------------
// Root navigator
// ---------------------------------------------------------------------------

function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4f46e5",
        tabBarInactiveTintColor: "#9ca3af",
        tabBarStyle: {
          borderTopColor: "#e5e7eb",
          backgroundColor: "#ffffff",
        },
      }}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <HomeIcon color={color} size={size} />
          ),
          tabBarAccessibilityLabel: "Inicio",
        }}
      />
      <Tab.Screen
        name="Calendario"
        component={CalendarScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <CalendarIcon color={color} size={size} />
          ),
          tabBarAccessibilityLabel: "Calendario",
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <SettingsIcon color={color} size={size} />
          ),
          tabBarAccessibilityLabel: "Ajustes",
        }}
      />
    </Tab.Navigator>
  );
}

// ---------------------------------------------------------------------------
// App entry point
// ---------------------------------------------------------------------------

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <SQLiteProvider
        databaseName="ringcare.db"
        onInit={async (db) => initializeDatabase(db)}
      >
        <Suspense fallback={<DBLoadingFallback />}>
          {/* <NotificationsInit /> */}
          <NavigationContainer>
            <RootTabs />
          </NavigationContainer>
        </Suspense>
      </SQLiteProvider>
    </SafeAreaProvider>
  );
}

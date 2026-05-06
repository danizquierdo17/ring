import { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ActionSheetProvider } from "@expo/react-native-action-sheet";
import { Home, CalendarDays, Settings, Moon } from "lucide-react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// lucide-react-native types resolve to the web SVG types in this project's TS
// config; casting to any avoids the false-positive error at the call site.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const HomeIcon = Home as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CalendarIcon = CalendarDays as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SettingsIcon = Settings as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const MoonIcon = Moon as React.ComponentType<any>;

import { C } from "./src/shared/theme/colors";
import { initializeDatabase } from "./src/infra/db/client";
import { HomeScreen } from "./src/features/cycle/ui/HomeScreen";
import { CalendarScreen } from "./src/features/calendar/ui/CalendarScreen";
import { LunaScreen } from "./src/features/luna/ui/LunaScreen";
import { SettingsScreen } from "./src/features/settings/ui/SettingsScreen";
import { ProspectusCenterScreen } from "./src/features/settings/ui/ProspectusCenterScreen";
import { BackupScreen } from "./src/features/backup/ui/BackupScreen";
import { useNotificationsReconciliation } from "./src/features/notifications/hooks/useNotificationsReconciliation";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RootTabParamList = {
  Inicio: undefined;
  Calendario: undefined;
  Ciclograma: undefined;
  Ajustes: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const SettingsStack = createNativeStackNavigator();

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
      <SettingsStack.Screen name="SettingsHome" component={SettingsScreen} />
      <SettingsStack.Screen name="ProspectusCenter" component={ProspectusCenterScreen} />
      <SettingsStack.Screen name="Backup" component={BackupScreen} />
    </SettingsStack.Navigator>
  );
}

// ---------------------------------------------------------------------------
// Loading fallback while SQLite initialises
// ---------------------------------------------------------------------------

function DBLoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={C.indigo} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Reconciliation — runs once after SQLite is ready, inside SQLiteProvider
// ---------------------------------------------------------------------------

function NotificationsInit() {
  useNotificationsReconciliation();
  return null;
}

// ---------------------------------------------------------------------------
// Root navigator
// ---------------------------------------------------------------------------

function RootTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.indigo,
        tabBarInactiveTintColor: C.slate400,
        tabBarStyle: {
          borderTopColor: C.slate100,
          backgroundColor: C.white,
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
        name="Ciclograma"
        component={LunaScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MoonIcon color={color} size={size} />
          ),
          tabBarAccessibilityLabel: "Ciclograma",
        }}
      />
      <Tab.Screen
        name="Ajustes"
        component={SettingsNavigator}
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
      <StatusBar style="dark" />
      <ActionSheetProvider>
        <SQLiteProvider
          databaseName="ringcare.db"
          onInit={async (db) => initializeDatabase(db)}
        >
          <Suspense fallback={<DBLoadingFallback />}>
            <NotificationsInit />
            <NavigationContainer>
              <RootTabs />
            </NavigationContainer>
          </Suspense>
        </SQLiteProvider>
      </ActionSheetProvider>
    </SafeAreaProvider>
  );
}

import { Suspense } from "react";
import { ActivityIndicator, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SQLiteProvider } from "expo-sqlite";

import { initializeDatabase } from "./src/infra/db/client";
import { HomeScreen } from "./src/features/cycle/ui/HomeScreen";

function DBLoadingFallback() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color="#4f46e5" />
    </View>
  );
}

export default function App() {
  return (
    <>
      <StatusBar style="auto" />
      <SQLiteProvider databaseName="ringcare.db" onInit={initializeDatabase}>
        <Suspense fallback={<DBLoadingFallback />}>
          <HomeScreen />
        </Suspense>
      </SQLiteProvider>
    </>
  );
}

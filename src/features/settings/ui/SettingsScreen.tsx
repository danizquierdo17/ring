import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSettings } from "../hooks/useSettings";
import type { Regimen } from "../../cycle/domain/cycleStateMachine";

export function SettingsScreen() {
  const { settings, isLoading, setRegimen, setContinuousDays } = useSettings();

  if (isLoading || settings === null) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white" edges={["top"]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  function handleRegimenChange(regimen: Regimen) {
    const error = setRegimen(regimen);
    if (error !== null) {
      Alert.alert("Error", error.message);
    }
  }

  function handleContinuousDaysChange(delta: number) {
    const newDays = settings!.continuousDays + delta;
    const error = setContinuousDays(newDays);
    if (error !== null) {
      Alert.alert("Error", error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="px-6 pt-6 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-indigo-900">Ajustes</Text>
      </View>

      <View className="px-6 pt-6 gap-8">

        {/* Régimen */}
        <View className="gap-3">
          <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Tipo de régimen
          </Text>

          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
              settings.regimen === "CYCLIC_21_7"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white"
            }`}
            onPress={() => handleRegimenChange("CYCLIC_21_7")}
            accessibilityRole="radio"
            accessibilityLabel="Cíclico 21+7"
            accessibilityState={{ checked: settings.regimen === "CYCLIC_21_7" }}
          >
            <View className="gap-1">
              <Text
                className={`text-base font-semibold ${
                  settings.regimen === "CYCLIC_21_7" ? "text-indigo-700" : "text-gray-800"
                }`}
              >
                Cíclico 21+7
              </Text>
              <Text className="text-sm text-gray-500">21 días con anillo, 7 de descanso</Text>
            </View>
            {settings.regimen === "CYCLIC_21_7" && (
              <View className="w-5 h-5 rounded-full bg-indigo-600" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className={`flex-row items-center justify-between p-4 rounded-xl border-2 ${
              settings.regimen === "CONTINUOUS"
                ? "border-indigo-600 bg-indigo-50"
                : "border-gray-200 bg-white"
            }`}
            onPress={() => handleRegimenChange("CONTINUOUS")}
            accessibilityRole="radio"
            accessibilityLabel="Continuo"
            accessibilityState={{ checked: settings.regimen === "CONTINUOUS" }}
          >
            <View className="gap-1">
              <Text
                className={`text-base font-semibold ${
                  settings.regimen === "CONTINUOUS" ? "text-indigo-700" : "text-gray-800"
                }`}
              >
                Continuo
              </Text>
              <Text className="text-sm text-gray-500">
                Recambio cada {settings.continuousDays} días sin descanso
              </Text>
            </View>
            {settings.regimen === "CONTINUOUS" && (
              <View className="w-5 h-5 rounded-full bg-indigo-600" />
            )}
          </TouchableOpacity>
        </View>

        {/* Días en régimen continuo */}
        {settings.regimen === "CONTINUOUS" && (
          <View className="gap-3">
            <Text className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Duración del anillo
            </Text>
            <View className="flex-row items-center justify-between p-4 rounded-xl border border-gray-200 bg-white">
              <Text className="text-base text-gray-800">Días por anillo</Text>
              <View className="flex-row items-center gap-4">
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => handleContinuousDaysChange(-1)}
                  accessibilityRole="button"
                  accessibilityLabel="Reducir días"
                  accessibilityHint="Resta un día a la duración del anillo"
                >
                  <Text className="text-lg font-bold text-gray-600">−</Text>
                </TouchableOpacity>
                <Text className="text-lg font-semibold text-indigo-700 w-8 text-center">
                  {settings.continuousDays}
                </Text>
                <TouchableOpacity
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                  onPress={() => handleContinuousDaysChange(+1)}
                  accessibilityRole="button"
                  accessibilityLabel="Aumentar días"
                  accessibilityHint="Suma un día a la duración del anillo"
                >
                  <Text className="text-lg font-bold text-gray-600">+</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Text className="text-xs text-gray-400 text-center">
              Entre 21 y 365 días
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

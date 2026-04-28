import { View, Text, ActivityIndicator, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useCurrentCycle } from "../hooks/useCurrentCycle";
import { PrimaryActionButton } from "./PrimaryActionButton";
import { calcDayOfCycle } from "../domain/cycleStateMachine";
import { isOk } from "../../../shared/result";

export function HomeScreen() {
  const { isLoading, currentCycle, uiState, insertRingAction, removeRingAction } =
    useCurrentCycle();

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white" edges={["top"]}>
        <ActivityIndicator size="large" color="#4f46e5" />
      </SafeAreaView>
    );
  }

  const dayLabel =
    currentCycle !== null
      ? `Día ${calcDayOfCycle(currentCycle.insertedAt, new Date().toISOString())} del ciclo`
      : null;

  function handlePress() {
    const result =
      uiState === "RING_IN_USE" ? removeRingAction() : insertRingAction();

    if (!isOk(result)) {
      Alert.alert("Error", result.error.message);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      <View className="flex-1 items-center justify-center gap-6 px-8">
        {dayLabel !== null && (
          <Text className="text-gray-500 text-base text-center">{dayLabel}</Text>
        )}

        <PrimaryActionButton uiState={uiState} onPress={handlePress} />
      </View>
    </SafeAreaView>
  );
}

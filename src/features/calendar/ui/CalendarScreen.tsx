import React from "react";
import { View, ActivityIndicator, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";

import { useCalendar } from "../hooks/useCalendar";

export function CalendarScreen() {
  const { markedDates, isLoading, error } = useCalendar();

  return (
    <SafeAreaView className="flex-1 bg-white" edges={["top"]}>
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#4f46e5" />
        </View>
      ) : error !== null ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-red-600 text-center">{error}</Text>
        </View>
      ) : (
        <Calendar
          markingType="period"
          markedDates={markedDates}
          theme={{
            backgroundColor: "#ffffff",
            calendarBackground: "#ffffff",
            todayTextColor: "#4f46e5",
            arrowColor: "#4f46e5",
            monthTextColor: "#1e1b4b",
            textDayFontWeight: "400",
            textMonthFontWeight: "700",
          }}
        />
      )}
    </SafeAreaView>
  );
}

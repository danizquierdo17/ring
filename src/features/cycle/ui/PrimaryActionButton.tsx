import { TouchableOpacity, Text } from "react-native";
import type { UiState } from "../domain/cycleStateMachine";

type Props = {
  uiState: UiState;
  onPress: () => void;
  disabled?: boolean;
};

type ButtonConfig = {
  label: string;
  hint: string;
  className: string;
};

const BUTTON_CONFIG = {
  NO_RING: {
    label: "Insertar anillo",
    hint: "Registra que has insertado el anillo anticonceptivo hoy",
    className: "bg-indigo-600 active:bg-indigo-700",
  },
  RING_IN_USE: {
    label: "Retirar anillo",
    hint: "Registra que has retirado el anillo anticonceptivo hoy",
    className: "bg-rose-600 active:bg-rose-700",
  },
  RING_FREE: {
    label: "Insertar nuevo anillo",
    hint: "Comienza un nuevo ciclo insertando el anillo anticonceptivo",
    className: "bg-emerald-600 active:bg-emerald-700",
  },
} as const satisfies Record<UiState, ButtonConfig>;

export function PrimaryActionButton({ uiState, onPress, disabled = false }: Props) {
  const { label, hint, className } = BUTTON_CONFIG[uiState];

  return (
    <TouchableOpacity
      className={`${className} rounded-2xl py-5 px-8 items-center justify-center shadow-md w-full opacity-100 disabled:opacity-50`}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled }}
    >
      <Text className="text-white text-xl font-semibold tracking-wide">
        {label}
      </Text>
    </TouchableOpacity>
  );
}

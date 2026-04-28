import { useState, useCallback } from 'react';
import { Platform } from 'react-native';

// On Android the native DateTimePicker only supports one mode at a time,
// so we drive a two-step flow: pick the date first, then the time.
// On iOS we can use mode="datetime" in a single inline picker.

type Phase = 'date' | 'time';

type PickerState = {
  visible: boolean;
  phase: Phase;
  /** Working value mutated as the user scrolls; confirmed on "Accept". */
  working: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
};

const HIDDEN: PickerState = {
  visible: false,
  phase: 'date',
  working: new Date(),
  onConfirm: () => undefined,
  onCancel: () => undefined,
};

export type UseDateTimePickerResult = {
  /** Current picker state — pass directly to DateTimePickerModal. */
  pickerState: PickerState;
  /**
   * Open the picker with an initial date.
   * `onConfirm` receives the final Date when the user accepts.
   * `onCancel` is called when the user dismisses without confirming.
   */
  showPicker: (opts: {
    initialDate: Date;
    onConfirm: (date: Date) => void;
    onCancel?: () => void;
  }) => void;
  /** Called by DateTimePickerModal when the user changes the value. */
  onPickerChange: (date: Date) => void;
  /** Called by DateTimePickerModal when the user taps "Accept" / "Done". */
  onPickerAccept: () => void;
  /** Called by DateTimePickerModal when the user taps "Cancel". */
  onPickerCancel: () => void;
};

export function useDateTimePicker(): UseDateTimePickerResult {
  const [state, setState] = useState<PickerState>(HIDDEN);

  const showPicker = useCallback(({ initialDate, onConfirm, onCancel = () => undefined }: {
    initialDate: Date;
    onConfirm: (date: Date) => void;
    onCancel?: () => void;
  }) => {
    setState({
      visible: true,
      // iOS handles datetime in one step; Android starts with date.
      phase: 'date',
      working: initialDate,
      onConfirm,
      onCancel,
    });
  }, []);

  const onPickerChange = useCallback((date: Date) => {
    setState(prev => ({ ...prev, working: date }));
  }, []);

  const onPickerAccept = useCallback(() => {
    setState(prev => {
      // iOS: single step — confirm immediately.
      // Android: after date step, advance to time step.
      if (Platform.OS === 'android' && prev.phase === 'date') {
        return { ...prev, phase: 'time' };
      }
      // Final confirmation
      prev.onConfirm(prev.working);
      return HIDDEN;
    });
  }, []);

  const onPickerCancel = useCallback(() => {
    setState(prev => {
      prev.onCancel();
      return HIDDEN;
    });
  }, []);

  return { pickerState: state, showPicker, onPickerChange, onPickerAccept, onPickerCancel };
}

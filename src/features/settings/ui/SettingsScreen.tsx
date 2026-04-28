import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useSettings } from '../hooks/useSettings';
import type { Regimen } from '../../cycle/domain/cycleStateMachine';
import { C } from '../../../shared/theme/colors';

export function SettingsScreen() {
  const { settings, isLoading, setRegimen, setContinuousDays } = useSettings();

  if (isLoading || settings === null) {
    return (
      <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }} edges={['top']}>
        <ActivityIndicator size="large" color={C.indigo} />
      </SafeAreaView>
    );
  }

  function handleRegimenChange(regimen: Regimen) {
    const error = setRegimen(regimen);
    if (error !== null) Alert.alert('Error', error.message);
  }

  function handleContinuousDaysChange(delta: number) {
    const error = setContinuousDays(settings!.continuousDays + delta);
    if (error !== null) Alert.alert('Error', error.message);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.slate100 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}>Ajustes</Text>
        </View>

        <View style={{ paddingHorizontal: 20, paddingTop: 24, gap: 24 }}>

          {/* Régimen section */}
          <View style={{ gap: 10 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
              Tipo de régimen
            </Text>

            <RegimenOption
              label="Cíclico 21+7"
              description="21 días con anillo, 7 de descanso"
              selected={settings.regimen === 'CYCLIC_21_7'}
              onPress={() => handleRegimenChange('CYCLIC_21_7')}
            />
            <RegimenOption
              label="Continuo"
              description={`Recambio cada ${settings.continuousDays} días sin descanso`}
              selected={settings.regimen === 'CONTINUOUS'}
              onPress={() => handleRegimenChange('CONTINUOUS')}
            />
          </View>

          {/* Continuous days stepper */}
          {settings.regimen === 'CONTINUOUS' && (
            <View style={{ gap: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate400, textTransform: 'uppercase', letterSpacing: 1 }}>
                Duración del anillo
              </Text>
              <View style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: C.slate100, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 } }}>
                <Text style={{ fontSize: 15, fontWeight: '600', color: C.text }}>Días por anillo</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                  <TouchableOpacity
                    onPress={() => handleContinuousDaysChange(-1)}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityRole="button" accessibilityLabel="Reducir días"
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: C.indigo, lineHeight: 24 }}>−</Text>
                  </TouchableOpacity>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: C.indigo, minWidth: 32, textAlign: 'center' }}>
                    {settings.continuousDays}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleContinuousDaysChange(+1)}
                    style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: C.lavender, alignItems: 'center', justifyContent: 'center' }}
                    accessibilityRole="button" accessibilityLabel="Aumentar días"
                  >
                    <Text style={{ fontSize: 20, fontWeight: '700', color: C.indigo, lineHeight: 24 }}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={{ fontSize: 11, color: C.slate400, textAlign: 'center' }}>Entre 21 y 365 días</Text>
            </View>
          )}

          {/* Privacy note */}
          <View style={{ backgroundColor: C.slate100, borderRadius: 16, padding: 16, gap: 4 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: C.slate700 }}>Privacidad</Text>
            <Text style={{ fontSize: 12, color: C.slate400, lineHeight: 18 }}>
              Tus datos nunca salen del dispositivo. Todo se almacena de forma local y privada.
            </Text>
          </View>

        </View>

        {/* Footer */}
        <View style={{ alignItems: 'center', paddingVertical: 32 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: C.slate400, letterSpacing: 1 }}>
            LUA RING v1.0.0
          </Text>
          <Text style={{ fontSize: 10, color: C.slate200, marginTop: 4, letterSpacing: 0.5 }}>
            CONFIDENCE. CONTROL. YOU.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function RegimenOption({ label, description, selected, onPress }: {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: selected ? C.indigo : C.slate100,
        backgroundColor: selected ? C.lavender : '#fff',
        shadowColor: selected ? C.indigo : '#000',
        shadowOpacity: selected ? 0.08 : 0.03,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      <View style={{ gap: 2, flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '700', color: selected ? C.indigo : C.text }}>
          {label}
        </Text>
        <Text style={{ fontSize: 12, color: selected ? C.indigoLight : C.slate400 }}>
          {description}
        </Text>
      </View>
      <View style={{
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: selected ? C.indigo : C.slate200,
        backgroundColor: selected ? C.indigo : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
      }}>
        {selected && <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' }} />}
      </View>
    </TouchableOpacity>
  );
}

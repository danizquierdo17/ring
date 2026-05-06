import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExternalLink, FileText, ChevronRight } from 'lucide-react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { C } from '../../../shared/theme/colors';
import { useTheme } from '../../../shared/theme/useTheme';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ExternalLinkIcon = ExternalLink as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const FileTextIcon = FileText as React.ComponentType<any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ChevronRightIcon = ChevronRight as React.ComponentType<any>;

// ---------------------------------------------------------------------------
// Data — URLs oficiales CIMA/AEMPS. Actualiza las URLs cuando sean definitivas.
// ---------------------------------------------------------------------------

const PROSPECTOS = [
  {
    id: 'nuvaring',
    brand: 'NuvaRing',
    manufacturer: 'Organon',
    description: 'Anillo vaginal de etonogestrel + etinilestradiol',
    url: 'https://cima.aemps.es/cima/pdfs/es/p/64570/Prospecto_64570.html.pdf',
    accentColor: C.indigo,
  },
  {
    id: 'ornibel',
    brand: 'Ornibel',
    manufacturer: 'Theramex',
    description: 'Anillo vaginal de etonogestrel + etinilestradiol',
    url: 'https://cima.aemps.es/cima/pdfs/es/p/82125/P_82125.html.pdf',
    accentColor: C.emerald,
  },
  {
    id: 'ringo',
    brand: 'Ringo',
    manufacturer: 'Laboratorio Farmacéutico',
    description: 'Anillo vaginal anticonceptivo',
    url: 'https://cima.aemps.es/cima/pdfs/es/p/82755/P_82755.html.pdf',
    accentColor: C.coral,
  },
] as const;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function ProspectoCard({
  brand,
  manufacturer,
  description,
  url,
  accentColor,
}: {
  brand: string;
  manufacturer: string;
  description: string;
  url: string;
  accentColor: string;
}) {
  const c = useTheme();
  async function handleOpen() {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Error', 'No se puede abrir este enlace en tu dispositivo.');
      return;
    }
    await Linking.openURL(url);
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={`Descargar prospecto oficial de ${brand}`}
      style={{
        backgroundColor: c.surface,
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: c.border,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        shadowColor: '#000',
        shadowOpacity: 0.04,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      }}
    >
      {/* Color pill / brand indicator */}
      <View style={{
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: accentColor + '18',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}>
        <FileTextIcon color={accentColor} size={22} />
      </View>

      {/* Text */}
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: c.text }}>{brand}</Text>
        <Text style={{ fontSize: 11, fontWeight: '600', color: accentColor }}>{manufacturer}</Text>
        <Text style={{ fontSize: 11, color: c.slate400, marginTop: 1 }}>{description}</Text>
      </View>

      {/* CTA */}
      <View style={{
        backgroundColor: accentColor,
        borderRadius: 10,
        paddingHorizontal: 10,
        paddingVertical: 6,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
      }}>
        <ExternalLinkIcon color="#fff" size={12} />
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>PDF</Text>
      </View>
    </TouchableOpacity>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

type Props = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: NativeStackNavigationProp<any>;
};

export function ProspectusCenterScreen({ navigation }: Props) {
  const c = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['top']}>
      {/* Custom header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: c.border,
        gap: 12,
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: c.lavender,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <ChevronRightIcon
            color={c.indigo}
            size={20}
            style={{ transform: [{ scaleX: -1 }] }}
          />
        </TouchableOpacity>
        <View>
          <Text style={{ fontSize: 17, fontWeight: '800', color: c.text, letterSpacing: -0.3 }}>
            Centro de información y prospectos
          </Text>
          <Text style={{ fontSize: 11, color: c.slate400, marginTop: 1 }}>
            Fuentes oficiales · CIMA / AEMPS
          </Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Prospectos list */}
        <View style={{ paddingHorizontal: 20, paddingTop: 20, gap: 12 }}>
          <Text style={{ fontSize: 11, fontWeight: '700', color: c.slate400, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>
            Prospectos oficiales
          </Text>

          {PROSPECTOS.map((p) => (
            <ProspectoCard key={p.id} {...p} />
          ))}
        </View>

        {/* How to use with AI */}
        <View style={{
          marginHorizontal: 20,
          marginTop: 28,
          backgroundColor: c.lavender,
          borderRadius: 18,
          padding: 18,
          gap: 10,
        }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: c.indigo }}>
            ¿Cómo usar el prospecto con una IA?
          </Text>
          <View style={{ gap: 6 }}>
            {[
              'Descarga o abre el PDF oficial.',
              'Pásale el archivo a tu app de IA preferida (ChatGPT, Gemini, Claude…).',
              'Cruza los datos: asegúrate de que lo que te dice la IA cuadra con la información oficial.',

            ].map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
                <View style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: c.indigo,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                }}>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff' }}>{i + 1}</Text>
                </View>
                <Text style={{ fontSize: 13, color: c.indigoLight, flex: 1, lineHeight: 19 }}>{step}</Text>
              </View>
            ))}
          </View>
          <Text style={{ fontSize: 12, color: c.indigo, fontWeight: '600', lineHeight: 17, marginTop: 2 }}>
            ⚠️ Recuerda: La IA es una gran herramienta, pero no sustituye a tu médico. Consulta siempre a un profesional antes de dar pasos importantes.
          </Text>
        </View>

        {/* Legal disclaimer */}
        <View style={{
          marginHorizontal: 20,
          marginTop: 16,
          backgroundColor: c.slate100,
          borderRadius: 14,
          padding: 14,
        }}>
          <Text style={{ fontSize: 11, color: c.slate400, lineHeight: 16 }}>
            <Text style={{ fontWeight: '700' }}>Aviso legal · </Text>
            Lua Ring proporciona enlaces a fuentes oficiales para tu comodidad, pero no es responsable de la interpretación de la información ni de las respuestas generadas por herramientas de terceros.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

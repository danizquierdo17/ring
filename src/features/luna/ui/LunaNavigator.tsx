import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { LunaScreen } from './LunaScreen';
import { LunaHistoryScreen } from './LunaHistoryScreen';
import { LunaSnapshotDetailScreen } from './LunaSnapshotDetailScreen';

const Stack = createNativeStackNavigator();

export function LunaNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="LunaHome" component={LunaScreen} />
      <Stack.Screen name="LunaHistory" component={LunaHistoryScreen} />
      <Stack.Screen name="LunaSnapshotDetail" component={LunaSnapshotDetailScreen} />
    </Stack.Navigator>
  );
}

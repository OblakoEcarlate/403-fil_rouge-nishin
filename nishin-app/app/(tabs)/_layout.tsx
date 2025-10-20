import { Tabs } from 'expo-router';
import React from 'react';
import { Stack } from 'expo-router';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="auth" />
      </Stack>
    );
}


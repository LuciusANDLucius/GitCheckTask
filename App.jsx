/**
 * DevRepo Task Manager — App Entry Point
 * ─────────────────────────────────────────────────────────────────────────────
 * Stack:     Expo 52 · React Native 0.76 · React Navigation 6
 * Animation: react-native-reanimated 3 · Animated API
 * Design:    High-Contrast WCAG AAA tokens · Light/Dark Theme · Font Scaling
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * IMPORTANT: GestureHandlerRootView MUST be the root component
 *            when using @react-navigation/drawer.
 */

import 'react-native-gesture-handler';           // ← Must be FIRST import
import React from 'react';
import { StyleSheet, StatusBar, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { GitHubProvider } from './src/context/GitHubContext';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Colors } from './src/constants/colors';

function ThemedAppContent() {
  const { isDark, colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bg.secondary }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bg.secondary}
        translucent={false}
      />
      <AppNavigator />
    </View>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <GitHubProvider>
            <ThemedAppContent />
          </GitHubProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
  },
});

export default App;

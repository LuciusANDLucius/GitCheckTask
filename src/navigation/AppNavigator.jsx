import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Colors } from '../constants/colors';
import { useGitHub } from '../context/GitHubContext';
import DrawerContent from './DrawerContent';
import BottomTabNavigator from './BottomTabNavigator';
import LoginScreen from '../screens/LoginScreen';

const Drawer = createDrawerNavigator();

const NAVIGATION_THEME = {
  dark: true,
  colors: {
    primary: Colors.indigo[500],
    background: Colors.bg.secondary,
    card: Colors.bg.card,
    text: Colors.text.primary,
    border: Colors.border.subtle,
    notification: Colors.rose[500],
  },
};

export default function AppNavigator() {
  const { isLoggedIn, loading } = useGitHub();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.indigo[500]} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={NAVIGATION_THEME}>
      {!isLoggedIn ? (
        <LoginScreen />
      ) : (
        <Drawer.Navigator
          drawerContent={(props) => <DrawerContent {...props} />}
          screenOptions={{
            headerShown: false,
            drawerType: 'slide',
            overlayColor: 'rgba(0,0,0,0.55)',
            drawerStyle: {
              backgroundColor: Colors.bg.secondary,
              width: 300,
              borderRightWidth: 1,
              borderRightColor: Colors.border.subtle,
            },
            sceneContainerStyle: {
              backgroundColor: Colors.bg.secondary,
            },
            swipeEdgeWidth: 50,
          }}
        >
          <Drawer.Screen
            name="Main"
            component={BottomTabNavigator}
            options={{ title: 'DevRepo' }}
          />
        </Drawer.Navigator>
      )}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: Colors.bg.secondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

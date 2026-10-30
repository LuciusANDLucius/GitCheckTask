import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useTheme } from '../context/ThemeContext';
import DashboardScreen    from '../screens/DashboardScreen';
import RepositoriesScreen from '../screens/RepositoriesScreen';
import ExploreScreen      from '../screens/ExploreScreen';
import SettingsScreen     from '../screens/SettingsScreen';

/**
 * BottomTabNavigator — Custom-styled bottom tab bar.
 * Features:
 *   • Glassmorphism-style dark/light tab bar
 *   • Indigo glow indicator on active tab
 *   • Spring-scale animation on tab press
 *   • Icon + label layout
 *   • Complete Theme synchronization (Light/Dark mode)
 */

const Tab = createBottomTabNavigator();

const TAB_ITEMS = [
  {
    name:       'Dashboard',
    iconActive:  '⬡',
    iconDefault: '⬡',
    label:       'Dashboard',
  },
  {
    name:       'Repositories',
    iconActive:  '⎇',
    iconDefault: '⎇',
    label:       'Repos',
  },
  {
    name:       'Explore',
    iconActive:  '🌐',
    iconDefault: '🌐',
    label:       'Explore',
  },
  {
    name:       'Settings',
    iconActive:  '◈',
    iconDefault: '◈',
    label:       'Settings',
  },
];

/** Single animated tab button */
const TabButton = ({ item, isFocused, onPress }) => {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue:         0.88,
        tension:         260,
        friction:        10,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue:         1,
        tension:         200,
        friction:        9,
        useNativeDriver: true,
      }),
    ]).start();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={styles.tabButton}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={`${item.label} tab`}
      accessibilityHint={`Switches to ${item.label} screen`}
    >
      <Animated.View
        style={[
          styles.tabButtonInner,
          { transform: [{ scale }] },
        ]}
      >
        {/* Active indicator glow pill */}
        {isFocused && (
          <View
            style={[
              styles.glowPill,
              {
                backgroundColor: `${colors.indigo[500]}18`,
                borderColor: `${colors.indigo[500]}35`,
              },
            ]}
            aria-hidden="true"
          />
        )}

        {/* Icon bubble */}
        <View
          style={[
            styles.iconBubble,
            isFocused && { backgroundColor: `${colors.indigo[500]}22` },
          ]}
          aria-hidden="true"
        >
          <Text
            style={[
              styles.tabIcon,
              { color: isFocused ? colors.indigo[500] : colors.text.muted },
            ]}
          >
            {isFocused ? item.iconActive : item.iconDefault}
          </Text>
        </View>

        {/* Label */}
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? colors.indigo[500] : colors.text.muted },
          ]}
        >
          {item.label}
        </Text>
      </Animated.View>
    </TouchableOpacity>
  );
};

/** Custom tab bar renderer */
const CustomTabBar = ({ state, navigation }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.tabBarContainer, { backgroundColor: 'transparent', borderTopColor: 'transparent' }]}>
      <View
        style={[
          styles.tabBar,
          {
            backgroundColor: colors.bg.cardElevated,
            borderColor: colors.border.default,
          },
        ]}
        accessibilityRole="tablist"
      >
        {state.routes.map((route, index) => {
          const item    = TAB_ITEMS[index];
          const focused = state.index === index;

          return (
            <TabButton
              key={route.key}
              item={item}
              isFocused={focused}
              onPress={() => {
                if (!focused) {
                  navigation.navigate(route.name);
                }
              }}
            />
          );
        })}
      </View>
    </View>
  );
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Dashboard"    component={DashboardScreen} />
      <Tab.Screen name="Repositories" component={RepositoriesScreen} />
      <Tab.Screen name="Explore"      component={ExploreScreen} />
      <Tab.Screen name="Settings"     component={SettingsScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position:        'absolute',
    bottom:           0,
    left:             0,
    right:            0,
    paddingHorizontal: Spacing.xl,
    paddingBottom:    Spacing.xl,
    paddingTop:       Spacing.sm,
    backgroundColor:  Colors.bg.secondary,
    borderTopWidth:   1,
    borderTopColor:   Colors.border.subtle,
  },
  tabBar: {
    flexDirection:   'row',
    backgroundColor: Colors.bg.cardElevated,
    borderRadius:    Radius['2xl'],
    borderWidth:     1,
    borderColor:     Colors.border.default,
    paddingVertical:  Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  tabButton: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
  },
  tabButtonInner: {
    alignItems:     'center',
    justifyContent: 'center',
    gap:            4,
    paddingVertical: 6,
    paddingHorizontal: Spacing.sm,
    borderRadius:   Radius.xl,
    position:       'relative',
  },
  glowPill: {
    position:        'absolute',
    top:             0,
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: `${Colors.indigo[500]}18`,
    borderRadius:    Radius.xl,
    borderWidth:     1,
    borderColor:     `${Colors.indigo[500]}35`,
  },
  iconBubble: {
    width:          36,
    height:         36,
    borderRadius:   Radius.md,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconBubbleActive: {
    backgroundColor: `${Colors.indigo[500]}22`,
  },
  tabIcon: {
    fontSize:   20,
    lineHeight: 24,
  },
  tabIconActive: {
    color: Colors.indigo[400],
  },
  tabIconInactive: {
    color: Colors.text.muted,
  },
  tabLabel: {
    ...Typography.styles.label,
    fontSize: 10,
    color:    Colors.text.muted,
  },
  tabLabelActive: {
    color: Colors.indigo[400],
  },
});

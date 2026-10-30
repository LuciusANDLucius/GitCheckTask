/**
 * Spacing & Layout Tokens — typeui.sh paradigm
 * Consistent 4px grid spacing, border radii, and shadow presets.
 */

export const Spacing = {
  // ─── Base Spacing Scale (4px grid) ──────────────────────────────────────────
  0:   0,
  0.5: 2,
  1:   4,
  1.5: 6,
  2:   8,
  2.5: 10,
  3:   12,
  3.5: 14,
  4:   16,
  5:   20,
  6:   24,
  7:   28,
  8:   32,
  9:   36,
  10:  40,
  12:  48,
  14:  56,
  16:  64,
  20:  80,
  24:  96,
  32: 128,

  // ─── Named Semantic Aliases ──────────────────────────────────────────────────
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  24,
  '2xl': 32,
  '3xl': 48,
  '4xl': 64,

  // ─── Screen Gutters ──────────────────────────────────────────────────────────
  screenPadding: 20,
  cardPadding:   16,
  sectionGap:    24,
};

export const Radius = {
  none:  0,
  xs:    4,
  sm:    6,
  md:    10,
  lg:    14,
  xl:    18,
  '2xl': 24,
  '3xl': 32,
  full:  9999,
};

import { Platform } from 'react-native';

const isWeb = Platform.OS === 'web';

export const Shadow = {
  // Shadow presets with native shadow* and web boxShadow
  sm: isWeb
    ? { boxShadow: '0px 1px 4px rgba(0, 0, 0, 0.3)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
      },
  md: isWeb
    ? { boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.4)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 6,
      },
  lg: isWeb
    ? { boxShadow: '0px 8px 16px rgba(0, 0, 0, 0.5)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
        elevation: 12,
      },
  xl: isWeb
    ? { boxShadow: '0px 12px 24px rgba(0, 0, 0, 0.55)' }
    : {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.55,
        shadowRadius: 24,
        elevation: 18,
      },

  // Colored glow shadows
  glow: (color) =>
    isWeb
      ? { boxShadow: `0px 0px 12px ${color}` }
      : {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.8,
          shadowRadius: 12,
          elevation: 8,
        },

  glowLg: (color) =>
    isWeb
      ? { boxShadow: `0px 0px 24px ${color}` }
      : {
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.9,
          shadowRadius: 24,
          elevation: 14,
        },
};

export default Spacing;

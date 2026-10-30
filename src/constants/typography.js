/**
 * Typography Scale — typeui.sh inspired
 * Consistent font sizes, weights, line-heights, and letter-spacing.
 */

export const Typography = {
  // ─── Font Families ──────────────────────────────────────────────────────────
  family: {
    mono: 'monospace',
    sans: 'system-ui',
  },

  // ─── Font Sizes ─────────────────────────────────────────────────────────────
  size: {
    '2xs': 10,
    xs:    11,
    sm:    13,
    base:  15,
    md:    16,
    lg:    18,
    xl:    20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 34,
    '5xl': 42,
  },

  // ─── Font Weights ────────────────────────────────────────────────────────────
  weight: {
    regular:   '400',
    medium:    '500',
    semibold:  '600',
    bold:      '700',
    extrabold: '800',
  },

  // ─── Line Heights ────────────────────────────────────────────────────────────
  lineHeight: {
    tight:   1.2,
    snug:    1.35,
    normal:  1.5,
    relaxed: 1.65,
    loose:   2.0,
  },

  // ─── Letter Spacing ──────────────────────────────────────────────────────────
  tracking: {
    tighter: -0.8,
    tight:   -0.4,
    normal:   0,
    wide:     0.4,
    wider:    0.8,
    widest:   1.6,
  },

  // ─── Preset Text Styles ──────────────────────────────────────────────────────
  styles: {
    displayLg: {
      fontSize:    34,
      fontWeight:  '800',
      letterSpacing: -0.8,
      lineHeight:  41,
    },
    displayMd: {
      fontSize:    28,
      fontWeight:  '700',
      letterSpacing: -0.4,
      lineHeight:  34,
    },
    headingLg: {
      fontSize:    22,
      fontWeight:  '700',
      letterSpacing: -0.3,
      lineHeight:  28,
    },
    headingMd: {
      fontSize:    18,
      fontWeight:  '600',
      letterSpacing: -0.2,
      lineHeight:  24,
    },
    headingSm: {
      fontSize:    15,
      fontWeight:  '600',
      letterSpacing: -0.1,
      lineHeight:  20,
    },
    bodyLg: {
      fontSize:    16,
      fontWeight:  '400',
      letterSpacing: 0,
      lineHeight:  24,
    },
    bodyMd: {
      fontSize:    14,
      fontWeight:  '400',
      letterSpacing: 0,
      lineHeight:  20,
    },
    bodySm: {
      fontSize:    12,
      fontWeight:  '400',
      letterSpacing: 0.1,
      lineHeight:  18,
    },
    label: {
      fontSize:    11,
      fontWeight:  '600',
      letterSpacing: 0.6,
      lineHeight:  16,
    },
    mono: {
      fontSize:    13,
      fontWeight:  '500',
      letterSpacing: 0.2,
      lineHeight:  20,
      fontFamily:  'monospace',
      fontVariant: ['tabular-nums'],
    },
    monoSm: {
      fontSize:    11,
      fontWeight:  '500',
      letterSpacing: 0.1,
      lineHeight:  16,
      fontFamily:  'monospace',
      fontVariant: ['tabular-nums'],
    },
    tabular: {
      fontVariant: ['tabular-nums'],
    },
    statNumber: {
      fontWeight:  '700',
      fontVariant: ['tabular-nums'],
    },
  },
};

export default Typography;

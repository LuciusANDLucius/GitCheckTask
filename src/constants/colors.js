/**
 * Design Token System — Colors
 * High Contrast & Vibrant Palette (WCAG AAA/AA Compliant)
 * Supports both Dark Mode and Light Mode.
 */

export const DARK_COLORS = {
  isDark: true,

  // ─── Backgrounds ───────────────────────────────────────────────────────────
  bg: {
    primary:      '#070712',   // deepest void
    secondary:    '#0c0f1d',   // page background
    card:         '#12172b',   // card background (distinct from page)
    cardElevated: '#19203b',   // elevated / modal cards
    overlay:      'rgba(7, 7, 18, 0.92)',
    glass:        'rgba(18, 23, 43, 0.88)',
    input:        '#161c33',
  },

  // ─── Borders (Distinct, high-contrast) ──────────────────────────────────────
  border: {
    subtle:  '#263352',
    default: '#394b78',
    strong:  '#5169a8',
    glow:    '#818cf8',
  },

  // ─── Primary Accent (Indigo) ────────────────────────────────────────────────
  indigo: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    300: '#a5b4fc',
    400: '#939bff',
    500: '#6366f1',
    600: '#4f46e5',
    700: '#4338ca',
  },

  // ─── Secondary Accents (Ultra-Vibrant) ──────────────────────────────────────
  sky:    { 400: '#38bdf8', 500: '#0ea5e9', 600: '#0284c7' },
  cyan:   { 400: '#22d3ee', 500: '#06b6d4', 600: '#0891b2' },
  emerald:{ 400: '#34d399', 500: '#10b981', 600: '#059669' },
  amber:  { 400: '#fbbf24', 500: '#f59e0b', 600: '#d97706' },
  rose:   { 400: '#fb7185', 500: '#f43f5e', 600: '#e11d48' },
  purple: { 400: '#c084fc', 500: '#a855f7', 600: '#9333ea' },
  teal:   { 400: '#2dd4bf', 500: '#14b8a6', 600: '#0d9488' },

  // ─── Glow (shadow color values) ─────────────────────────────────────────────
  glow: {
    indigo:  'rgba(99,102,241,0.35)',
    sky:     'rgba(14,165,233,0.32)',
    cyan:    'rgba(6,182,212,0.30)',
    emerald: 'rgba(16,185,129,0.32)',
    amber:   'rgba(245,158,11,0.32)',
    rose:    'rgba(244,63,94,0.32)',
    purple:  'rgba(168,85,247,0.32)',
    white:   'rgba(255,255,255,0.12)',
  },

  // ─── Text (Maximum Contrast & Legibility) ───────────────────────────────────
  text: {
    primary:   '#ffffff',   // 100% Crisp White — maximum clarity!
    secondary: '#f1f5f9',   // Slate-100 — very bright and legible
    muted:     '#cbd5e1',   // Slate-300 — high contrast, NEVER muddy gray!
    dimmed:    '#94a3b8',   // Slate-400
    inverse:   '#070712',
  },

  // ─── Status (priority pills) ────────────────────────────────────────────────
  priority: {
    critical: { bg: 'rgba(244,63,94,0.22)',  border: '#f43f5e', text: '#ff8599' },
    normal:   { bg: 'rgba(99,102,241,0.22)', border: '#6366f1', text: '#a5b4fc' },
    low:      { bg: 'rgba(16,185,129,0.22)', border: '#10b981', text: '#6ee7b7' },
  },

  // ─── Activity type accents (left-border) ────────────────────────────────────
  activity: {
    push:        '#818cf8',   // indigo
    pull_request:'#38bdf8',   // sky
    issue:       '#fbbf24',   // amber
    review:      '#c084fc',   // purple
    fork:        '#22d3ee',   // cyan
    star:        '#facc15',   // gold
    release:     '#34d399',   // emerald
    comment:     '#e2e8f0',   // slate
  },
};

export const LIGHT_COLORS = {
  isDark: false,

  // ─── Backgrounds ───────────────────────────────────────────────────────────
  bg: {
    primary:      '#f8fafc',   // soft light slate canvas
    secondary:    '#f1f5f9',   // page background (Slate-100)
    card:         '#ffffff',   // crisp pure white card
    cardElevated: '#f8fafc',   // elevated surface / chip
    overlay:      'rgba(15, 23, 42, 0.45)',
    glass:        'rgba(255, 255, 255, 0.94)',
    input:        '#ffffff',
  },

  // ─── Borders ────────────────────────────────────────────────────────────────
  border: {
    subtle:  '#e2e8f0',
    default: '#cbd5e1',
    strong:  '#94a3b8',
    glow:    '#4f46e5',
  },

  // ─── Primary Accent (Indigo) ────────────────────────────────────────────────
  indigo: {
    50:  '#eef2ff',
    100: '#e0e7ff',
    300: '#6366f1',
    400: '#4f46e5',
    500: '#4338ca',
    600: '#3730a3',
    700: '#312e81',
  },

  // ─── Secondary Accents ──────────────────────────────────────────────────────
  sky:    { 400: '#0284c7', 500: '#0369a1', 600: '#075985' },
  cyan:   { 400: '#0891b2', 500: '#0e7490', 600: '#155e75' },
  emerald:{ 400: '#059669', 500: '#047857', 600: '#065f46' },
  amber:  { 400: '#d97706', 500: '#b45309', 600: '#92400e' },
  rose:   { 400: '#e11d48', 500: '#be123c', 600: '#9f1239' },
  purple: { 400: '#9333ea', 500: '#7e22ce', 600: '#6b21a8' },
  teal:   { 400: '#0d9488', 500: '#0f766e', 600: '#115e59' },

  // ─── Glow ───────────────────────────────────────────────────────────────────
  glow: {
    indigo:  'rgba(79,70,229,0.18)',
    sky:     'rgba(2,132,199,0.18)',
    cyan:    'rgba(8,145,178,0.18)',
    emerald: 'rgba(5,150,105,0.18)',
    amber:   'rgba(217,119,6,0.18)',
    rose:    'rgba(225,29,72,0.18)',
    purple:  'rgba(147,51,234,0.18)',
    white:   'rgba(0,0,0,0.06)',
  },

  // ─── Text (Crisp Deep Charcoal) ─────────────────────────────────────────────
  text: {
    primary:   '#0f172a',   // Slate-900 — maximum contrast
    secondary: '#1e293b',   // Slate-800
    muted:     '#334155',   // Slate-700
    dimmed:    '#64748b',   // Slate-500
    inverse:   '#ffffff',
  },

  // ─── Status ─────────────────────────────────────────────────────────────────
  priority: {
    critical: { bg: '#ffe4e6', border: '#f43f5e', text: '#be123c' },
    normal:   { bg: '#e0e7ff', border: '#6366f1', text: '#3730a3' },
    low:      { bg: '#d1fae5', border: '#10b981', text: '#065f46' },
  },

  // ─── Activity ───────────────────────────────────────────────────────────────
  activity: {
    push:        '#4f46e5',
    pull_request:'#0284c7',
    issue:       '#d97706',
    review:      '#9333ea',
    fork:        '#0891b2',
    star:        '#b45309',
    release:     '#059669',
    comment:     '#334155',
  },
};

// Default high-contrast export
export const Colors = DARK_COLORS;

export default Colors;

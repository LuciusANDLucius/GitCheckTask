import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors } from '../constants/colors';
import { Typography } from '../constants/typography';
import { Radius, Spacing } from '../constants/spacing';
import { useTheme } from '../context/ThemeContext';
import githubService from '../services/githubService';

/**
 * GitHub Contribution Colors
 */
const DARK_LEVEL_COLORS = [
  '#161b22', // Level 0: No contribution
  '#0e4429', // Level 1: Low
  '#006d32', // Level 2: Medium-low
  '#26a641', // Level 3: Medium-high
  '#39d353', // Level 4: High
];

const LIGHT_LEVEL_COLORS = [
  '#ebedf0', // Level 0: No contribution
  '#9be9a8', // Level 1: Low
  '#40c463', // Level 2: Medium-low
  '#30a14e', // Level 3: Medium-high
  '#216e39', // Level 4: High
];

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAY_LABELS = [
  { index: 1, label: 'Mon' },
  { index: 3, label: 'Wed' },
  { index: 5, label: 'Fri' },
];

export default function ContributionGraph({ username }) {
  const { colors, isDark, scaleFont } = useTheme();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedYear, setSelectedYear] = useState('lastYear');
  const [selectedDay, setSelectedDay] = useState(null);

  const levelColors = isDark ? DARK_LEVEL_COLORS : LIGHT_LEVEL_COLORS;

  const fetchContributions = useCallback(async () => {
    if (!username || username === 'guest') {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await githubService.getUserContributions(username, 'all');
      setData(res);
      // Default to lastYear if available, else first year
      if (res.total?.lastYear !== undefined) {
        setSelectedYear('lastYear');
      } else if (res.years?.length > 0) {
        setSelectedYear(res.years[0]);
      }
    } catch (e) {
      console.warn('ContributionGraph fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [username]);

  useEffect(() => {
    fetchContributions();
  }, [fetchContributions]);

  // Filter contributions by selected year
  const filteredContributions = useMemo(() => {
    if (!data?.contributions || data.contributions.length === 0) return [];

    if (selectedYear === 'lastYear') {
      // Last 365 days
      return data.contributions.slice(-371);
    }

    return data.contributions.filter((d) => d.date.startsWith(selectedYear));
  }, [data, selectedYear]);

  // Compute weeks array (columns of 7 days)
  const { weeks, monthHeaders } = useMemo(() => {
    if (filteredContributions.length === 0) {
      return { weeks: [], monthHeaders: [] };
    }

    const weeksList = [];
    let currentWeek = [];
    const headers = [];
    let lastMonth = -1;

    filteredContributions.forEach((item, index) => {
      const dateObj = new Date(item.date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sun, 1 = Mon, ...
      const month = dateObj.getMonth();

      // If Sunday or first item, start a new week
      if (dayOfWeek === 0 && currentWeek.length > 0) {
        weeksList.push(currentWeek);
        currentWeek = [];
      }

      // Record month label when a new month begins
      if (month !== lastMonth) {
        headers.push({
          weekIndex: weeksList.length,
          label: MONTH_NAMES[month],
        });
        lastMonth = month;
      }

      currentWeek.push({
        ...item,
        dayOfWeek,
      });
    });

    if (currentWeek.length > 0) {
      weeksList.push(currentWeek);
    }

    return { weeks: weeksList, monthHeaders: headers };
  }, [filteredContributions]);

  // Total count for current selected year
  const totalCount = useMemo(() => {
    if (!data?.total) return 0;
    if (selectedYear === 'lastYear') {
      return data.total.lastYear || 0;
    }
    return data.total[selectedYear] || 0;
  }, [data, selectedYear]);

  // Available years from API data
  const availableYears = useMemo(() => {
    const list = [];
    if (data?.years && data.years.length > 0) {
      return data.years.slice(0, 4); // show last 3-4 years
    }
    const currentYear = new Date().getFullYear();
    return [String(currentYear), String(currentYear - 1)];
  }, [data]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.bg.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* ── Top Header Row ────────────────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text
            style={[
              styles.contributionsTotal,
              { color: colors.text.primary, fontSize: scaleFont(15) },
            ]}
          >
            {loading ? 'Loading contributions…' : `${totalCount} contributions in ${selectedYear === 'lastYear' ? 'the last year' : selectedYear}`}
          </Text>
          <Text style={[styles.subText, { color: colors.text.muted, fontSize: scaleFont(11) }]}>
            GitHub Public Contributions Calendar
          </Text>
        </View>

        {/* Year Buttons (2026, 2025, etc.) */}
        <View style={styles.yearButtonsRow}>
          <TouchableOpacity
            style={[
              styles.yearBtn,
              selectedYear === 'lastYear' && styles.yearBtnActive,
              {
                backgroundColor: selectedYear === 'lastYear' ? colors.indigo[500] : colors.bg.cardElevated,
                borderColor: selectedYear === 'lastYear' ? colors.indigo[400] : colors.border.subtle,
              },
            ]}
            onPress={() => setSelectedYear('lastYear')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.yearBtnText,
                {
                  color: selectedYear === 'lastYear' ? '#ffffff' : colors.text.secondary,
                  fontSize: scaleFont(11),
                  fontWeight: selectedYear === 'lastYear' ? '700' : '500',
                },
              ]}
            >
              Recent
            </Text>
          </TouchableOpacity>

          {availableYears.map((yr) => {
            const isActive = selectedYear === yr;
            return (
              <TouchableOpacity
                key={yr}
                style={[
                  styles.yearBtn,
                  isActive && styles.yearBtnActive,
                  {
                    backgroundColor: isActive ? colors.indigo[500] : colors.bg.cardElevated,
                    borderColor: isActive ? colors.indigo[400] : colors.border.subtle,
                  },
                ]}
                onPress={() => setSelectedYear(yr)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.yearBtnText,
                    {
                      color: isActive ? '#ffffff' : colors.text.secondary,
                      fontSize: scaleFont(11),
                      fontWeight: isActive ? '700' : '500',
                    },
                  ]}
                >
                  {yr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* ── Active Day Inspection Banner (when user taps a square) ── */}
      {selectedDay && (
        <View
          style={[
            styles.selectedDayBanner,
            {
              backgroundColor: colors.bg.cardElevated,
              borderColor: colors.indigo[500] + '50',
            },
          ]}
        >
          <Text style={[styles.selectedDayCount, { color: colors.emerald[400], fontSize: scaleFont(12) }]}>
            ● {selectedDay.count} contribution{selectedDay.count !== 1 ? 's' : ''}
          </Text>
          <Text style={[styles.selectedDayDate, { color: colors.text.secondary, fontSize: scaleFont(12) }]}>
            on {formatDate(selectedDay.date)}
          </Text>
          <TouchableOpacity onPress={() => setSelectedDay(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={[styles.dismissBtn, { color: colors.text.muted }]}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Main Contribution Heatmap Grid ────────────────────────── */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.emerald[400]} />
          <Text style={[styles.loadingText, { color: colors.text.muted, fontSize: scaleFont(12) }]}>
            Fetching GitHub heatmap…
          </Text>
        </View>
      ) : (
        <View style={styles.matrixWrapper}>
          {/* Weekday Labels (Mon, Wed, Fri) on the Left */}
          <View style={styles.weekdayLabelsColumn}>
            <View style={styles.weekdaySpacer} />
            <Text style={[styles.weekdayLabel, { color: colors.text.muted, fontSize: scaleFont(9) }]}>Mon</Text>
            <View style={styles.weekdayGap} />
            <Text style={[styles.weekdayLabel, { color: colors.text.muted, fontSize: scaleFont(9) }]}>Wed</Text>
            <View style={styles.weekdayGap} />
            <Text style={[styles.weekdayLabel, { color: colors.text.muted, fontSize: scaleFont(9) }]}>Fri</Text>
          </View>

          {/* Scrollable Heatmap Weeks */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scrollableHeatmap}
          >
            <View>
              {/* Month Headers (Nov, Dec, Jan, Feb...) */}
              <View style={styles.monthsRow}>
                {monthHeaders.map((m, idx) => (
                  <Text
                    key={`${m.label}_${idx}`}
                    style={[
                      styles.monthLabel,
                      {
                        left: m.weekIndex * 14,
                        color: colors.text.muted,
                        fontSize: scaleFont(10),
                      },
                    ]}
                  >
                    {m.label}
                  </Text>
                ))}
              </View>

              {/* Matrix Columns */}
              <View style={styles.weeksGrid}>
                {weeks.map((week, wIdx) => (
                  <View key={`week_${wIdx}`} style={styles.weekColumn}>
                    {/* Fill days 0..6 (Sun to Sat) */}
                    {[0, 1, 2, 3, 4, 5, 6].map((dayIdx) => {
                      const dayData = week.find((d) => d.dayOfWeek === dayIdx);
                      if (!dayData) {
                        return (
                          <View
                            key={`empty_${wIdx}_${dayIdx}`}
                            style={[styles.daySquare, { opacity: 0 }]}
                          />
                        );
                      }

                      const cellColor = levelColors[Math.min(dayData.level || 0, 4)];
                      const isCellSelected = selectedDay?.date === dayData.date;

                      return (
                        <TouchableOpacity
                          key={dayData.date}
                          onPress={() => setSelectedDay(dayData)}
                          activeOpacity={0.65}
                          style={[
                            styles.daySquare,
                            {
                              backgroundColor: cellColor,
                              borderColor: isCellSelected ? colors.indigo[400] : colors.border.subtle,
                              borderWidth: isCellSelected ? 1.5 : 0.5,
                            },
                          ]}
                          accessibilityLabel={`${dayData.count} contributions on ${dayData.date}`}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      )}

      {/* ── Footer Row: Learn Link + Less / More Legend ──────────── */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerHint, { color: colors.text.muted, fontSize: scaleFont(10) }]}>
          Tap any cell to inspect activity
        </Text>

        <View style={styles.legendWrap}>
          <Text style={[styles.legendText, { color: colors.text.muted, fontSize: scaleFont(10) }]}>Less</Text>
          {levelColors.map((color, idx) => (
            <View
              key={`legend_${idx}`}
              style={[
                styles.legendSquare,
                { backgroundColor: color, borderColor: colors.border.subtle },
              ]}
            />
          ))}
          <Text style={[styles.legendText, { color: colors.text.muted, fontSize: scaleFont(10) }]}>More</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.cardPadding,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  titleWrap: {
    flex: 1,
    minWidth: 160,
  },
  contributionsTotal: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subText: {
    marginTop: 2,
  },
  yearButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  yearBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  yearBtnActive: {
    borderColor: '#6366f1',
  },
  yearBtnText: {
    letterSpacing: -0.2,
  },
  selectedDayBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  selectedDayCount: {
    fontWeight: '700',
  },
  selectedDayDate: {
    flex: 1,
    marginLeft: 8,
  },
  dismissBtn: {
    fontSize: 12,
    paddingHorizontal: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  loadingText: {
    fontWeight: '500',
  },
  matrixWrapper: {
    flexDirection: 'row',
    marginTop: 6,
  },
  weekdayLabelsColumn: {
    width: 26,
    paddingTop: 18,
    alignItems: 'flex-start',
  },
  weekdaySpacer: {
    height: 12,
  },
  weekdayGap: {
    height: 16,
  },
  weekdayLabel: {
    lineHeight: 12,
    fontWeight: '500',
  },
  scrollableHeatmap: {
    paddingRight: 10,
  },
  monthsRow: {
    height: 18,
    position: 'relative',
    marginBottom: 4,
  },
  monthLabel: {
    position: 'absolute',
    fontWeight: '600',
    top: 0,
  },
  weeksGrid: {
    flexDirection: 'row',
    gap: 3,
  },
  weekColumn: {
    flexDirection: 'column',
    gap: 3,
  },
  daySquare: {
    width: 11,
    height: 11,
    borderRadius: 2,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  footerHint: {
    fontStyle: 'italic',
  },
  legendWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  legendText: {
    marginHorizontal: 2,
    fontWeight: '500',
  },
  legendSquare: {
    width: 10,
    height: 10,
    borderRadius: 2,
    borderWidth: 0.5,
  },
});

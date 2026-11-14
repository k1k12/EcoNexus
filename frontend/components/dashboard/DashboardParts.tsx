import React from "react";
import { View, Text, StyleSheet, ViewStyle } from "react-native";

import { useThemeContext } from "@/context/ThemeContext";
import { FONT } from "@/constants/Fonts";

/**
 * DashboardParts
 *
 * Small building blocks shared by the user and council dashboards: panels,
 * headline numbers and simple bar charts. They're plain views rather than a
 * chart library so they read clearly in both themes and screen readers get
 * the numbers as text.
 */

export function useDashboardColours() {
  const { theme } = useThemeContext();
  const isDark = theme.type === "dark";
  return {
    theme,
    isDark,
    panel: isDark ? theme.bg_secondary : "#ffffff",
    track: isDark ? "#22382a" : "#e3eee4",
    // A quieter fill for "others" and ordinary days, so the accent stands out
    quiet: isDark ? "#3d6b4c" : "#9fbfa8",
    faint: isDark ? "#9fb4a4" : "#55645a",
    border: isDark ? "#2c4a36" : "#d5ddd6",
  };
}

// Packaging names read better with "plastic" on the end of the resin codes
const MATERIAL_LABELS: Record<string, string> = {
  PET: "PET plastic",
  HDPE: "HDPE plastic",
  PVC: "PVC plastic",
  LDPE: "LDPE plastic",
  PP: "PP plastic",
  PS: "PS plastic",
};

export function materialLabel(name: string) {
  const known = MATERIAL_LABELS[name.toUpperCase()];
  if (known) return known;
  return name.charAt(0).toUpperCase() + name.slice(1);
}

export function Panel({ children, style }: { children: React.ReactNode; style?: ViewStyle | ViewStyle[] }) {
  const c = useDashboardColours();
  return <View style={[{ backgroundColor: c.panel, borderRadius: 16, padding: 24 }, style as ViewStyle]}>{children}</View>;
}

export function PanelTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  const c = useDashboardColours();
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: c.theme.text }} accessibilityRole="header">{title}</Text>
      {subtitle && <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: c.theme.text_muted, marginTop: 4 }}>{subtitle}</Text>}
    </View>
  );
}

type StatCardProps = {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean; // filled with the accent colour
  accentValue?: boolean; // just the number in the accent colour
  minWidth?: number;
};

export function StatCard({ label, value, unit, highlight, accentValue, minWidth = 200 }: StatCardProps) {
  const c = useDashboardColours();
  const text = highlight ? c.theme.on_accent : c.theme.text;
  const muted = highlight ? c.theme.on_accent : c.theme.text_muted;
  return (
    <View
      style={{ flexGrow: 1, flexBasis: minWidth, minWidth: 0, padding: 20, borderRadius: 16, backgroundColor: highlight ? c.theme.accent : c.panel }}
      accessible
      accessibilityLabel={`${label}: ${value}${unit ? " " + unit : ""}`}
    >
      <Text style={{ fontFamily: highlight ? FONT.semiBold : FONT.regular, fontSize: 15, color: muted }}>{label}</Text>
      <Text style={{ marginTop: 6, fontFamily: FONT.bold, fontSize: value.length > 7 ? 30 : 40, letterSpacing: -1, color: accentValue ? c.theme.accent : text }}>
        {value}
        {unit && <Text style={{ fontFamily: FONT.medium, fontSize: 16, letterSpacing: 0, color: muted }}> {unit}</Text>}
      </Text>
    </View>
  );
}

type RankedBarsProps = {
  data: Record<string, number>;
  show?: number; // how many to show before grouping the rest as "others"
};

// Horizontal bars, biggest first, with the small ones grouped together
export function RankedBars({ data, show = 6 }: RankedBarsProps) {
  const c = useDashboardColours();
  const sorted = Object.entries(data).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const top = sorted.slice(0, show);
  const rest = sorted.slice(show);
  const rows = top.map(([name, n]) => ({ label: materialLabel(name), value: n, other: false }));
  if (rest.length > 0) {
    rows.push({ label: `${rest.length} other${rest.length === 1 ? "" : "s"}`, value: rest.reduce((s, [, n]) => s + n, 0), other: true });
  }
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <View style={{ gap: 13 }}>
      {rows.map((row) => (
        <View key={row.label} style={{ flexDirection: "row", alignItems: "center", gap: 12 }} accessible accessibilityLabel={`${row.label}: ${row.value}`}>
          <Text style={{ width: 112, fontFamily: FONT.regular, fontSize: 15, color: row.other ? c.theme.text_muted : c.theme.text }} numberOfLines={1}>{row.label}</Text>
          <View style={{ flex: 1, height: 14, borderRadius: 7, backgroundColor: c.track, overflow: "hidden" }}>
            <View style={{ width: `${(row.value / max) * 100}%`, height: "100%", borderRadius: 7, backgroundColor: row.other ? c.quiet : c.theme.accent }} />
          </View>
          <Text style={{ width: 48, textAlign: "right", fontFamily: FONT.bold, fontSize: 15, color: c.theme.text }}>{row.value.toLocaleString()}</Text>
        </View>
      ))}
    </View>
  );
}

type WeekBarsProps = {
  days: { label: string; value: number; fullName: string }[];
  height?: number;
};

// Vertical bars for a week, with the best day picked out in the accent colour
export function WeekBars({ days, height = 200 }: WeekBarsProps) {
  const c = useDashboardColours();
  const max = Math.max(1, ...days.map((d) => d.value));
  const best = Math.max(...days.map((d) => d.value));
  const summary = days.map((d) => `${d.fullName} ${d.value}`).join(", ");

  return (
    <View style={{ height: height + 56, flexDirection: "row", alignItems: "flex-end", gap: 12 }} accessible accessibilityRole="image" accessibilityLabel={summary}>
      {days.map((day) => {
        const isBest = best > 0 && day.value === best;
        return (
          <View key={day.fullName} style={{ flex: 1, alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: day.value === 0 ? c.faint : isBest ? c.theme.accent : c.theme.text }}>{day.value}</Text>
            <View
              style={{
                width: "100%",
                height: day.value === 0 ? 4 : Math.max(8, (day.value / max) * height),
                borderTopLeftRadius: day.value === 0 ? 4 : 10,
                borderTopRightRadius: day.value === 0 ? 4 : 10,
                borderBottomLeftRadius: 4,
                borderBottomRightRadius: 4,
                backgroundColor: day.value === 0 ? c.track : isBest ? c.theme.accent : c.quiet,
              }}
            />
            <Text style={{ fontFamily: isBest ? FONT.bold : FONT.regular, fontSize: 14, color: isBest ? c.theme.text : c.theme.text_muted }}>{day.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

export const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
});

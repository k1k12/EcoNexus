import React, { useEffect, useMemo, useState } from "react"
import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native"
import { router } from "expo-router"

import { withAuth } from "@/utils/withAuth"
import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import { usePage } from "@/context/PageContext"
import { useAuth } from "@/context/AuthContext"
import LoadingScreen from "@/components/core/LoadingScreen"
import { FONT } from "@/constants/Fonts"
import { Panel, PanelTitle, StatCard, RankedBars, WeekBars, materialLabel, useDashboardColours, styles as parts } from "@/components/dashboard/DashboardParts"

/**
 * Dashboard Component (residents)
 *
 * Shows how a user's recycling is going: a one-line summary, four headline
 * numbers, the last seven days, which materials they recycle most, and a rough
 * idea of what that saves. Everything comes from GET /dashboard.
 */

type DashboardResponse = {
  progress: {
    items_per_day_over_last_week: Record<string, number>
    improvement_over_last_week: number
    average_items_per_week_over_last_month: number
  }
  environmental_impact: {
    turtles_saved: number
    trees_saved: number
    co2_saved: number
  }
  statistics: {
    materials_recycled: Record<string, number>
  }
}

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"]
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// Up to 2 decimal places, without floating point noise like 0.9500000000000001
const round = (n: number) => Math.round(n * 100) / 100

const Dashboard: React.FC = () => {
  const c = useDashboardColours()
  const { theme } = c
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const { userData } = useAuth()
  const { showToastNotification } = usePage()
  const [data, setData] = useState<DashboardResponse | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await fetchProtectedEndpoint(`${BACKEND_URL}/dashboard`, { method: "GET" })
      if (!response.ok) {
        showToastNotification("Cannot retrieve dashboard data, please try again.")
        return
      }
      setData(await response.json())
    }
    load()
  }, [])

  const view = useMemo(() => {
    if (!data) return null
    const perDay = data.progress.items_per_day_over_last_week

    // The last seven days, ending today
    const today = new Date().getDay()
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = (today - 6 + i + 7) % 7
      return { label: DAY_NAMES[d].slice(0, 3), fullName: DAY_NAMES[d], value: perDay[DAY_KEYS[d]] || 0 }
    })
    const thisWeek = days.reduce((sum, d) => sum + d.value, 0)
    const bestDay = days.reduce((best, d) => (d.value > best.value ? d : best), days[0])

    const materials = data.statistics.materials_recycled
    const topMaterial = Object.entries(materials).sort((a, b) => b[1] - a[1])[0]
    const allTime = Object.values(materials).reduce((sum, n) => sum + n, 0)

    return {
      days,
      thisWeek,
      bestDay,
      change: Math.round(data.progress.improvement_over_last_week),
      average: round(data.progress.average_items_per_week_over_last_month),
      materials,
      topMaterial,
      allTime,
      impact: data.environmental_impact,
    }
  }, [data])

  if (!data || !view) return <LoadingScreen />

  const name = userData?.firstName ?? "there"
  const items = (n: number) => `${n} item${n === 1 ? "" : "s"}`

  // A sentence that still makes sense when there's nothing to compare with yet
  let summary: React.ReactNode
  if (view.thisWeek === 0) {
    summary = <>You haven't recycled anything in the last 7 days. Scan something to get started.</>
  } else if (view.change > 0) {
    summary = <>You recycled <Text style={{ fontFamily: FONT.bold, color: theme.text }}>{items(view.thisWeek)}</Text> in the last 7 days, <Text style={{ fontFamily: FONT.bold, color: theme.accent }}>{view.change}% more</Text> than the week before.</>
  } else if (view.change < 0) {
    summary = <>You recycled <Text style={{ fontFamily: FONT.bold, color: theme.text }}>{items(view.thisWeek)}</Text> in the last 7 days, {Math.abs(view.change)}% fewer than the week before.</>
  } else {
    summary = <>You recycled <Text style={{ fontFamily: FONT.bold, color: theme.text }}>{items(view.thisWeek)}</Text> in the last 7 days.</>
  }

  const changeText = view.change > 0 ? `+${view.change}%` : `${view.change}%`

  return (
    <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: wide ? 24 : 8, paddingTop: 24 }}>

        <View style={{ flexDirection: wide ? "row" : "column", alignItems: wide ? "flex-end" : "flex-start", gap: 12 }}>
          <View style={{ flex: wide ? 1 : undefined }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 48 : 36, letterSpacing: -1.5, color: theme.text }} accessibilityRole="header">Hi {name},</Text>
            <Text style={{ fontFamily: FONT.regular, fontSize: wide ? 22 : 18, lineHeight: wide ? 30 : 26, color: theme.text_muted, marginTop: 10, maxWidth: 680 }}>{summary}</Text>
          </View>
          {view.change > 0 && (
            <Text style={{ fontFamily: FONT.hand, fontSize: 30, color: theme.accent, transform: [{ rotate: "-4deg" }] }}>keep it going!</Text>
          )}
        </View>

        <View style={[parts.row, { marginTop: 28 }]}>
          <StatCard label="Last 7 days" value={`${view.thisWeek}`} unit={view.thisWeek === 1 ? "item" : "items"} />
          <StatCard label="Compared with the week before" value={view.change === 0 ? "No change" : changeText} accentValue={view.change > 0} />
          <StatCard label="Weekly average" value={`${view.average}`} unit="over 4 weeks" />
          <StatCard label="You recycle most" value={view.topMaterial ? materialLabel(view.topMaterial[0]) : "Nothing yet"} />
        </View>

        <View style={[parts.row, { marginTop: 16 }]}>
          <Panel style={{ flexGrow: 1, flexBasis: 440, minWidth: 0 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <PanelTitle title="The last 7 days" subtitle="Items recycled each day" />
              {view.bestDay.value > 0 && (
                <Text style={{ fontFamily: FONT.hand, fontSize: 24, color: theme.accent, transform: [{ rotate: "-6deg" }] }}>best day: {view.bestDay.fullName}</Text>
              )}
            </View>
            <WeekBars days={view.days} />
          </Panel>

          <Panel style={{ flexGrow: 1, flexBasis: 440, minWidth: 0 }}>
            <PanelTitle title="What you recycle" subtitle={`All ${view.allTime.toLocaleString()} of your items, by material`} />
            {view.allTime > 0 ? (
              <RankedBars data={view.materials} />
            ) : (
              <Text style={{ fontFamily: FONT.regular, fontSize: 16, color: theme.text_muted }}>Your materials show up here once you've recycled something.</Text>
            )}
          </Panel>
        </View>

        <View style={{ marginTop: 16, padding: 24, borderRadius: 16, backgroundColor: c.isDark ? "#f2f5ef" : theme.bg_secondary }}>
          <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "baseline", gap: 12 }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: "#142019" }} accessibilityRole="header">What this week adds up to</Text>
            <Text style={{ fontFamily: FONT.hand, fontSize: 22, color: "#2f6b45" }}>(rough estimates)</Text>
          </View>
          <View style={[parts.row, { marginTop: 16 }]}>
            {[
              { value: `${round(view.impact.co2_saved)} kg`, text: "of CO₂ kept out of the air" },
              { value: `${round(view.impact.trees_saved)}`, text: "trees' worth of paper and card saved" },
              { value: `${round(view.impact.turtles_saved)}`, text: "turtles' worth of plastic kept out of the sea" },
            ].map((item) => (
              <View key={item.text} style={{ flexGrow: 1, flexBasis: 220, minWidth: 0, paddingTop: 14, borderTopWidth: 2, borderColor: "#142019" }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 36, letterSpacing: -1, color: "#142019" }}>{item.value}</Text>
                <Text style={{ fontFamily: FONT.regular, fontSize: 16, lineHeight: 23, color: "#3a4a40", marginTop: 4 }}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>

        {view.thisWeek === 0 && (
          <Pressable onPress={() => router.navigate("/scan")} accessibilityRole="button" style={{ alignSelf: "flex-start", marginTop: 20, minHeight: 48, paddingHorizontal: 22, borderRadius: 12, backgroundColor: theme.accent, justifyContent: "center" }}>
            <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: theme.on_accent }}>Scan something</Text>
          </Pressable>
        )}
      </View>
    </ScrollView>
  )
}

export default withAuth(Dashboard, ["USER"])

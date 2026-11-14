import { useEffect, useMemo, useState } from "react"
import { View, Text, ScrollView, Pressable, useWindowDimensions } from "react-native"

import { withAuth } from "@/utils/withAuth"
import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import LoadingScreen from "@/components/core/LoadingScreen"
import { usePage } from "@/context/PageContext"
import { FONT } from "@/constants/Fonts"
import { Panel, PanelTitle, StatCard, WeekBars, useDashboardColours, styles as parts } from "@/components/dashboard/DashboardParts"

/**
 * AdminPage Component
 *
 * The admin's overview of the whole app: how many residents and recycling points
 * there are, how much was recycled over the last week, which councils are approved,
 * and the council accounts waiting to be approved.
 * Data comes from GET /admin/overview and GET /pending-councils.
 */

type PendingCouncil = {
  gss_code: string
  council_name: string
  requested_by: string
  requested_on: string
}

type Overview = {
  residents: number
  recycling_points: number
  councils: { gss_code: string; name: string; points: number }[]
  items_last_week: { date: string; items: number }[]
  items_all_time: number
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

// "today", "yesterday" or "3 days ago"
const howLongAgo = (isoDate: string) => {
  const [y, m, d] = isoDate.split("-").map(Number)
  const today = new Date()
  const days = Math.round((Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) - Date.UTC(y, m - 1, d)) / 86_400_000)
  if (days <= 0) return "today"
  if (days === 1) return "yesterday"
  return `${days} days ago`
}

const AdminPage = () => {
  const c = useDashboardColours()
  const { theme } = c
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const { showToastNotification } = usePage()
  const [overview, setOverview] = useState<Overview | null>(null)
  const [pending, setPending] = useState<PendingCouncil[] | null>(null)

  const load = async () => {
    const [overviewRes, pendingRes] = await Promise.all([
      fetchProtectedEndpoint(`${BACKEND_URL}/admin/overview`),
      fetchProtectedEndpoint(`${BACKEND_URL}/pending-councils`),
    ])
    if (!overviewRes.ok || !pendingRes.ok) {
      showToastNotification("Couldn't load the admin data, please try again.")
      return
    }
    setOverview(await overviewRes.json())
    setPending((await pendingRes.json()).pending_councils)
  }

  useEffect(() => {
    load()
  }, [])

  const handleApprove = async (council: PendingCouncil) => {
    const res = await fetchProtectedEndpoint(`${BACKEND_URL}/council-approval/${council.gss_code}`, { method: "PATCH" })
    if (!res.ok) {
      showToastNotification("Error, please try again.")
      return
    }
    showToastNotification(`${council.council_name} approved`)
    load()
  }

  const week = useMemo(() => {
    if (!overview) return null
    const days = overview.items_last_week.map((d, i, all) => {
      const day = DAY_NAMES[new Date(d.date + "T12:00:00").getDay()]
      return { label: i === all.length - 1 ? "Today" : day.slice(0, 3), fullName: day, value: d.items }
    })
    return { days, total: days.reduce((sum, d) => sum + d.value, 0) }
  }, [overview])

  if (!overview || !pending || !week) return <LoadingScreen />

  const councilCount = overview.councils.length
  const muted = { fontFamily: FONT.regular, fontSize: 16, color: theme.text_muted }

  return (
    <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: wide ? 24 : 8, paddingTop: 24 }}>

        <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: theme.accent }}>Admin</Text>
        <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 44 : 32, letterSpacing: -1.5, color: theme.text, marginTop: 6 }} accessibilityRole="header">
          How EcoNexus is doing
        </Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: wide ? 20 : 17, color: theme.text_muted, marginTop: 10 }}>
          Everyone using it, and councils waiting to be let in.
        </Text>

        <View style={[parts.row, { marginTop: 28 }]}>
          <StatCard label="Waiting for you" value={`${pending.length}`} unit={pending.length === 1 ? "council to approve" : "councils to approve"} highlight />
          <StatCard label="Residents" value={overview.residents.toLocaleString()} />
          <StatCard label="Recycling points" value={overview.recycling_points.toLocaleString()} unit={`across ${councilCount} ${councilCount === 1 ? "council" : "councils"}`} />
          <StatCard label="Items this week" value={week.total.toLocaleString()} unit={`${overview.items_all_time.toLocaleString()} all time`} />
        </View>

        <View style={[parts.row, { marginTop: 16 }]}>
          <Panel style={{ flexGrow: 2, flexBasis: 520, minWidth: 0 }}>
            <PanelTitle title="Councils waiting for approval" subtitle="Approving lets them add and edit points in their area." />
            {pending.length === 0 ? (
              <Text style={muted}>Nothing waiting. Nice.</Text>
            ) : (
              <View style={{ gap: 10 }}>
                {pending.map((council) => (
                  <View
                    key={council.gss_code + council.requested_by}
                    style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14, padding: 16, borderRadius: 14, backgroundColor: theme.bg_primary }}
                  >
                    <View style={{ flexGrow: 1, flexBasis: 220 }}>
                      <Text style={{ fontFamily: FONT.bold, fontSize: 18, color: theme.text }}>{council.council_name}</Text>
                      <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: theme.text_muted, marginTop: 4 }}>
                        {council.requested_by} · area {council.gss_code} · asked {howLongAgo(council.requested_on)}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => handleApprove(council)}
                      accessibilityRole="button"
                      accessibilityLabel={`Approve ${council.council_name}`}
                      style={({ hovered }: any) => ({
                        paddingVertical: 11, paddingHorizontal: 20, borderRadius: 10,
                        backgroundColor: theme.accent, opacity: hovered ? 0.85 : 1,
                      })}
                    >
                      <Text style={{ fontFamily: FONT.bold, fontSize: 15, color: theme.on_accent }}>Approve</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Panel>

          <Panel style={{ flexGrow: 1, flexBasis: 320, minWidth: 0 }}>
            <PanelTitle title="Approved councils" />
            {overview.councils.length === 0 ? (
              <Text style={muted}>No councils yet.</Text>
            ) : (
              overview.councils.map((council) => (
                <View key={council.gss_code} style={{ flexDirection: "row", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: c.border }}>
                  <Text style={{ flex: 1, fontFamily: FONT.semiBold, fontSize: 15, color: theme.text }}>{council.name}</Text>
                  <Text style={{ fontFamily: FONT.regular, fontSize: 15, color: theme.text_muted }}>{council.points} points</Text>
                </View>
              ))
            )}
          </Panel>
        </View>

        <Panel style={{ marginTop: 16 }}>
          <PanelTitle title="Items recycled, last 7 days" subtitle="Everything scanned across every council." />
          <WeekBars days={week.days} />
        </Panel>

        <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: theme.text_muted, marginTop: 18 }}>
          Demo data resets whenever the server restarts.
        </Text>
      </View>
    </ScrollView>
  )
}

export default withAuth(AdminPage, ["ADMIN"])

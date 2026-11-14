import React, { useEffect, useMemo, useState } from "react"
import { View, Text, ScrollView, useWindowDimensions } from "react-native"
import Svg, { Circle, G } from "react-native-svg"

import { withAuth } from "@/utils/withAuth"
import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import { usePage } from "@/context/PageContext"
import { useAuth } from "@/context/AuthContext"
import LoadingScreen from "@/components/core/LoadingScreen"
import { FONT } from "@/constants/Fonts"
import { Panel, PanelTitle, StatCard, RankedBars, materialLabel, useDashboardColours, styles as parts } from "@/components/dashboard/DashboardParts"

/**
 * CouncilDashboard Component
 *
 * What's been recycled across a council's points: headline numbers, the
 * materials people bring, the busiest points and a dot map where bigger dots
 * mean busier points.
 *
 * Data:
 *   - GET /dashboard: items per material at each point
 *   - GET /recycling-points?gss_code=…: where each point is and what it takes
 *   - GET /all-councils: the council's name
 */

type PointInfo = {
  point_id: number
  latitude: number
  longitude: number
  materials: string[]
}

type PointRow = PointInfo & { items: number }

const MAP_W = 480
const MAP_H = 260

const CouncilDashboard: React.FC = () => {
  const c = useDashboardColours()
  const { theme } = c
  const { width } = useWindowDimensions()
  const wide = width >= 900
  const { userData } = useAuth()
  const { showToastNotification } = usePage()

  const [frequencies, setFrequencies] = useState<Record<string, Record<string, number>> | null>(null)
  const [points, setPoints] = useState<PointInfo[]>([])
  const [councilName, setCouncilName] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      const response = await fetchProtectedEndpoint(`${BACKEND_URL}/dashboard`)
      if (!response.ok) {
        showToastNotification("Couldn't fetch dashboard data, please try again")
        return
      }
      setFrequencies((await response.json()).material_frequencies)

      // The points and the council's name are extras: the page still works without them
      const gss = userData?.gssCode
      if (!gss) return
      try {
        const [pointsRes, councilsRes] = await Promise.all([
          fetch(`${BACKEND_URL}/recycling-points?gss_code=${encodeURIComponent(gss)}`),
          fetch(`${BACKEND_URL}/all-councils`),
        ])
        if (pointsRes.ok) setPoints(await pointsRes.json())
        if (councilsRes.ok) {
          const councils: { gss_code: string; name: string }[] = await councilsRes.json()
          setCouncilName(councils.find((x) => x.gss_code === gss)?.name ?? null)
        }
      } catch {
        // Leave the extras out if the network drops
      }
    }
    load()
  }, [])

  const view = useMemo(() => {
    if (!frequencies) return null

    const materials: Record<string, number> = {}
    const itemsByPoint: Record<string, number> = {}
    for (const [pointId, counts] of Object.entries(frequencies)) {
      itemsByPoint[pointId] = 0
      for (const [material, n] of Object.entries(counts)) {
        materials[material] = (materials[material] || 0) + n
        itemsByPoint[pointId] += n
      }
    }
    const total = Object.values(materials).reduce((s, n) => s + n, 0)
    const topMaterial = Object.entries(materials).sort((a, b) => b[1] - a[1])[0]

    const rows: PointRow[] = points.map((p) => ({ ...p, items: itemsByPoint[String(p.point_id)] || 0 }))
    const busiest = [...rows].sort((a, b) => b.items - a.items).filter((r) => r.items > 0).slice(0, 5)
    const pointCount = points.length || Object.keys(frequencies).length

    // Fit the points into the little map, squashing longitude so the shape looks right at UK latitudes
    let dots: { x: number; y: number; r: number; busy: boolean; id: number }[] = []
    if (rows.length > 0) {
      const lats = rows.map((r) => r.latitude)
      const lons = rows.map((r) => r.longitude)
      const minLat = Math.min(...lats), maxLat = Math.max(...lats)
      const minLon = Math.min(...lons), maxLon = Math.max(...lons)
      const squash = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180)
      const spanX = Math.max((maxLon - minLon) * squash, 0.001)
      const spanY = Math.max(maxLat - minLat, 0.001)
      const scale = Math.min((MAP_W - 60) / spanX, (MAP_H - 60) / spanY)
      const offsetX = (MAP_W - spanX * scale) / 2
      const offsetY = (MAP_H - spanY * scale) / 2
      const maxItems = Math.max(1, ...rows.map((r) => r.items))
      dots = rows
        .map((r) => ({
          id: r.point_id,
          x: offsetX + (r.longitude - minLon) * squash * scale,
          y: offsetY + (maxLat - r.latitude) * scale,
          r: r.items === 0 ? 4 : 5 + 17 * Math.sqrt(r.items / maxItems),
          busy: r.items > 0,
        }))
        .sort((a, b) => b.r - a.r) // small dots on top so they stay visible
    }

    return { materials, total, topMaterial, busiest, pointCount, dots }
  }, [frequencies, points])

  if (!view) return <LoadingScreen />

  const takes = (list: string[]) => {
    const names = list.map((m) => materialLabel(m).toLowerCase())
    if (names.length <= 3) return names.join(", ")
    return `${names.slice(0, 3).join(", ")} +${names.length - 3}`
  }

  return (
    <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 40 }}>
      <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: wide ? 24 : 8, paddingTop: 24 }}>

        <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: theme.accent }}>Council dashboard</Text>
        <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 44 : 32, letterSpacing: -1.5, color: theme.text, marginTop: 6 }} accessibilityRole="header">
          {councilName ?? "Your area"}
        </Text>
        <Text style={{ fontFamily: FONT.regular, fontSize: wide ? 20 : 17, color: theme.text_muted, marginTop: 10 }}>
          Everything logged at your recycling points.
        </Text>

        <View style={[parts.row, { marginTop: 28 }]}>
          <StatCard label="Items recycled" value={view.total.toLocaleString()} highlight />
          <StatCard label="Recycling points" value={`${view.pointCount}`} />
          <StatCard label="Most recycled" value={view.topMaterial ? materialLabel(view.topMaterial[0]) : "Nothing yet"} unit={view.topMaterial ? `${view.topMaterial[1].toLocaleString()} items` : undefined} />
          <StatCard label="Busiest point" value={view.busiest[0] ? `#${view.busiest[0].point_id}` : "None yet"} unit={view.busiest[0] ? `${view.busiest[0].items.toLocaleString()} items` : undefined} />
        </View>

        <View style={[parts.row, { marginTop: 16 }]}>
          <Panel style={{ flexGrow: 1, flexBasis: 440, minWidth: 0 }}>
            <PanelTitle title="What people bring" subtitle="Items by material, across all your points" />
            {view.total > 0 ? (
              <RankedBars data={view.materials} show={8} />
            ) : (
              <Text style={{ fontFamily: FONT.regular, fontSize: 16, color: theme.text_muted }}>Nothing has been logged at your points yet.</Text>
            )}
          </Panel>

          <View style={{ flexGrow: 1, flexBasis: 440, minWidth: 0, gap: 16 }}>
            <Panel>
              <PanelTitle title="Busiest points" />
              {view.busiest.length === 0 ? (
                <Text style={{ fontFamily: FONT.regular, fontSize: 16, color: theme.text_muted }}>Your points' activity shows up here.</Text>
              ) : (
                <View>
                  <View style={{ flexDirection: "row", paddingBottom: 8 }}>
                    <Text style={{ width: 64, fontFamily: FONT.medium, fontSize: 14, color: theme.text_muted }}>Point</Text>
                    <Text style={{ flex: 1, fontFamily: FONT.medium, fontSize: 14, color: theme.text_muted }}>Takes</Text>
                    <Text style={{ width: 64, textAlign: "right", fontFamily: FONT.medium, fontSize: 14, color: theme.text_muted }}>Items</Text>
                  </View>
                  {view.busiest.map((row) => (
                    <View key={row.point_id} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 12, borderTopWidth: 1, borderColor: c.border }} accessible accessibilityLabel={`Point ${row.point_id}, takes ${takes(row.materials)}, ${row.items} items`}>
                      <Text style={{ width: 64, fontFamily: FONT.bold, fontSize: 15, color: theme.text }}>#{row.point_id}</Text>
                      <Text style={{ flex: 1, fontFamily: FONT.regular, fontSize: 15, color: theme.text_muted }} numberOfLines={1}>{takes(row.materials)}</Text>
                      <Text style={{ width: 64, textAlign: "right", fontFamily: FONT.bold, fontSize: 15, color: theme.text }}>{row.items.toLocaleString()}</Text>
                    </View>
                  ))}
                </View>
              )}
            </Panel>

            {view.dots.length > 0 && (
              <Panel style={{ position: "relative" }}>
                <PanelTitle title="Where it happens" />
                <Text style={{ position: "absolute", top: 20, right: 20, fontFamily: FONT.hand, fontSize: 22, color: theme.accent, transform: [{ rotate: "-3deg" }] }}>bigger dot = busier point</Text>
                <View accessible accessibilityRole="image" accessibilityLabel={`Map of your ${view.dots.length} recycling points, sized by how busy they are`}>
                  <Svg width="100%" height={220} viewBox={`0 0 ${MAP_W} ${MAP_H}`}>
                    <G>
                      {view.dots.map((dot) => (
                        <Circle
                          key={dot.id}
                          cx={dot.x}
                          cy={dot.y}
                          r={dot.r}
                          fill={dot.busy ? theme.accent : "none"}
                          fillOpacity={0.8}
                          stroke={dot.busy ? "none" : c.faint}
                          strokeWidth={1.5}
                        />
                      ))}
                    </G>
                  </Svg>
                </View>
              </Panel>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  )
}

export default withAuth(CouncilDashboard, ["COUNCIL"])

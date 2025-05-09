import type React from "react"
import { useState, useMemo } from "react"
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable, Platform } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { BarChart, PieChart } from "react-native-gifted-charts"
import ArrowUpIcon from "@/assets/icons/arrowup"
import ArrowDownIcon from "@/assets/icons/arrowdown"
import RecycleIcon from "@/assets/icons/recycle"
import HomeIcon from "@/assets/icons/home"
import ClockIcon from "@/assets/icons/clock"
import CityIcon from "@/assets/icons/city"
import BarchartIcon from "@/assets/icons/barchart"
import UsersIcon from "@/assets/icons/users"
import { withAuth } from "@/utils/withAuth"


// Mock data for council dashboard
const areaRecyclingData = [
  { id: 1, area: "North District", items: 1243, value: 1243 },
  { id: 2, area: "Central District", items: 1875, value: 1875 },
  { id: 3, area: "East District", items: 1340, value: 1340 },
  { id: 4, area: "West District", items: 1592, value: 1592 },
  { id: 5, area: "South District", items: 1762, value: 1762 },
]

const monthlyData = [
  { month: "Jan", items: 4120, label: "Jan", value: 4120 },
  { month: "Feb", items: 4580, label: "Feb", value: 4580 },
  { month: "Mar", items: 5230, label: "Mar", value: 5230 },
  { month: "Apr", items: 5780, label: "Apr", value: 5780 },
  { month: "May", items: 6120, label: "May", value: 6120 },
  { month: "Jun", items: 7250, label: "Jun", value: 7250 },
]

const materialData = [
  { id: 1, material: "Plastic", amount: 45, value: 45, color: "#6d987aff", text: "Plastic" }, //cambridge blue
  { id: 2, material: "Paper", amount: 32, value: 32, color: "#355841ff", text: "Paper" }, //hunter green
  { id: 3, material: "Glass", amount: 18, value: 18, color: "#8fb39b", text: "Glass" }, //hardcoded colour
  { id: 4, material: "Metal", amount: 15, value: 15, color: "#1e2f25ff", text: "Metal" },//dark green
  { id: 5, material: "Cardboard", amount: 28, value: 28, color: "#4a7257", text: "Cardboard" }, //hardcoded colour
]

const CouncilDashboard: React.FC = () => {
  const { theme } = useThemeContext()
  const { width } = useWindowDimensions()
  const [activeMaterial, setActiveMaterial] = useState<number | null>(null)

  // Calculate chart dimensions based on container width
  const chartWidth = width > 1200 ? 900 : width > 768 ? width * 0.85 : width * 0.9
  const cardWidth = width > 768 ? "48%" : "100%"

  // Create a grid-like layout similar to the web version
  const gridLayout = width > 768

  // Total recycled items
  const totalRecycled = monthlyData.reduce((acc, curr) => acc + curr.items, 0)
  const totalHouseholds = 28450
  const participationRate = 74
  const collectionEfficiency = 92

  // Calculate month-over-month change
  const currentMonth = monthlyData[monthlyData.length - 1].items
  const previousMonth = monthlyData[monthlyData.length - 2].items
  const percentChange = ((currentMonth - previousMonth) / previousMonth) * 100

  // Calculate percentages for each material
  const totalMaterial = materialData.reduce((sum, item) => sum + item.amount, 0)
  const materialPercentages = materialData.map((item) => ({
    ...item,
    percentage: Math.round((item.amount / totalMaterial) * 100),
  }))

  // Format bar chart data for react-native-gifted-charts
  const barData = useMemo(() => {
    return monthlyData.map((item) => ({
      value: item.items,
      label: item.month,
      frontColor: "#6d987a", // cambridge-blue
      topLabelComponent: () => (
        <View style={styles.barLabelContainer}>
          <Text style={[styles.barLabel, { color: "#355841" }]}>{(item.items / 1000).toFixed(1)}k</Text>
        </View>
      ),
      disablePress: true,
    }))
  }, [])

  // Enhanced pie chart data with consistent percentage positioning
  const pieData = useMemo(() => {
    return materialPercentages.map((item) => {
      const isActive = activeMaterial === item.id

      return {
        value: item.amount,
        color: item.color,
        // Increase stroke width and use white color for active segment
        strokeWidth: isActive ? 2 : 1,
        strokeColor: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
        // Increase radius for active segment
        focused: isActive,
        // Only show percentage when segment is active
        text: isActive ? `${item.percentage}%` : "",
        textColor: "#ffffff",
        textSize: 14,
        fontWeight: "bold",
        // Use a custom label component for all segments
        labelComponent: isActive
          ? () => (
              <View
                style={{
                  position: "absolute",
                  backgroundColor: `${item.color}dd`, // Use segment color with transparency
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#ffffff",
                  // Position consistently for all segments
                  top: "50%",
                  left: "50%",
                  transform: [{ translateX: 25 }, { translateY: -15 }], // Offset from center
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 16 }}>{item.percentage}%</Text>
              </View>
            )
          : undefined,
        showText: false,
        id: item.id,
        onPress: () => setActiveMaterial(isActive ? null : item.id),
      }
    })
  }, [activeMaterial, materialPercentages])

  const styles = StyleSheet.create({
    container: {
      width: "100%",
      flex: 1,
      backgroundColor: theme.bg_primary || "#f5f7f5",
    },
    contentContainer: {
      flexGrow: 1,
    },
    header: {
      marginBottom: 24,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: "bold",
      color: "#355841", // hunter-green
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 18,
      color: "#6d987a", // cambridge-blue
      marginBottom: 16,
    },
    card: {
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      marginBottom: 24,
      padding: 10,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      justifyContent: "space-evenly"
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
    },
    cardIcon: {
      marginRight: 12,
      backgroundColor: "rgba(109, 152, 122, 0.1)",
      padding: 8,
      borderRadius: 8,
    },
    cardTitle: {
      fontSize: 22,
      fontWeight: "600",
      color: "#355841", // hunter-green
    },
    cardDescription: {
      fontSize: 16,
      color: "#6d987a", // cambridge-blue
      marginBottom: 16,
    },
    summaryRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      marginBottom: 16,
    },
    summaryItem: {
      width: width > 768 ? "24%" : "100%",
      backgroundColor: "rgba(109, 152, 122, 0.05)",
      justifyContent: "center",
      alignItems: "center",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(109, 152, 122, 0.1)",
    },
    summaryItemHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    summaryIcon: {
      marginRight: 8,
      backgroundColor: "rgba(109, 152, 122, 0.1)",
      padding: 6,
      borderRadius: 8,
    },
    summaryLabel: {
      fontSize: 14,
      color: "#6d987a", // cambridge-blue
      flexShrink: 1,
    },
    summaryValue: {
      fontSize: 24,
      fontWeight: "bold",
      color: "#355841", // hunter-green
      marginTop: 4,
    },
    summaryUnit: {
      fontSize: 14,
      color: "#6d987a", // cambridge-blue
      marginTop: 4,
    },
    chartsRow: {
      flexDirection: gridLayout ? "row" : "column",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 24,
    },
    chartCard: {
      width: gridLayout ? "49%" : "100%",
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      marginBottom: gridLayout ? 0 : 24,
    },
    chartContainer: {
      width: "100%",
      alignItems: "center",
      marginVertical: 16,
      height: 380, // Increased from 320
    },
    barLabelContainer: {
      backgroundColor: "rgba(109, 152, 122, 0.1)",
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 12,
      fontWeight: "600",
    },
    percentChangeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      marginTop: 8,
      marginBottom: 12,
    },
    percentChange: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: percentChange >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    percentText: {
      fontSize: 14,
      fontWeight: "600",
      marginLeft: 4,
    },
    pieChartSection: {
      flexDirection: "column",
    },
    pieChartContainer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      height: 280, // Increased from 220
    },
    legendContainer: {
      width: "100%",
      marginTop: 16,
    },
    legendRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
    },
    legendItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 8,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: 6,
      width: "48%",
    },
    legendItemActive: {
      backgroundColor: "rgba(109, 152, 122, 0.15)",
    },
    legendLeftContent: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    legendColor: {
      width: 12,
      height: 12,
      borderRadius: 6,
      marginRight: 8,
    },
    legendText: {
      fontSize: 14,
      color: "#355841",
    },
    legendTextActive: {
      fontWeight: "700",
    },
    legendPercentage: {
      fontSize: 14,
      color: "#355841",
      fontWeight: "600",
    },
    totalContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    totalValue: {
      fontSize: 28, // Increased from 24
      fontWeight: "700",
      color: "#355841",
    },
    totalLabel: {
      fontSize: 14,
      color: "#6d987a",
    },
    districtTableContainer: {
      width: "70%", // Reduced from 80%
      maxWidth: 600, // Add a max width to prevent it from being too wide on large screens
      alignSelf: "center", // Center the table
      marginTop: 16,
      marginBottom: 8,
      backgroundColor: "rgba(109, 152, 122, 0.05)",
      borderRadius: 8,
      overflow: "hidden",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "rgba(109, 152, 122, 0.1)",
      paddingVertical: 10,
      paddingHorizontal: 16,
    },
    tableHeaderText: {
      fontSize: 16,
      fontWeight: "600",
      color: "#355841",
    },
    tableRow: {
      flexDirection: "row",
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderBottomWidth: 1,
      borderBottomColor: "rgba(109, 152, 122, 0.1)",
    },
    tableColumn: {
      flex: 1,
    },
    tableText: {
      fontSize: 15,
      color: "#355841",
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: "rgba(109, 152, 122, 0.1)",
      borderRadius: 4,
      overflow: "hidden",
      marginTop: 8,
    },
    progressBar: {
      height: "100%",
      backgroundColor: "#6d987a",
    },
  })

  // Find the district with the highest recycling
  const maxDistrictItems = Math.max(...areaRecyclingData.map((district) => district.items))

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Council Recycling Dashboard</Text>
          <Text style={styles.headerSubtitle}>City-wide recycling metrics and performance analysis</Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
            <BarchartIcon width={24} height={24} stroke={theme.secondary}/>
            </View>
            <Text style={styles.cardTitle}>Recycling Overview</Text>
          </View>
          <Text style={styles.cardDescription}>Key performance indicators for the current fiscal year</Text>

          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <View style={styles.summaryItemHeader}>
                <View style={styles.summaryIcon}>
                <RecycleIcon width={24} height={24} stroke={theme.secondary}/>
                </View>
                <Text style={styles.summaryLabel}>Total Recycled</Text>
              </View>
              <Text style={styles.summaryValue}>{totalRecycled.toLocaleString()}</Text>
              <Text style={styles.summaryUnit}>items</Text>
            </View>

            <View style={styles.summaryItem}>
              <View style={styles.summaryItemHeader}>
                <View style={styles.summaryIcon}>
                <HomeIcon width={24} height={24} stroke={theme.secondary}/>
                </View>
                <Text style={styles.summaryLabel}>Participating Households</Text>
              </View>
              <Text style={styles.summaryValue}>{totalHouseholds.toLocaleString()}</Text>
              <Text style={styles.summaryUnit}>households</Text>
            </View>

          </View>
        </View>

        {/* Charts Row - Bar Chart and Pie Chart side by side */}
        <View style={styles.chartsRow}>
          {/* Monthly Progress Chart */}
          <View style={[styles.chartCard, { width: gridLayout ? "58%" : "100%" }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
              <BarchartIcon width={24} height={24} stroke={theme.secondary}/>
              </View>
              <Text style={styles.cardTitle}>Monthly Recycling Progress</Text>
            </View>
            <Text style={styles.cardDescription}>Total recycled items by month</Text>

            <View style={styles.percentChangeRow}>
              <View style={styles.percentChange}>
                {percentChange >= 0 ? (
                  <ArrowUpIcon width={14} height={14} stroke="#22c55e" />
                ) : (
                  <ArrowDownIcon width={14} height={14} stroke="#ef4444" />
                )}
                <Text style={[styles.percentText, { color: percentChange >= 0 ? "#22c55e" : "#ef4444" }]}>
                  {Math.abs(percentChange).toFixed(1)}% from previous month
                </Text>
              </View>
            </View>

            <View style={[styles.chartContainer, { height: 380 }]}>
              <BarChart
                data={barData}
                width={gridLayout ? chartWidth * 0.55 - 60 : chartWidth - 80}
                height={340} // Increased from 280
                barWidth={gridLayout ? 30 : 40}
                spacing={gridLayout ? 15 : 20}
                barBorderRadius={6}
                yAxisTextStyle={{ color: "#355841", fontSize: 12 }}
                xAxisLabelTextStyle={{ color: "#355841", fontSize: 12 }}
                noOfSections={5}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisColor="rgba(53, 88, 65, 0.2)"
                xAxisColor="rgba(53, 88, 65, 0.2)"
                backgroundColor="rgba(109, 152, 122, 0.05)"
                rulesColor="rgba(53, 88, 65, 0.1)"
                rulesType="solid"
                showYAxisIndices={false}
                disablePress={true}
                activeOpacity={1}
              />
            </View>
          </View>

          {/* Material Breakdown Pie Chart */}
          <View style={[styles.chartCard, { width: gridLayout ? "38%" : "100%" }]}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
              <RecycleIcon width={24} height={24} stroke={theme.secondary}/>
              </View>
              <Text style={styles.cardTitle}>Material Breakdown</Text>
            </View>
            <Text style={styles.cardDescription}>Recycled items by material type - click on the data to see percentages</Text>

            <View style={styles.pieChartSection}>
              <View style={[styles.pieChartContainer, { height: 280 }]}>
                <PieChart
                  data={pieData}
                  donut
                  radius={95} // Increased from 85
                  innerRadius={50} // Increased from 45
                  focusOnPress
                  toggleFocusOnPress
                  showText
                  centerLabelComponent={() => (
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalValue}>{totalMaterial.toLocaleString()}</Text>
                      <Text style={styles.totalLabel}>Total</Text>
                    </View>
                  )}
                />
              </View>

              {/* Reorganized legend into 2 columns */}
              <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                  {materialPercentages.map((item) => {
                    const isActive = activeMaterial === item.id
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.legendItem, isActive && styles.legendItemActive]}
                        onPress={() => setActiveMaterial(isActive ? null : item.id)}
                      >
                        <View style={styles.legendLeftContent}>
                          <View
                            style={[
                              styles.legendColor,
                              {
                                backgroundColor: item.color,
                                width: isActive ? 16 : 12,
                                height: isActive ? 16 : 12,
                                borderWidth: isActive ? 2 : 0,
                                borderColor: "#ffffff",
                              },
                            ]}
                          />
                          <Text style={[styles.legendText, isActive && styles.legendTextActive]}>{item.material}</Text>
                        </View>
                        <Text style={styles.legendPercentage}>{item.amount.toLocaleString()}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, { width: gridLayout ? "70%" : "90%", alignSelf: "center" }]}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
            <CityIcon width={24} height={24} stroke={theme.secondary}/>
            </View>
            <Text style={styles.cardTitle}>District Performance</Text>
          </View>
          <Text style={styles.cardDescription}>Recycling metrics by district</Text>

          <View style={styles.districtTableContainer}>
            <View style={styles.tableHeader}>
              <View style={[styles.tableColumn, { flex: 2 }]}>
                <Text style={styles.tableHeaderText}>District</Text>
              </View>
              <View style={styles.tableColumn}>
                <Text style={styles.tableHeaderText}>Items</Text>
              </View>
            </View>

            {areaRecyclingData.map((item) => {
              const progressPercentage = (item.items / maxDistrictItems) * 100

              return (
                <View key={item.id} style={styles.tableRow}>
                  <View style={[styles.tableColumn, { flex: 2 }]}>
                    <Text style={styles.tableText}>{item.area}</Text>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                    </View>
                  </View>
                  <View style={styles.tableColumn}>
                    <Text style={styles.tableText}>{item.items.toLocaleString()}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default withAuth(CouncilDashboard, ["COUNCIL"])

"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { BarChart, PieChart } from "react-native-gifted-charts"
import ArrowUpIcon from "@/assets/icons/arrowup"
import ArrowDownIcon from "@/assets/icons/arrowdown"
import LeafIcon from "@/assets/icons/leaf"
import RecycleIcon from "@/assets/icons/recycle"
import TreeIcon from "@/assets/icons/tree"
import BulbIcon from "@/assets/icons/lightbulb"
import TurtleIcon from "@/assets/icons/turtle"
import { withAuth } from "@/utils/withAuth"

// Mock data
const weeklyData = [
  { week: "Week 1", items: 12, label: "W1", value: 12 },
  { week: "Week 2", items: 19, label: "W2", value: 19 },
  { week: "Week 3", items: 15, label: "W3", value: 15 },
  { week: "Week 4", items: 22, label: "W4", value: 22 },
  { week: "Week 5", items: 26, label: "W5", value: 26 },
  { week: "Week 6", items: 24, label: "W6", value: 24 },
]

const materialData = [
  { id: 1, material: "Plastic", amount: 45, value: 45, color: "#6d987aff", text: "Plastic" }, //cambridge blue
  { id: 2, material: "Paper", amount: 32, value: 32, color: "#355841ff", text: "Paper" }, //hunter green
  { id: 3, material: "Glass", amount: 18, value: 18, color: "#8fb39b", text: "Glass" }, //hardcoded colour
  { id: 4, material: "Metal", amount: 15, value: 15, color: "#1e2f25ff", text: "Metal" },//dark green
  { id: 5, material: "Cardboard", amount: 28, value: 28, color: "#4a7257", text: "Cardboard" }, //hardcoded colour
]

const Dashboard: React.FC = () => {
  const { theme } = useThemeContext()
  const { width } = useWindowDimensions()
  const [activeSegment, setActiveSegment] = useState<number | null>(null)

  // Calculate chart dimensions based on container width
  const chartWidth = width > 1200 ? 900 : width > 768 ? width * 0.85 : width * 0.9
  const cardWidth = width > 768 ? "48%" : "100%"

  // Create a grid-like layout similar to the web version
  const gridLayout = width > 768

  // Calculate metrics
  const currentWeekItems = weeklyData[weeklyData.length - 1].items
  const previousWeekItems = weeklyData[weeklyData.length - 2].items
  const percentChange = ((currentWeekItems - previousWeekItems) / previousWeekItems) * 100
  const averageWeekly = weeklyData.reduce((acc, curr) => acc + curr.items, 0) / weeklyData.length
  const totalItems = materialData.reduce((acc, curr) => acc + curr.amount, 0)

  // Environmental impact calculations
  const treesSaved = Math.round(totalItems * 0.05)
  const turtlesSaved = Math.round(totalItems * 0.02)
  const co2Reduced = Math.round(totalItems * 2.5)

  // Get a motivational tip based on the percentage change
  const getMotivationalTip = () => {
    if (percentChange >= 0) {
      return "Great job! Keep recycling to increase your impact."
    } else {
      return "Try recycling one more item each day to boost your numbers!"
    }
  }

  // Format bar chart data for react-native-gifted-charts
  const barData = useMemo(() => {
    return weeklyData.map((item) => ({
      value: item.items,
      label: item.week.replace("Week ", "W"),
      frontColor: theme.primary,
      topLabelComponent: () => (
        <View style={styles.barLabelContainer}>
          <Text style={[styles.barLabel, { color: theme.secondary }]}>{item.items}</Text>
        </View>
      ),
      disablePress: true, // Disable press functionality
    }))
  }, [theme.primary, theme.secondary])

  // Calculate percentages for each material
  const totalAmount = materialData.reduce((sum, item) => sum + item.amount, 0)
  const materialPercentages = materialData.map((item) => ({
    ...item,
    percentage: Math.round((item.amount / totalAmount) * 100),
  }))

  // Enhanced pie chart data with consistent percentage positioning
  const pieData = useMemo(() => {
    return materialPercentages.map((item) => {
      const isActive = activeSegment === item.id

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
                  transform: [{ translateX: 20 }, { translateY: -12 }], // Offset from center
                }}
              >
                <Text style={{ color: "#ffffff", fontWeight: "bold", fontSize: 14 }}>{item.percentage}%</Text>
              </View>
            )
          : undefined,
        showText: false,
        id: item.id,
        onPress: () => setActiveSegment(isActive ? null : item.id),
      }
    })
  }, [activeSegment, materialPercentages])

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      backgroundColor: theme.bg_primary || "#f5f7f5",
    },
    contentContainer: {
      flexGrow: 1,
      padding: 16,
    },
    header: {
      marginBottom: 16,
    },
    headerTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: theme.secondary,
      marginBottom: 4,
    },
    headerSubtitle: {
      fontSize: 14,
      color: theme.primary,
      marginBottom: 12,
    },
    gridContainer: {
      flexDirection: gridLayout ? "row" : "column",
      flexWrap: "wrap",
      justifyContent: "space-between",
      width: "100%",
    },
    card: {
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      marginBottom: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    fullWidthCard: {
      width: "100%",
    },
    halfWidthCard: {
      width: cardWidth,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 8,
    },
    cardIcon: {
      marginRight: 8,
      backgroundColor: `${theme.primary}20`,
      padding: 6,
      borderRadius: 8,
    },
    cardTitle: {
      fontSize: 16,
      color: theme.secondary,
      fontWeight: "600",
    },
    cardDescription: {
      fontSize: 12,
      color: theme.primary,
      marginBottom: 12,
    },
    chartsRow: {
      flexDirection: gridLayout ? "row" : "column",
      justifyContent: "space-between",
      width: "100%",
      marginBottom: 16,
    },
    chartCard: {
      width: gridLayout ? "49%" : "100%",
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: gridLayout ? 0 : 16,
      overflow: "hidden"
    },
    environmentalCard: {
      width: gridLayout ? "70%" : "100%",
      alignSelf: "center",
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    impactRow: {
      flexDirection: gridLayout ? "row" : "column",
      justifyContent: "space-between",
      flexWrap: "wrap",
    },
    barChartCard: {
      width: gridLayout ? "58%" : "100%",
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      marginBottom: gridLayout ? 0 : 16,
    },
    pieChartCard: {
      width: gridLayout ? "38%" : "100%",
      backgroundColor: theme.bg_secondary || "#ffffff",
      borderRadius: 12,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
    },
    chartContainer: {
      width: "100%",
      alignItems: "center",
      marginVertical: 8,
      height: 180,
    },
    barLabelContainer: {
      backgroundColor: `${theme.primary}20`,
      paddingHorizontal: 4,
      paddingVertical: 2,
      borderRadius: 4,
    },
    barLabel: {
      fontSize: 10,
      fontWeight: "600",
    },
    percentChangeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 8,
      marginBottom: 12,
    },
    percentChange: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: percentChange >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", // Keep these colors for semantic meaning
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    percentText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
      color: percentChange >= 0 ? "#22c55e" : "#ef4444",
    },
    tipContainer: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${theme.primary}20`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      maxWidth: "60%",
    },
    tipText: {
      fontSize: 11,
      color: theme.secondary,
      marginLeft: 4,
    },
    statsRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 12,
    },
    statBox: {
      flex: 1,
      backgroundColor: `${theme.primary}20`,
      borderRadius: 8,
      padding: 12,
      marginHorizontal: 4,
    },
    statLabel: {
      fontSize: 12,
      color: theme.secondary,
    },
    statValue: {
      fontSize: 16,
      color: theme.secondary,
      fontWeight: "600",
      marginTop: 4,
    },
    impactContainer: {
      marginTop: 8,
    },
    impactItem: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      backgroundColor: `${theme.primary}10`,
      padding: 10,
      borderRadius: 8,
      width: gridLayout ? "31%" : "100%",
    },
    impactContent: {
      flex: 1,
    },
    impactIcon: {
      marginRight: 10,
      backgroundColor: `${theme.primary}20`,
      padding: 6,
      borderRadius: 8,
    },
    impactLabel: {
      fontSize: 12,
      color: theme.primary,
    },
    impactValue: {
      fontSize: 16,
      color: theme.secondary,
      fontWeight: "600",
    },
    impactSubtext: {
      fontSize: 11,
      color: theme.primary,
      marginTop: 2,
    },
    pieChartSection: {
      flexDirection: "column",
    },
    pieChartContainer: {
      width: "100%",
      alignItems: "center",
      justifyContent: "center",
      height: 220,
    },
    legendContainer: {
      width: "100%",
      marginTop: 10,
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
      marginBottom: 6,
      paddingVertical: 4,
      paddingHorizontal: 6,
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
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 6,
    },
    legendText: {
      fontSize: 12,
      color: theme.secondary,
    },
    legendTextActive: {
      fontWeight: "700",
    },
    legendPercentage: {
      fontSize: 12,
      color: theme.secondary,
      fontWeight: "600",
    },
    totalContainer: {
      alignItems: "center",
      justifyContent: "center",
    },
    totalValue: {
      fontSize: 24,
      fontWeight: "700",
      color: theme.secondary,
    },
    totalLabel: {
      fontSize: 12,
      color: theme.primary,
    },
  })

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Recycling Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your recycling progress and environmental impact</Text>
        </View>

        {/* Bar chart and pie chart side by side with equal width */}
        <View style={styles.chartsRow}>
          {/* Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <RecycleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <Text style={styles.cardTitle}>Weekly Recycling Progress</Text>
            </View>
            <Text style={styles.cardDescription}>Items recycled per week</Text>

            <View style={styles.chartContainer}>
              <BarChart
                data={barData}
                width={gridLayout ? chartWidth * 0.45 - 40 : chartWidth - 60}
                height={160}
                barWidth={gridLayout ? 22 : 30}
                spacing={gridLayout ? 12 : 20}
                barBorderRadius={4}
                yAxisTextStyle={{ color: theme.secondary, fontSize: 10 }}
                xAxisLabelTextStyle={{ color: theme.secondary, fontSize: 10 }}
                yAxisColor={`${theme.secondary}40`}
                xAxisColor={`${theme.secondary}40`}
                backgroundColor={`${theme.primary}10`}
                rulesColor={`${theme.secondary}20`}
                noOfSections={5}
                yAxisThickness={1}
                xAxisThickness={1}
                yAxisLabelTexts={["0", "5", "10", "15", "20", "25"]}
              />
            </View>

            <View style={styles.percentChangeRow}>
              <View style={styles.percentChange}>
                {percentChange >= 0 ? (
                  <ArrowUpIcon width={14} height={14} stroke="#22c55e" />
                ) : (
                  <ArrowDownIcon width={14} height={14} stroke="#ef4444" />
                )}
                <Text style={[styles.percentText, { color: percentChange >= 0 ? "#22c55e" : "#ef4444" }]}>
                  {Math.abs(percentChange).toFixed(1)}% from last week
                </Text>
              </View>

              {/* Added motivational tip */}
              <View style={styles.tipContainer}>
                <BulbIcon width={14} height={14} stroke={theme.secondary} />
                <Text style={styles.tipText}>{getMotivationalTip()}</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average Per Week</Text>
                <Text style={styles.statValue}>{averageWeekly.toFixed(1)} items</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Current Week</Text>
                <Text style={styles.statValue}>{currentWeekItems} items</Text>
              </View>
            </View>
          </View>

          {/* Pie Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <RecycleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <Text style={styles.cardTitle}>Recycling Statistics</Text>
            </View>
            <Text style={styles.cardDescription}>Breakdown by material type - select the data to see percentages</Text>

            <View style={styles.pieChartSection}>
              <View style={styles.pieChartContainer}>
                <PieChart
                  data={pieData}
                  donut
                  radius={80}
                  innerRadius={45}
                  focusOnPress
                  toggleFocusOnPress
                  showText
                  centerLabelComponent={() => (
                    <View style={styles.totalContainer}>
                      <Text style={styles.totalValue}>{totalItems}</Text>
                      <Text style={styles.totalLabel}>Total</Text>
                    </View>
                  )}
                />
              </View>

              <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                  {materialPercentages.map((item) => {
                    const isActive = activeSegment === item.id
                    return (
                      <Pressable
                        key={item.id}
                        style={[styles.legendItem, isActive && styles.legendItemActive]}
                        onPress={() => setActiveSegment(isActive ? null : item.id)}
                      >
                        <View style={styles.legendLeftContent}>
                          <View
                            style={[
                              styles.legendColor,
                              {
                                backgroundColor: item.color,
                                width: isActive ? 14 : 10,
                                height: isActive ? 14 : 10,
                                borderWidth: isActive ? 2 : 0,
                                borderColor: "#ffffff",
                              },
                            ]}
                          />
                          <Text style={[styles.legendText, isActive && styles.legendTextActive]}>{item.material}</Text>
                        </View>
                        <Text style={styles.legendPercentage}>{item.amount}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Environmental Impact */}
        <View style={styles.environmentalCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardIcon}>
              <LeafIcon width={18} height={18} stroke={theme.secondary} />
            </View>
            <Text style={styles.cardTitle}>Environmental Impact</Text>
          </View>
          <Text style={styles.cardDescription}>Your contribution to the planet</Text>

          <View style={styles.impactRow}>
            <View style={styles.impactItem}>
              <View style={styles.impactIcon}>
                <TreeIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <View style={styles.impactContent}>
                <Text style={styles.impactLabel}>Trees Saved</Text>
                <Text style={styles.impactValue}>{treesSaved}</Text>
                <Text style={styles.impactSubtext}>That's enough oxygen for {treesSaved * 2} people!</Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={styles.impactIcon}>
                <TurtleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <View style={styles.impactContent}>
                <Text style={styles.impactLabel}>Turtles Saved</Text>
                <Text style={styles.impactValue}>{turtlesSaved}</Text>
                <Text style={styles.impactSubtext}>By keeping plastic out of our oceans</Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={styles.impactIcon}>
                <RecycleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <View style={styles.impactContent}>
                <Text style={styles.impactLabel}>CO₂ Reduced</Text>
                <Text style={styles.impactValue}>{co2Reduced} kg</Text>
                <Text style={styles.impactSubtext}>
                  Equivalent to {Math.round(co2Reduced / 10)} days without driving
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default withAuth(Dashboard, ["USER"])

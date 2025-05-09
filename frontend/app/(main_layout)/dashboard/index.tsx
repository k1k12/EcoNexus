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

import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import { usePage } from "@/context/PageContext"
import LoadingScreen from "@/components/core/LoadingScreen"
import { generateColor } from "@/utils/superMegaHackyColorGenerator"
import MaterialPercentagesPieChart from "@/components/charts/MaterialPercentagesPieChart"


/**
 * Dashboard Component
 *
 * This component displays a comprehensive recycling dashboard for users, providing insights into their recycling progress and environmental impact.
 * It includes several key sections:
 *   1. Weekly Recycling Progress Chart: A bar chart visualizing the number of items recycled each week.
 *   2. Recycling Statistics Pie Chart: A pie chart illustrating the breakdown of recycled items by material type.
 *   3. Environmental Impact Metrics: Displays key metrics such as trees saved, turtles saved, and CO2 reduced.
 *
 * Key Features:
 *   - Responsive layout that adapts to different screen sizes, providing an optimal viewing experience on both desktop and mobile devices.
 *   - Interactive charts that allow users to explore the data in more detail.
 *   - Theme context integration for consistent styling and appearance.
 *   - Mock data for demonstration purposes, with the potential to integrate with real-time data sources.
 *   - User authentication via withAuth to ensure only logged-in users can access the dashboard.
 *
 * Data Sources:
 *   - weeklyData: Mock data representing the number of items recycled each week.
 *   - materialData: Mock data representing the breakdown of recycled items by material type.
 *
 * Functions:
 *   - The component utilizes various helper functions and calculations to derive meaningful insights from the data, such as calculating percentage changes, averages, and environmental impact metrics.
 *   - It also implements event handlers for user interactions, such as clicking on pie chart segments to view percentages.
 */

const Dashboard: React.FC = () => {
  const { theme } = useThemeContext()
  const { width } = useWindowDimensions()
  const [activeSegment, setActiveSegment] = useState<string | null>(null);
  const { showToastNotification } = usePage();

  const [fetchedDashboardData, setDashboardData] = useState<any | null>(null);
  const [processedDashboardData, setProcessedDashboardData] = useState<any | null>(null);

  // Calculate chart dimensions based on container width
  const chartWidth = width > 1200 ? 900 : width > 768 ? width * 0.85 : width * 0.9
  const cardWidth = width > 768 ? "48%" : "100%"

  // Create a grid-like layout similar to the web version
  const gridLayout = width > 768

  useEffect(() => {
    const fetchDashboardData = async () => {
        const response = await fetchProtectedEndpoint(`${BACKEND_URL}/dashboard`,
                                                      {method: "GET"})
        if (!response.ok) {
           showToastNotification("Cannot retrieve dashboard data, please try again.");
           return;
        }
        const data = await response.json();
        console.log("UserDashboard: dashboard data response: ", data);
        setDashboardData(data);
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
      if (!fetchedDashboardData) return;

      const itemsPerDayOverLastWeek: Record<string, number> = fetchedDashboardData.progress.items_per_day_over_last_week;

      // Check if there's no data (empty object)
      const enoughData = Object.keys(itemsPerDayOverLastWeek).length > 0;
      if (!enoughData) {
      // If there's no data, set default values or handle accordingly
      setProcessedDashboardData({
          itemsPerDayOverLastWeek: {},
          averageDaily: 0,
          totalItemsOverLastWeek: 0,
          enoughData: false,
          chartData: [],
          improvementOverLastWeek: 0,
          avgItemsPerWeekOverLastMonth: 0,
          turtlesSaved: 0,
          treesSaved: 0,
          co2Saved: 0
      });
      return;
      }
      // Calculate total and average
      const totalItemsOverLastWeek: number = Object.values(itemsPerDayOverLastWeek)
      .reduce((sum: number, val: number): number => sum + val, 0);
      const averageDaily: number = totalItemsOverLastWeek / Object.keys(itemsPerDayOverLastWeek).length;
      // Set the chart data for each day of the week, filling missing days with 0
      const daysOfWeek = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
      const barchartData = daysOfWeek.map((day) => {
          const value = itemsPerDayOverLastWeek[day] || 0;  // Default to 0 if day not found
              return {
                  value,
                  label: day.charAt(0).toUpperCase() + day.slice(1),  // Capitalize first letter of day
                  frontColor: theme.primary,
                  topLabelComponent: () => (
                      <View style={styles.barLabelContainer}>
                      <Text style={[styles.barLabel, { color: theme.secondary }]}>{value}</Text>
                      </View>
                  ),
                  disablePress: true,
              };
      });
      const materialsRecycled : Record<string, number> = fetchedDashboardData.statistics.materials_recycled;
      const totalRecycled = Object.values(materialsRecycled).reduce((sum: number, amount: number) => sum + amount, 0);
      let pieData;
      let materialPercentages;
      // If no data, piedata is null
      if (totalRecycled === 0) {
          pieData = null;
      }
      else {
          materialPercentages = Object.entries(materialsRecycled).map(([material, amount]) => {
              const percentage = ((amount / totalRecycled) * 100).toFixed(2); // Calculate percentage
              const color = generateColor(material); // Generate color for each material
              return {
                  name: material,
                  value: amount,
                  percentage: percentage,
                  color: color, // Dynamic color based on material
              };
          });
      }
      // Set the state with the calculated data
      setProcessedDashboardData({
          itemsPerDayOverLastWeek,
          averageDaily,
          totalItemsOverLastWeek,
          enoughData: true,
          barchartData,
          materialPercentages,
          improvementOverLastWeek: fetchedDashboardData.progress.improvement_over_last_week,
          avgItemsPerWeekOverLastMonth: fetchedDashboardData.progress.average_items_per_week_over_last_month,
          turtlesSaved: fetchedDashboardData.environmental_impact.turtles_saved,
          treesSaved: fetchedDashboardData.environmental_impact.trees_saved,
          co2Saved: fetchedDashboardData.environmental_impact.co2_saved,
      });
  }, [fetchedDashboardData, theme.primary, theme.secondary, activeSegment]);

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
      justifyContent: "space-between", width: "100%",
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
      //backgroundColor: percentChange >= 0 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", // Keep these colors for semantic meaning
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
    },
    percentText: {
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 4,
      //color: percentChange >= 0 ? "#22c55e" : "#ef4444",
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

  if (!fetchedDashboardData || !processedDashboardData) return <LoadingScreen />;
  if (!processedDashboardData.enoughData){
      return (
        <View style={{justifyContent: "center"}}>
            <Text style={{color: theme.text, textAlign: "center", textAlignVertical: "center", fontSize: 24}}>Not enough data yet, recycle more!</Text>
        </View>
      );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Your Recycling Dashboard</Text>
          <Text style={styles.headerSubtitle}>Track your recycling progress and environmental impact</Text>
        </View>

        <View style={styles.chartsRow}>
          {/* Bar Chart */}
          <View style={styles.chartCard}>
            <View style={styles.cardHeader}>
              <View style={styles.cardIcon}>
                <RecycleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <Text style={styles.cardTitle}>Daily Recycling Progress</Text>
            </View>
            <Text style={styles.cardDescription}>Items recycled per day over last week</Text>
            <View style={styles.chartContainer}>
              <BarChart
                data={processedDashboardData.barchartData}
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
            
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average Per Week Over Last Month</Text>
                <Text style={styles.statValue}>{processedDashboardData.avgItemsPerWeekOverLastMonth.toFixed(1)} items</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>Average daily</Text>
                <Text style={styles.statValue}>{processedDashboardData.averageDaily} items</Text>
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
                <MaterialPercentagesPieChart
                    data={processedDashboardData.materialPercentages}
                />
              </View>

              <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                  {processedDashboardData.materialPercentages.map((material: any) => {
                    const isActive = activeSegment === material.name
                    return (
                      <Pressable
                        key={material.id}
                        style={[styles.legendItem, isActive && styles.legendItemActive]}
                        onPress={() => setActiveSegment(isActive ? null : material.name)}
                      >
                        <View style={styles.legendLeftContent}>
                          <View
                            style={[
                              styles.legendColor,
                              {
                                backgroundColor: material.color,
                                width: isActive ? 14 : 10,
                                height: isActive ? 14 : 10,
                                borderWidth: isActive ? 2 : 0,
                                borderColor: "#ffffff",
                              },
                            ]}
                          />
                          <Text style={[styles.legendText, isActive && styles.legendTextActive]}>{material.name}</Text>
                        </View>
                        <Text style={styles.legendPercentage}>{material.amount}</Text>
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
                <Text style={styles.impactValue}>{processedDashboardData.treesSaved}</Text>
                <Text style={styles.impactSubtext}>That's enough oxygen for {processedDashboardData.treesSaved * 2} people!</Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={styles.impactIcon}>
                <TurtleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <View style={styles.impactContent}>
                <Text style={styles.impactLabel}>Turtles Saved</Text>
                <Text style={styles.impactValue}>{processedDashboardData.turtlesSaved}</Text>
                <Text style={styles.impactSubtext}>By keeping plastic out of our oceans</Text>
              </View>
            </View>

            <View style={styles.impactItem}>
              <View style={styles.impactIcon}>
                <RecycleIcon width={18} height={18} stroke={theme.secondary} />
              </View>
              <View style={styles.impactContent}>
                <Text style={styles.impactLabel}>CO₂ Reduced</Text>
                <Text style={styles.impactValue}>{processedDashboardData.co2Saved} kg</Text>
                <Text style={styles.impactSubtext}>
                  Equivalent to {Math.round(processedDashboardData.co2Saved / 10)} days without driving
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

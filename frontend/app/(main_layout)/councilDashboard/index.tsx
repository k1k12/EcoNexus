import type React from "react"
import { useState, useMemo, useEffect } from "react"
import { View, Text, StyleSheet, ScrollView, useWindowDimensions, Pressable, Platform } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { BarChart, PieChart } from "react-native-gifted-charts"
import { Svg, Circle, Path } from "react-native-svg"
import ArrowUpIcon from "@/assets/icons/arrowup"
import ArrowDownIcon from "@/assets/icons/arrowdown"
import RecycleIcon from "@/assets/icons/recycle"
import BarchartIcon from "@/assets/icons/barchart"
import { withAuth } from "@/utils/withAuth"
import { fetchProtectedEndpoint } from "@/utils/apiCalls"
import { BACKEND_URL } from "@/config"
import { usePage } from "@/context/PageContext"
import LoadingScreen from "@/components/core/LoadingScreen"
import MaterialPercentagesPieChart, { MaterialPercentage } from "@/components/charts/MaterialPercentagesPieChart"
import { generateColor } from "@/utils/superMegaHackyColorGenerator"

import UsersIcon from "@/assets/icons/users"

/**
 * CouncilDashboard Component
 *
 * This component displays a comprehensive recycling dashboard for council users, providing insights into city-wide recycling metrics and performance analysis.
 * It includes several key sections:
 *   1. Summary Cards: Displays key performance indicators (KPIs) such as total recycled items, participating households, participation rate, and collection efficiency.
 *   2. Monthly Recycling Progress Chart: A bar chart visualizing the total recycled items by month, along with a percentage change indicator compared to the previous month.
 *   3. Material Breakdown Pie Chart: A pie chart illustrating the breakdown of recycled items by material type, allowing users to click on segments to view percentages.
 *   4. District Performance Table: A table presenting recycling metrics by district, including the number of recycled items and a progress bar indicating performance relative to the highest-performing district.
 *
 * Key Features:
 *   - Responsive layout that adapts to different screen sizes, providing an optimal viewing experience on both desktop and mobile devices.
 *   - Interactive charts and tables that allow users to explore the data in more detail.
 *   - Theme context integration for consistent styling and appearance.
 *   - Mock data for demonstration purposes, with the potential to integrate with real-time data sources.
 *
 * Data Sources:
 *   - areaRecyclingData: Mock data representing recycling metrics for different districts.
 *   - monthlyData: Mock data representing total recycled items by month.
 *   - materialData: Mock data representing the breakdown of recycled items by material type.
 *
 * Functions:
 *   - The component utilizes various helper functions and calculations to derive meaningful insights from the data, such as calculating total recycled items, participation rates, and month-over-month changes.
 *   - It also implements event handlers for user interactions, such as clicking on pie chart segments to view percentages.
 */

const CouncilDashboard: React.FC = () => {
  const { theme } = useThemeContext()
  const { width } = useWindowDimensions()
  const [activeMaterial, setActiveMaterial] = useState<string | null>(null)
  const { showToastNotification } = usePage();
  const [fetchedDashboardData, setFetchedDashboardData] = useState<any | null>(null);
  const [processedDashboardData, setProcessedDashboardData] = useState<any | null>(null);

  // Create a grid-like layout similar to the web version
  const gridLayout = width > 768
    
  useEffect(() => {
      const fetchDashboardData = async () => {
          const response = await fetchProtectedEndpoint(`${BACKEND_URL}/dashboard`);
          if (!response.ok) {
              showToastNotification("Couldn't fetch dashboard data, please try again");
              return;
          }
          const data = await response.json();
          setFetchedDashboardData(data);
      };
      fetchDashboardData();
  }, []);

  useEffect(() => {
      if (!fetchedDashboardData) return;
      if (Object.keys(fetchedDashboardData.material_frequencies).length < 1) {
          setProcessedDashboardData({
              enoughData: false,
          });
          return;
      }
      // Step 1: Aggregate the material values
      const aggregatedMaterials = Object.entries(fetchedDashboardData.material_frequencies)
      .flatMap(([_, materialData]) => Object.entries(materialData))
      .reduce((acc: Record<string, number>, [material, value]) => {
          acc[material] = (acc[material] || 0) + value;
          return acc;
      }, {}); 


      // Step 2: Calculate the total sum of all materials
      const totalRecycled = Object.values(aggregatedMaterials).reduce(
          (sum, value) => sum + value,
              0
      );
      const materialPercentages: MaterialPercentage[] = Object.entries(aggregatedMaterials).map(
      ([name, value]) => {
        const percentage = ((value / totalRecycled) * 100).toFixed(2);
        const color = generateColor(name); // This can be adjusted

        return {
          name,
          value,
          percentage,
          color,
        };
      }
    );

      setProcessedDashboardData({
          totalRecycled,
          materialPercentages,
          enoughData: true
      });
  }, [fetchedDashboardData]);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: "100%",
      backgroundColor: theme.bg_primary || "#f5f7f5",
    },
    contentContainer: {
      flexGrow: 1,
      alignContent: "center",
      alignItems: "center"
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
      padding: 20,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
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
    summaryCard: {
      width: "100%",
      backgroundColor: "rgba(109, 152, 122, 0.05)",
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: "rgba(109, 152, 122, 0.1)",
    },
    summaryItemHeader:{
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
      justifyContent: "center",
      gap: 20,
      alignItems: "center",
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
  
  if (!fetchedDashboardData || !processedDashboardData) return <LoadingScreen />;
  if (!processedDashboardData.enoughData) {
      return (
        <View style={{justifyContent: "center"}}>
            <Text style={{color: theme.text, textAlign: "center", textAlignVertical: "center", fontSize: 24}}>Not enough data for your area yet.</Text>
        </View>
      )
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Council Recycling Dashboard</Text>
          <Text style={styles.headerSubtitle}>City-wide recycling metrics and performance analysis</Text>
        </View>

        {/* Charts Row - Bar Chart and Pie Chart side by side */}
        <View style={styles.chartsRow}>
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
                  <Text style={styles.summaryValue}>{processedDashboardData.totalRecycled.toLocaleString()}</Text>
                  <Text style={styles.summaryUnit}>items</Text>
                </View>
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
                <MaterialPercentagesPieChart
                  data={processedDashboardData.materialPercentages}
                />
              </View>

              {/* Reorganized legend into 2 columns */}
              <View style={styles.legendContainer}>
                <View style={styles.legendRow}>
                  {processedDashboardData.materialPercentages.map((material: MaterialPercentage) => {
                    const isActive = activeMaterial === material.name
                    return (
                      <Pressable
                        key={material.name}
                        style={[styles.legendItem, isActive && styles.legendItemActive]}
                        onPress={() => setActiveMaterial(isActive ? null : material.name)}
                      >
                        <View style={styles.legendLeftContent}>
                          <View
                            style={[
                              styles.legendColor,
                              {
                                backgroundColor: material.color,
                                width: isActive ? 16 : 12,
                                height: isActive ? 16 : 12,
                                borderWidth: isActive ? 2 : 0,
                                borderColor: "#ffffff",
                              },
                            ]}
                          />
                          <Text style={[styles.legendText, isActive && styles.legendTextActive]}>{material.name}</Text>
                        </View>
                        <Text style={styles.legendPercentage}>{material.value.toLocaleString()}</Text>
                      </Pressable>
                    )
                  })}
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  )
}

export default withAuth(CouncilDashboard, ["COUNCIL"]);

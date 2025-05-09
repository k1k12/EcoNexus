import React, { useState } from "react"
import { View, TouchableOpacity, StyleSheet, Pressable, Dimensions, Text, Platform } from "react-native"
import { useThemeContext } from "@/context/ThemeContext"
import { Link } from "expo-router";
import { COLOUR } from "@/constants/Colour"
import ScanIcon from "@/assets/icons/scan"
import MapIcon from "@/assets/icons/map"
import DashboardIcon from "@/assets/icons/dashboard"
import { useAuth } from "@/context/AuthContext";

/**
 * NavBar Component
 *
 * This component renders the navigation bar for the application, providing links to different sections such as the dashboard, map, and scan page.
 * It adapts its appearance based on the platform (web or native) and the user's role.
 *
 * Key Features:
 *   - Responsive layout that adjusts based on the platform (web or native).
 *   - Links to the dashboard, map, and scan pages.
 *   - Adapts the dashboard and map links based on the user's role (council or normal user).
 *   - Uses a middle icon for the scan page, positioned at the center of the right border.
 *   - Utilizes the ThemeContext to ensure consistent styling and appearance.
 *   - Uses the AuthContext to determine the user's role and adjust the navigation links accordingly.
 *
 * Functionality:
 *   - Renders a container with links to the dashboard, map, and scan pages.
 *   - Adapts the dashboard and map links based on the user's role (council or normal user).
 *   - Uses a middle icon for the scan page, positioned at the center of the right border.
 *   - Implements a handleIconPress function to handle icon presses.
 *   - Implements a toggleDisabled function to toggle the disabled state of icons.
 *
 * Components:
 *   - Link: Provides navigation between different sections of the application.
 *   - DashboardIcon: Displays a dashboard icon.
 *   - MapIcon: Displays a map icon.
 *   - ScanIcon: Displays a scan icon.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useAuth: Provides access to the application's authentication context for determining the user's role.
 */

type IconName = "dashboard" | "scan" | "map" | null

const NavBar = () => {
  const { theme } = useThemeContext();

  const [activeIcon, setActiveIcon] = useState<IconName>(null)
  const [disabledIcons, setDisabledIcons] = useState<{
    dashboard: boolean
    scan: boolean
    map: boolean
  }>({
    dashboard: false,
    scan: false,
    map: false,
  })

  const isWeb = Platform.OS === "web";

  const { userData } = useAuth();


  const screenWidth = Dimensions.get("window").width;
  const buttonRadius = 76;

  const handleIconPress = (iconName: "dashboard" | "scan" | "map") => {
    if (!disabledIcons[iconName]) {
      setActiveIcon(iconName)
    }
  }

  const toggleDisabled = (iconName: "dashboard" | "scan" | "map") => {
    const newDisabledState = {
      ...disabledIcons,
      [iconName]: !disabledIcons[iconName],
    }
    if (activeIcon === iconName && !disabledIcons[iconName]) {
      setActiveIcon(null)
    }
    setDisabledIcons(newDisabledState)
  }

  const styles = StyleSheet.create({
    container: {
      position: "relative",
      height: isWeb ? "60%" : "100%",
      width: "100%",
      paddingHorizontal: isWeb ? 0 : 40,
      flexGrow: 0,
      backgroundColor: theme.primary,
      borderTopWidth: 2,
      borderRightWidth: isWeb ? 2 : 0,
      borderBottomWidth: isWeb ? 2 : 0,
      borderColor: theme.secondary,
      borderTopRightRadius: isWeb ? 20 : 0,
      borderBottomRightRadius: isWeb ? 20 : 0,
      justifyContent: "center",
      alignItems: "flex-start",
      zIndex: 10,
    },
    iconContainer: {
      flex: 1,
      width: "100%",
      flexDirection: isWeb ? "column" : "row",
      justifyContent: isWeb ? "space-around" : "space-between",
      alignItems: "center",
    },
    disabledIcon: {
      opacity: 0.5,
    },
    middleIconContainer: {
      position: "absolute",
      width: buttonRadius,
      height: buttonRadius,
      borderRadius: buttonRadius / 2,
      backgroundColor: COLOUR.DARK.TEXT,
      justifyContent: "center",
      alignItems: "center",
      left: isWeb ? buttonRadius / 3 : screenWidth / 2 - buttonRadius / 2,
      top: isWeb ? "50%" : -buttonRadius / 2,
      transform: isWeb ? "translateY(-50%)" : "",
      borderWidth: 2,
      borderColor: theme.secondary,
      elevation: 4,
    },
  });

  return (
      <View style={[styles.container]}>
        <View style={styles.iconContainer}>
          {/* color : inherit prevents links from being decorated in purple if already visited */}
          <Link href={{pathname: userData?.userRole === "COUNCIL" ? "/councilDashboard" : "/dashboard"}} style={{color: "inherit"}} asChild>
              <Pressable style={{flexDirection: "column", alignItems: "center"}}>
                  <DashboardIcon width={26} height={26} fill={COLOUR.DARK.TEXT} />
                  {!isWeb && <Text style={{color: "white", fontSize: 12}}>Dashboard</Text>}
              </Pressable>
          </Link>

          <Link 
          href={{pathname: userData?.userRole === "COUNCIL" ? "/councilmap" : "/usermap"}} 
          style={{color: "inherit"}} asChild>
              <Pressable>
                  <MapIcon width={26} height={26} fill={COLOUR.DARK.TEXT} />
                  {!isWeb && <Text style={{color: "white", fontSize: 12}}>Map</Text>}
              </Pressable>
          </Link>
        </View>

        {/* QR Code Icon: positioned at the center of the right border */}
        <View
          style={[
            styles.middleIconContainer,
            activeIcon === "scan" && !disabledIcons.scan ? {} : null,
            disabledIcons.scan && { opacity: 0.7 },
          ]}
        >
          <Link href={{pathname: "/scan"}} style={{color: "inherit"}} asChild> 
              <Pressable>
                  <ScanIcon width={32} height={32}/>
              </Pressable>
          </Link>
        </View>
      </View>
  )
}

export default NavBar

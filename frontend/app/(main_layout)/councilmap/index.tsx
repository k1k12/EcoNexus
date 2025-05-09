import { useThemeContext } from "@/context/ThemeContext";
import { withAuth } from "@/utils/withAuth";
import { View, Text } from "react-native";

/**
 * CouncilAreaMapPage Component
 *
 * This component is designed to display a map of council areas, specifically for council users.
 * Due to the nature of the map implementation, it is only accessible in a web browser environment.
 *
 * Key Features:
 *   - Restricts access to council users only using the withAuth higher-order component.
 *   - Displays a message informing users to access the page via a web browser on desktop.
 *
 * Functionality:
 *   - The component's primary function is to inform users about the platform restriction.
 *   - It does not render any interactive map elements in the current implementation.
 *
 * Platform Restriction:
 *   - This page is not accessible on mobile devices or native app environments.
 *   - Users are prompted to use a web browser on a desktop computer to view the map.
 */

const CouncilAreaMapPage = () => {
    const { theme } = useThemeContext();
    return <View style={{display: "flex", alignItems: "center", justifyContent: "center", flex: 1}}>
                <Text style={{textAlign: "center", color: theme.text}}>This page is accessible only in a web browser. Please use a web browser on desktop.</Text>
           </View>
}

export default withAuth(CouncilAreaMapPage, "COUNCIL");

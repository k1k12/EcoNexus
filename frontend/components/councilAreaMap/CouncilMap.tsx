import { View, Text } from "react-native"

/**
 * CouncilMap Component
 *
 * This component serves as a placeholder for the Council Map functionality on platforms where it is not supported.
 * It displays a message informing the user to access the map using a web browser on a desktop.
 *
 * Key Features:
 *   - Provides a fallback UI for unsupported platforms.
 *   - Informs the user about the platform restriction.
 *
 * Functionality:
 *   - Renders a message indicating that the Council Map is not supported on the current platform.
 *   - Does not implement any actual map functionality.
 */

const CouncilMap = () => {
    return(
        <View>
            <Text>Not supported on this platform. Please use a web browser on a desktop.</Text>
        </View>
    )
}

export default CouncilMap;

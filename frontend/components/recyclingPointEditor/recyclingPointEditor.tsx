import { View, Text } from "react-native";

/**
 * RecyclingPointEditor Component
 *
 * This component serves as a placeholder for the Recycling Point Editor functionality on platforms where it is not supported.
 * It displays a message informing the user that the editor is only available on the web.
 *
 * Key Features:
 *   - Provides a fallback UI for unsupported platforms.
 *   - Informs the user about the platform restriction.
 *
 * Functionality:
 *   - Renders a message indicating that the Recycling Point Editor is only available on the web.
 *   - Does not implement any actual editor functionality.
 */

const RecyclingPointEditor = () => {
    return <View><Text>Available only on web.</Text></View>
}

export default RecyclingPointEditor;

import { Point2D, RecyclingPoint } from "@/types/types";
import { Text } from "react-native";

/**
 * UserMapView Component
 *
 * This component serves as a placeholder for the UserMapView functionality on platforms where it is not supported.
 * It displays a message indicating that the map is not supported on the current platform.
 *
 * Key Features:
 *   - Provides a fallback UI for unsupported platforms.
 *   - Informs the user about the platform restriction.
 *
 * Functionality:
 *   - Renders a message indicating that the UserMapView is not supported on the current platform.
 *   - Does not implement any actual map functionality.
 */

const UserMapView = ({points, onPointClick, userPos} : 
                     {points: RecyclingPoint[], 
                      onPointClick: (pointId: number) => void,
                      onPointDeselect?: () => void,
                      userPos: Point2D | null
}) => {
    return <Text>Not supported on your platform</Text>
}

export default UserMapView;

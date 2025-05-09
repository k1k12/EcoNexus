import { Point2D, RecyclingPoint } from "@/types/types";
import { View } from "react-native"
import LoadingScreen from "../core/LoadingScreen";
import { useLeaflet } from "@/context/LeafletContext";
import { useEffect, useState } from "react";

import { MotiView, AnimatePresence } from "moti";
import RecyclingPointDetailsViewer from "../recyclingPointDetailsViewer/RecyclingPointDetailsViewer";
import { useThemeContext } from "@/context/ThemeContext";

/**
 * UserMapView Component (Web)
 *
 * This component renders a map view for web platforms, displaying recycling points and the user's location.
 * It uses Leaflet for map rendering and provides functionalities for displaying recycling points as markers,
 * the user's location as a circle, and a details viewer for selected recycling points.
 *
 * Key Features:
 *   - Displays a Leaflet map with recycling points and the user's location.
 *   - Centers the map on the user's location.
 *   - Displays recycling points as markers on the map, with different icons for selected and unselected points.
 *   - Displays the user's location as a circle on the map.
 *   - Provides a details viewer for selected recycling points, displaying detailed information about the point.
 *   - Uses animations for smooth transitions when displaying the details viewer.
 *   - Uses a loading screen while the user's location is being fetched.
 *
 * Functionality:
 *   - Centers the map on the user's location using the reactLeaflet.MapContainer component.
 *   - Fetches recycling points from the points prop and displays them as markers on the map using the reactLeaflet.Marker component.
 *   - Displays the user's location as a circle on the map using the reactLeaflet.CircleMarker component.
 *   - Implements a handlePointClick function for handling marker clicks, which sets the selected point and displays the details viewer.
 *   - Implements a closeViewer function for closing the details viewer and deselecting the point.
 *   - Uses the RecyclingPointDetailsViewer component to display detailed information about the selected recycling point.
 *   - Uses the MotiView and AnimatePresence components for animated transitions when displaying the details viewer.
 *   - Uses a loading screen while the user's location is being fetched.
 *
 * Props:
 *   - points: An array of RecyclingPoint objects representing the recycling points to display on the map.
 *   - onPointClick: A callback function that is called when a marker is clicked.
 *   - onPointDeselect: An optional callback function that is called when a marker is deselected.
 *   - userPos: A Point2D object representing the user's location.
 *
 * Components:
 *   - reactLeaflet.MapContainer: A Leaflet component that renders the map.
 *   - reactLeaflet.TileLayer: A Leaflet component that renders the map tiles.
 *   - reactLeaflet.Marker: A Leaflet component that renders markers on the map.
 *   - reactLeaflet.CircleMarker: A Leaflet component that renders circles on the map.
 *   - RecyclingPointDetailsViewer: A component that displays detailed information about a recycling point.
 *   - LoadingScreen: A component that displays a loading indicator while the user's location is being fetched.
 *   - MotiView: A component from the Moti library that provides animated transitions.
 *   - AnimatePresence: A component from the Moti library that manages the mounting and unmounting of animated components.
 *
 * Hooks:
 *   - useLeaflet: Provides access to Leaflet-related functionalities.
 *   - useState: Used to manage the selected point and the visibility of the details viewer.
 *   - useEffect: Used to perform side effects, such as fetching data or setting up event listeners.
 */

const UserMapView = ({points, onPointClick, userPos, onPointDeselect}: {
  points: RecyclingPoint[],
  onPointClick: (pointId: number) => void,
  onPointDeselect?: () => void,
  userPos: Point2D | null
}) => {
  const { reactLeaflet, binIcon, selectedBinIcon } = useLeaflet();
  const [selectedPoint, setSelectedPoint] = useState<RecyclingPoint | null>(null);
  const [infoVisible, setInfoVisible] = useState(false);

  const { theme } = useThemeContext();

  const handlePointClick = (point: RecyclingPoint) => {
    setSelectedPoint(point);
    setInfoVisible(true);
    onPointClick(point.id);
  }

  const closeViewer = () => {
    setInfoVisible(false);
    setTimeout(() => setSelectedPoint(null), 300);
    if (onPointDeselect) onPointDeselect();
  }

  return (
    <View style={{
      flex: 1,
      width: "100%",
      height: "100%",
      borderRadius: 10,
      overflow: "hidden",
      position: "relative"
    }}>
      {userPos ? (
        <>
          <reactLeaflet.MapContainer
            center={[userPos.y, userPos.x]}
            zoom={13}
            style={{ height: "100%" }}
          >
            <reactLeaflet.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {points.map(p => (
              <reactLeaflet.Marker
                key={p.id}
                position={[p.latitude, p.longitude]}
                icon={p.id === selectedPoint?.id ? selectedBinIcon : binIcon}
                eventHandlers={{ click: () => handlePointClick(p) }}
              />
            ))}
            <reactLeaflet.CircleMarker
              center={[userPos.y, userPos.x]}
              radius={7}
              pathOptions={{ fillColor: "blue", weight: 2, color: "white", fillOpacity: 1 }}
            />
          </reactLeaflet.MapContainer>

          <AnimatePresence>
            {selectedPoint && infoVisible && (
              <MotiView
                from={{ translateX: 400, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: 400, opacity: 0 }}
                transition={{ type: "timing", duration: 300 }}
                style={{
                  position: "absolute",
                  backgroundColor: theme.bg_secondary,
                  right: 0,
                  top: 0,
                  width: 400,
                  height: "100%",
                  zIndex: 999999,
                }}
              >
                <RecyclingPointDetailsViewer point={selectedPoint} onClose={closeViewer} />
              </MotiView>
            )}
          </AnimatePresence>
        </>
      ) : (
        <LoadingScreen />
      )}
    </View>
  );
};

export default UserMapView;

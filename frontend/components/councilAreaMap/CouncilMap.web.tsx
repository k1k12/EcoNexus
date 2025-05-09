import { useState, useEffect } from "react";

import { useLeaflet } from "@/context/LeafletContext";
import { useCouncilMapContext } from "./CouncilMapContext";
import { useThemeContext } from "@/context/ThemeContext";

import { RecyclingPoint } from "@/types/types";
import HoverButton from "@/components/core/HoverButton"
import { generateDefaultTimetable } from "@/utils/time";
import { findAreaCenter, isPointInsideArea } from "@/utils/mapUtils";
import RecyclingPointEditor from "../recyclingPointEditor/recyclingPointEditor";
import BottomToolBar from "./BottomToolBar";
import { usePage } from "@/context/PageContext";

/**
 * CouncilMap Component (Web)
 *
 * This component renders an interactive map for council users to manage recycling points within their area.
 * It uses Leaflet for map rendering and provides functionalities for adding, editing, and deleting recycling points.
 *
 * Key Features:
 *   - Displays a Leaflet map with the council area highlighted.
 *   - Fetches and displays recycling points within the council area.
 *   - Allows council users to add new recycling points by clicking on the map.
 *   - Allows council users to edit existing recycling points by dragging markers.
 *   - Provides undo/redo functionality for managing changes to recycling points.
 *   - Integrates with the RecyclingPointEditor component for editing recycling point details.
 *   - Uses the BottomToolBar component for undo, redo, and commit changes functionalities.
 *   - Uses the CouncilMapContext to manage the map state and actions.
 *   - Uses the LeafletContext to access Leaflet-related functionalities.
 *   - Uses the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Fetches the council area shape and recycling points from the backend.
 *   - Displays the council area as a polygon on the map.
 *   - Displays recycling points as markers on the map.
 *   - Allows council users to add new recycling points by clicking on the map.
 *   - Allows council users to edit existing recycling points by dragging markers.
 *   - Implements undo/redo functionality for managing changes to recycling points.
 *   - Integrates with the RecyclingPointEditor component for editing recycling point details.
 *   - Uses the BottomToolBar component for undo, redo, and commit changes functionalities.
 *   - Uses the CouncilMapContext to manage the map state and actions.
 *   - Uses the LeafletContext to access Leaflet-related functionalities.
 *   - Uses the ThemeContext to ensure consistent styling and appearance.
 *
 * Components:
 *   - MapContainer: A Leaflet component that renders the map.
 *   - TileLayer: A Leaflet component that renders the map tiles.
 *   - Polygon: A Leaflet component that renders the council area as a polygon.
 *   - Marker: A Leaflet component that renders recycling points as markers.
 *   - Popup: A Leaflet component that renders a popup menu for adding new recycling points.
 *   - RecyclingPointEditor: A component for editing recycling point details.
 *   - BottomToolBar: A component for undo, redo, and commit changes functionalities.
 *
 * Hooks:
 *   - useLeaflet: Provides access to Leaflet-related functionalities.
 *   - useCouncilMapContext: Provides access to the Council Map context for managing the map state and actions.
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const MapInteractor = () => {
    const { reactLeaflet } = useLeaflet();
    const { dispatchPointsStatesHistory, setSelectedPointId, areaShape } = useCouncilMapContext();
    const { showToastNotification } = usePage();
    const { theme } = useThemeContext();
    const [clickedPos, setClickedPos] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        if (!clickedPos) return;
        if (!isPointInsideArea([clickedPos.lat, clickedPos.lng], areaShape)) {
            showToastNotification("This area is managed by another council.");
            setClickedPos(null);
            return;
        }
    }, [clickedPos]);

    reactLeaflet.useMapEvents({
        click: (e: any) => {
            setClickedPos(e.latlng);
        }
    });

    const handleNewPoint = () => {
        if (!clickedPos) return;
        const newPoint: RecyclingPoint = {id: Date.now(), // temporary id, once send to the backend a new real id will be obtained
                                            latitude: clickedPos.lat, 
                                            postCode: null, 
                                            longitude: clickedPos.lng, 
                                            description: null, 
                                            type: [], 
                                            timetable: generateDefaultTimetable(),
                                            isNew: true,
                                        };
        dispatchPointsStatesHistory({type: "ADD_NEW", value: newPoint});
        setSelectedPointId(newPoint.id);
        setClickedPos(null);
    }

    if (!clickedPos){
        return null;
    }
    
    return <reactLeaflet.Popup 
            position={clickedPos} 
            style={{background: theme.bg_secondary, color: theme.text}}>
                <div style={styles.popupMenu}>
                    <HoverButton 
                    notHoveredColor={theme.bg_secondary}
                    hoveredColor={theme.bg_primary}
                    onClick={() => {handleNewPoint()}}
                    >
                    Add new recycling point here
                    </HoverButton>
                </div>
            </reactLeaflet.Popup>
}


const CouncilMap = () => {
    const { reactLeaflet, leaflet, binIcon, selectedBinIcon, incompleteBinIcon} = useLeaflet();
    const { pointsStatesHistory, dispatchPointsStatesHistory, selectedPointId, setSelectedPointId, areaShape } = useCouncilMapContext();
    const { showToastNotification } = usePage();

    return (
        <div style={styles.mapContainer}>
            <reactLeaflet.MapContainer center={findAreaCenter(areaShape)} zoom={12} style={{height: "100%"}}>
                <reactLeaflet.TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <reactLeaflet.Polygon
                positions={areaShape}
                color="green"
                fillOpacity={0.1}
                />
                {Object.keys(pointsStatesHistory).map((pointId: string) => {
                    const pointIdInt = parseInt(pointId);
                    const pointHistory = pointsStatesHistory[pointIdInt];
                    const presentIndex = pointsStatesHistory[pointIdInt].presentIndex;
                    // don't display deleted points. deleted points have present index set to -1
                    if (presentIndex === -1) return null;

                    const presentPointState = pointHistory.states[pointHistory.presentIndex];

                    let icon;
                    if (selectedPointId) {
                        if (selectedPointId === pointIdInt){
                            icon = selectedBinIcon;
                        }
                        else {
                            if (pointHistory.isPresentApplied){
                                icon = binIcon;
                            }
                            else {
                                icon = incompleteBinIcon;
                            }
                        }
                    }
                    else {
                        if (pointHistory.isPresentApplied){
                            icon = binIcon;
                        }
                        else {
                            icon = incompleteBinIcon;
                        }
                    }

                    return (
                        <reactLeaflet.Marker
                            key={pointId} 
                            position={[presentPointState.latitude, presentPointState.longitude]}
                            draggable={selectedPointId ? (selectedPointId === presentPointState.id) : false}
                            icon={icon}
                            eventHandlers={{
                                dragend: (e: any) => {
                                    const { lat, lng } = e.target.getLatLng();
                                    if(!isPointInsideArea([lat, lng], areaShape)) {
                                        showToastNotification("This area is managed by another council.");
                                        return;
                                    }
                                    dispatchPointsStatesHistory({type: "UPDATE", value: {...presentPointState, latitude: lat, longitude: lng}});
                                },
                                click: (e: any) => {
                                    setSelectedPointId(pointIdInt);
                                }
                            }}
                        >
                    </reactLeaflet.Marker>
                    )})}
                <MapInteractor/>
            </reactLeaflet.MapContainer>
            <RecyclingPointEditor />
            <BottomToolBar />
        </div>
    );
}

export default CouncilMap;

const styles = {
    mapContainer: {
        overflow: "hidden",
        flex: 1,
        borderRadius: 10,
        border: "1px solid grey",
        position: "relative",
    },
    popupMenu: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px"
    },
    popupMenuButton: {
        width: "100%"
    },
};

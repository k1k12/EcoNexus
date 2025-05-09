import { BinIcon } from "@/assets/icons/bin";
import { Point2D, RecyclingPoint } from "@/types/types";
import { Camera, MapView, RasterLayer, RasterSource, CircleLayer, MarkerView, ShapeSource} from "@maplibre/maplibre-react-native";
import { View } from "react-native";
import LoadingScreen from "../core/LoadingScreen";
import { useEffect, useRef } from "react";

/**
 * UserMapView Component (Native)
 *
 * This component renders a map view for native platforms, displaying recycling points and the user's location.
 * It uses MapLibre React Native for map rendering and provides functionalities for displaying recycling points as markers
 * and the user's location as a circle.
 *
 * Key Features:
 *   - Displays a MapLibre map with recycling points and the user's location.
 *   - Centers the map on the user's location.
 *   - Displays recycling points as markers on the map.
 *   - Displays the user's location as a circle on the map.
 *   - Provides a callback function for handling marker clicks.
 *   - Uses a loading screen while the user's location is being fetched.
 *
 * Functionality:
 *   - Centers the map on the user's location using the Camera component.
 *   - Fetches recycling points from the points prop and displays them as markers on the map.
 *   - Displays the user's location as a circle on the map using the ShapeSource and CircleLayer components.
 *   - Implements a callback function for handling marker clicks, which is called when a marker is touched.
 *   - Uses a loading screen while the user's location is being fetched.
 *
 * Props:
 *   - points: An array of RecyclingPoint objects representing the recycling points to display on the map.
 *   - onPointClick: A callback function that is called when a marker is clicked.
 *   - onPointDeselect: An optional callback function that is called when a marker is deselected.
 *   - userPos: A Point2D object representing the user's location.
 *
 * Components:
 *   - MapView: A component from MapLibre React Native that renders the map.
 *   - Camera: A component from MapLibre React Native that sets the initial map view.
 *   - RasterSource: A component from MapLibre React Native that provides raster tile data for the map.
 *   - RasterLayer: A component from MapLibre React Native that renders raster tile data on the map.
 *   - ShapeSource: A component from MapLibre React Native that provides vector data for the map.
 *   - CircleLayer: A component from MapLibre React Native that renders circles on the map.
 *   - MarkerView: A component from MapLibre React Native that renders markers on the map.
 *   - LoadingScreen: A component that displays a loading indicator while the user's location is being fetched.
 *
 * Hooks:
 *   - useEffect: Used to center the map on the user's location when the userPos prop changes.
 *   - useRef: Used to create a reference to the Camera component.
 */


const UserMapView = ({points, onPointClick, userPos, onPointDeselect} : {
  points: RecyclingPoint[], 
  onPointClick: (pointId: number) => void,
  onPointDeselect?: () => void,
  userPos: Point2D | null
}) => {
    
    const cameraRef = useRef(null);

    useEffect(() => {
        if (userPos && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: [userPos.x, userPos.y],
                zoomLevel: 11,
                animationDuration: 1000,
            });
        }
    }, [userPos]);
    
    return (
        <View
        style={{
            flex: 1,
            position: "relative",
            justifyContent: "center",
            flexDirection: "column",
            width: "100%",
            height: "100%",
            gap: 10
        }}
        >
        {userPos ? (
            <MapView
            style={{
                flex: 1, 
                height: "100%",
                width: "100%",
                borderRadius: 15, 
                overflow: "hidden", 
            }}
            >
                <Camera ref={cameraRef}
                defaultSettings={
                    {centerCoordinate: [userPos.x, userPos.y],
                    zoomLevel: 11
                }}/>
                <RasterSource
                id="osm"
                tileUrlTemplates={["https://tile.openstreetmap.org/{z}/{x}/{y}.png"]}
                    tileSize={256}
                >
                    <RasterLayer id ="osmLayer"/>
                </RasterSource>

                {points.map(p => {
                    return (
                        <MarkerView
                        key={p.id}
                        coordinate={[p.longitude, p.latitude]}
                        onTouchEnd={() => onPointClick(p.id)}
                        >
                            <BinIcon width={22} height={22} fill={"green"} 
                            stroke={"black"} strokeWidth={1} />
                        </MarkerView>
                    )
                })}

                <ShapeSource
                id="userLocationSource"
                shape={{
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [userPos.x, userPos.y],
                    },
                    properties: {}
                }}>
                    <CircleLayer 
                    id="userMarker"
                    style={{
                        circleRadius: 6,
                        circleColor: "#4287f5",
                        circleStrokeWidth: 2,
                        circleStrokeColor: "white",
                    }}
                    />
                </ShapeSource>
            </MapView>
        ): (
        <LoadingScreen />
        )}
        </View>
    );
}

export default UserMapView;

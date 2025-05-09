import * as Location from "expo-location"
import { Point2D, RecyclingPoint } from "@/types/types";
import { useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";
import { Platform, Pressable, TextInput, View } from "react-native"
import { Text } from "react-native";
import UserMapView from "@/components/userMapView/userMapView";
import RecyclingPointDetailsViewer from "@/components/recyclingPointDetailsViewer/RecyclingPointDetailsViewer";
import { useThemeContext } from "@/context/ThemeContext";
import ArrowIcon from "@/assets/icons/arrow";
import LeafletContextProvider from "@/context/LeafletContext";
import { AnimatePresence, MotiView } from "moti";
import { BACKEND_URL } from "@/config";
import { convertRecyclingPointFromBackend } from "@/utils/recyclingPointUtils";

/**
 * UserMap Component
 *
 * This component displays a map with recycling points near the user's location.
 * It fetches recycling points from the backend and displays them on a map using either React Native Maps (on mobile) or Leaflet (on web).
 *
 * Key Features:
 *   - Fetches recycling points from the backend based on user's location or postcode.
 *   - Displays recycling points on a map using UserMapView component.
 *   - Implements a postcode input for users to manually specify their location.
 *   - Shows a details window when a recycling point is selected.
 *   - Uses LeafletContextProvider for web-based map implementation.
 *   - Uses AnimatePresence for smooth transitions of the details window on mobile.
 *
 * Functionality:
 *   - Fetches user's location using expo-location.
 *   - If location permission is not granted, prompts the user to enter a postcode.
 *   - Fetches recycling points from the backend based on user's location or postcode.
 *   - Displays recycling points on the map.
 *   - When a recycling point is clicked, displays a details window with information about the point.
 *   - Allows closing the details window.
 *
 * Data Sources:
 *   - Recycling points are fetched from the backend API.
 *   - User location is obtained using expo-location or postcode.
 *
 * Components:
 *   - UserMapView: Displays the map with recycling points.
 *   - RecyclingPointDetailsViewer: Displays details of a selected recycling point.
 *
 * Platform-Specific Implementation:
 *   - Uses React Native Maps on mobile platforms.
 *   - Uses Leaflet on web platforms, wrapped with LeafletContextProvider.
 */

const BASE_NOMATIM_URL = "https://nominatim.openstreetmap.org/search?postalcode=$&country=UK&format=json"

const UserMap = ({onPointSelect, onPointDeselect, materialId} : {
    onPointSelect?: (pointId: number) => void, 
    onPointDeselect?: () => void,
    materialId?: number
}) => {
    const [recyclingPoints, setRecyclingPoints] = useState<RecyclingPoint[] | null>(null);
    const [userPos, setUserPos] = useState<Point2D | null>(null);
    const [selectedPoint, setSelectedPoint] = useState<RecyclingPoint | null>(null);
    const { theme } = useThemeContext();
    const [postCode, setPostCode] = useState<string | null>(null);
    const [postcodeRequired, setPostcodeRequired] = useState<boolean>(true);
    

    const { showToastNotification } = usePage();

    const isWeb = Platform.OS === "web";

    const [isDetailsWindowVisible, setIsDetailsWindowVisible] = useState<boolean>(false);
    
    useEffect(() => {
        const fetchRecyclingPoints = async () => {
            if (!userPos) return;
            let url;
            if (!materialId) {
                url = `${BACKEND_URL}/recycling-points?near_lat=${userPos.y}&near_lon=${userPos.x}&radius_km=5.0`;
            }
            else {
                console.log("UserMap.index.tsx : materialId : ", materialId);
                url = `${BACKEND_URL}/recycling-points?near_lat=${userPos.y}&near_lon=${userPos.x}&radius_km=5.0&material_ids=${materialId}`;
            }
            
            const recyclingPointsResponse = await fetch(url);
            if (!recyclingPointsResponse.ok) {
                showToastNotification("There are no recycling points nearby.");
                return;
            }
            const recyclingPoints = await recyclingPointsResponse.json();
            console.log("UserMap Index.tsx recycling points : ", recyclingPoints);
            setRecyclingPoints(recyclingPoints.map((p: any) => convertRecyclingPointFromBackend(p, p.materials))); 
        };
        fetchRecyclingPoints();
    }, [userPos]);

    useEffect(() => {
        const getUserLocationPermissions = async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== "granted") {
                showToastNotification("Provide your post code");
                return;
            };
            setPostcodeRequired(false);
            const location = await Location.getCurrentPositionAsync();
            setUserPos({x: location.coords.longitude, y: location.coords.latitude});
        };
        getUserLocationPermissions();
    }, []);

    const handlePointClick = (pointId: number) => {
        setSelectedPoint(recyclingPoints?.find(p => p.id === pointId) || null);
        setIsDetailsWindowVisible(true);
        if (onPointSelect) onPointSelect(pointId);
    }

    const handlePostcodeChange = (newVal: string) => {
        setPostCode(newVal);
    }
    
    // FUCKING NOMATIM STOPPED WORKING FOR SOME REASON FUCKING AWESOME
    const handleSumbitPostcode = async () => {
        setUserPos({y: 54.974835, x: -1.599891});
        if (!postCode) return;
        return;
        const urlToFetch = BASE_NOMATIM_URL.replace("$", postCode);
        const response = await fetch(urlToFetch, {
            headers: {
                "User-Agent": "EcoNexus/1.0 (ponomarev.bsns@gmail.com)"
            }
        });
        const data = await response.json();
        if (data.length < 1) {
            showToastNotification("Could not find this post code");
            return;
        }
        const place = data[0];
        const coords : Point2D = {x: parseFloat(place.lon), y: parseFloat(place.lat)};
        setUserPos(coords);
        setPostcodeRequired(false);
    };

    const handleCloseDetails = () => {
        console.log("UserMapIndex.tsx handle close details : OnPointDeselect :", onPointDeselect)
        setIsDetailsWindowVisible(false);
        setTimeout(() => {setSelectedPoint(null)}, 300);
        if (onPointDeselect) onPointDeselect();
    };

    return (
        <View
        style={{
            flex: 1,
            position: "relative",
            borderRadius: 10,
            overflow: "hidden",
            width: "100%",
            alignItems: "center",
            gap: 10,
        }}
        >
        {!isWeb &&
        <AnimatePresence>
            {isDetailsWindowVisible &&
            <MotiView
            from={{opacity: 0, scale: 0}}
            animate={{opacity: 1, scale: 1}}
            exit={{opacity: 0, scale: 0}}
            transition={{type: "timing", duration: 300}}
            style={{
                position: "absolute",
                top: 0,
                left: 0,
                height: "100%",
                width: "100%",
                zIndex: 9999999999
            }}
            >
            {selectedPoint &&
                <RecyclingPointDetailsViewer 
                point={selectedPoint} 
                onClose={handleCloseDetails}/>
            }
            </MotiView>
            }
        </AnimatePresence>
        }
            {Platform.OS !== "web" ? (
            <UserMapView points={recyclingPoints || []} 
            onPointClick={handlePointClick} userPos={userPos}
            onPointDeselect={onPointDeselect}/>
            ) : (
            <LeafletContextProvider>
                <UserMapView points={recyclingPoints || []} 
                onPointClick={handlePointClick} userPos={userPos}
                onPointDeselect={onPointDeselect}/>
            </LeafletContextProvider>
        )}
        {postcodeRequired && !selectedPoint &&
            <View style={{
            position: "absolute", 
            bottom: 0, 
            backgroundColor: theme.bg_secondary,
            justifyContent: "center",
            alignItems: "center",
            gap: 5,
            borderTopLeftRadius: isWeb ? 10 : 0,
            borderTopRightRadius: isWeb ? 10 : 0,
            width: isWeb ? "30%" : "100%",
            padding: 15,
            zIndex: 9999,
        }}>
                <Text style={{textAlign: "center", fontSize: 16, color: theme.text}}>
                    To display nearby recycling points, we need to know where you are
                </Text>
                <View style={{
                    flexDirection: "row", 
                    width: isWeb ? "30%" : "100%", 
                    justifyContent: "center", 
                    alignItems: "center",
                    gap: 10
                }}>
                    <TextInput
                    value={postCode || ""}
                    placeholder="Post code"
                    placeholderTextColor={theme.text}
                    style={{
                        color: theme.text,
                        padding: 5,
                        flex: 1,
                        borderColor: theme.primary,
                        borderWidth: 1,
                        borderRadius: 10,
                        textAlign: "center"
                    }}
                    onChangeText={handlePostcodeChange}/>
                    <Pressable
                    onPress={handleSumbitPostcode}
                    style={{
                        width: 30,
                        height: 30,
                        borderWidth: 1,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        padding: 2,
                        borderColor: theme.primary
                    }}>
                        <ArrowIcon width={18} height={18} stroke={theme.primary} />
                    </Pressable>
                </View>
            </View>
            }
        </View>
    )
};
export default UserMap;

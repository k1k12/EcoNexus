import { useCouncilMapContext } from "@/components/councilAreaMap/CouncilMapContext";
import { useThemeContext } from "@/context/ThemeContext";
import DropDownMultiSelect from "../core/DropDownMultiSelect";
import HoverButton from "../core/HoverButton";
import { RecyclingPoint, TimeInterval } from "@/types/types";
import TimetableEditor from "../councilAreaMap/TimetableEditor";
import { recyclingPointCheckRequiredFields } from "@/utils/recyclingPointUtils";
import { isPointInsideArea } from "@/utils/mapUtils";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useEffect, useState } from "react";
import { usePage } from "@/context/PageContext";

/**
 * RecyclingPointEditor Component (Web)
 *
 * This component provides an editor for managing the details of a recycling point on the web platform.
 * It allows council users to view and modify the properties of a selected recycling point, including its type,
 * coordinates, postcode, timetable, and description. The component utilizes animations for smooth transitions
 * and integrates with the CouncilMapContext for state management and data persistence.
 *
 * Key Features:
 *   - Displays an animated panel for editing recycling point details.
 *   - Allows users to modify the type, coordinates, postcode, timetable, and description of a recycling point.
 *   - Provides real-time validation and feedback on user input.
 *   - Integrates with the CouncilMapContext for state management and data persistence.
 *   - Uses react-native-reanimated for smooth transitions and animations.
 *   - Provides a delete button for removing recycling points.
 *   - Uses the ThemeContext for consistent styling and appearance.
 *
 * Functionality:
 *   - Fetches the selected recycling point from the CouncilMapContext.
 *   - Displays the details of the selected recycling point in an editable form.
 *   - Allows users to modify the properties of the recycling point.
 *   - Validates user input and provides real-time feedback.
 *   - Persists changes to the recycling point using the CouncilMapContext.
 *   - Animates the appearance and disappearance of the editor panel.
 *   - Implements handleApplyChanges function to apply the changes to the recycling point.
 *   - Implements handleEditType function to update the type of the recycling point.
 *
 * Components:
 *   - DropDownMultiSelect: A component for selecting multiple options from a dropdown list.
 *   - HoverButton: A reusable button component with hover effect.
 *   - TimetableEditor: A component for editing the timetable of a recycling point.
 *
 * Hooks:
 *   - useCouncilMapContext: Provides access to the Council Map context for managing the map state and actions.
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAnimatedStyle: Creates an animated style object that can be applied to a View.
 *   - useSharedValue: Creates a shared value that can be animated using react-native-reanimated.
 */

const RecyclingPointEditor = () => {
    const { theme } = useThemeContext();
    const { selectedPointId, materials, dispatchPointsStatesHistory, getPointState,
        areaShape, setSelectedPointId } = useCouncilMapContext();
    const { showToastNotification, showOverlay } = usePage();

    // Last selected point is necessary because we want to still display the info about a recycling point while closing
    // this component, otherwise it will flicker
    const [lastSelectedPoint, setLastSelectedPoint] = useState<RecyclingPoint | null>(null);
    const translateX = useSharedValue<number>(400);

    useEffect(() => {
        if (selectedPointId) {
            setLastSelectedPoint(getPointState(selectedPointId));
            translateX.value = withTiming(0, { duration: 500 });
        }
        else {
            translateX.value = withTiming(400, { duration: 500 }, (finished) => {
                if (finished) {
                    runOnJS(setLastSelectedPoint)(null);
                }
            });
        }
    }, [selectedPointId]);

    const displayPoint: RecyclingPoint | null = selectedPointId ? getPointState(selectedPointId) : lastSelectedPoint;

    const handleApplyChanges = () => {
        if (!displayPoint) {
            console.log("FIXME : handeApplyChanges RecyclingPointEditor : handleApplyChanges was called but selectedPoint is null");
            return;
        }
        if (!selectedPointId){
            console.log("FIXME : handeApplyChanges RecyclingPointEditor : handleApplyChanges was called but selectedPointId is null");
            return;
        }
        if (displayPoint && !recyclingPointCheckRequiredFields(displayPoint)) {
            showToastNotification("Required fields are not filled. You must provide at least one type and the postcode for this recycling point.");
            return;
        }
        dispatchPointsStatesHistory({type: "APPLY", value: selectedPointId});
        showToastNotification("Changes applied.");
    };


    const handleEditType = (newSelection: string[]) => {
        if (!displayPoint){
            console.log("FIXME : handeEditType RecyclingPointEditor : handleEditType was called but selectedPoint is null");
            return;
        }
        dispatchPointsStatesHistory({type: "UPDATE", 
                                    value: {...displayPoint, type: materials.filter(m => newSelection.includes(m.name))}});
    }

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{translateX: translateX.value}]
        }
    });

    return <Animated.View 
            style={[style.mainContainer, {backgroundColor: theme.bg_secondary, color: theme.text}, animatedStyle]} // enough, it works so shut up please!!
            >
                {displayPoint ?
                (<>
                <div style={{...style.row, position: "relative"}}>
                    <HoverButton
                    notHoveredColor={theme.bg_secondary}
                    hoveredColor="red"
                    onClick={() => {
                        if (!selectedPointId) {
                            return;
                        }
                        dispatchPointsStatesHistory({type: "DELETE", value: selectedPointId});
                        setSelectedPointId(null);
                    }}
                    >
                    Delete
                    </HoverButton>
                    <p style={{position: "absolute", left: "50%", translate: "-50%"}}>
                    Point {displayPoint.id}
                    </p>
                    <div style={style.spacer}/>
                    <HoverButton
                    style={{borderWidth: 0}}
                    notHoveredColor={theme.bg_secondary}
                    hoveredColor={theme.bg_primary}
                    onClick={() => {setSelectedPointId(null)}}
                    >
                    X
                    </HoverButton>
                </div>
                <div style={{...style.row, zIndex: 9999999}}>
                    <p>Type:</p>
                    <DropDownMultiSelect
                    onChange={(newSelection) => {handleEditType(newSelection)}} 
                    options={materials.map(m => m.name)} 
                    currentSelection={displayPoint.type.map(m => m.name)}
                    />
                </div>
                <div style={style.row}>
                    <p>Latitude:</p>
                    <input style={{...style.input, background: theme.bg_secondary, color: theme.text}}
                    value={displayPoint.latitude}
                    type="number"
                    step="0.0001"
                    onChange={(newVal) => {
                        const newLat = parseFloat(newVal.target.value);
                        if (!isPointInsideArea([newLat, displayPoint.longitude], areaShape)) {
                            showToastNotification("This area is managed by another council");
                        }
                        dispatchPointsStatesHistory({type: "UPDATE_PRESENT", value: {...displayPoint, latitude: newLat}});
                    }} 
                    onBlur={() => {
                        dispatchPointsStatesHistory({type: "SAVE_PRESENT", value: displayPoint.id});
                    }}
                    />
                    <p>Longitude:</p>
                    <input style={{...style.input, background: theme.bg_secondary, color: theme.text}}
                    value={displayPoint.longitude}
                    type="number"
                    step="0.0001"
                    onChange={(newVal) => {
                        const newLng = parseFloat(newVal.target.value);
                        dispatchPointsStatesHistory({type: "UPDATE_PRESENT", value: {...displayPoint, longitude: newLng}});
                    }} 
                    onBlur={() => {
                        dispatchPointsStatesHistory({type: "SAVE_PRESENT", value: displayPoint.id});
                    }}
                    />
                </div>
                <div style={style.row}>
                    <p>Postcode</p>
                    <input 
                    style={{ ...style.input, background: theme.bg_secondary, color: theme.text }}
                    value={displayPoint.postCode ? displayPoint.postCode : ""}
                    placeholder="No postcode"
                    onChange={(e) => {
                        const filteredValue = e.target.value.replace(/[^a-zA-Z0-9]/g, ""); // Keeps only letters and numbers
                        dispatchPointsStatesHistory({type: "UPDATE_PRESENT", value: {...displayPoint, postCode: filteredValue}});
                    }} 
                    onBlur={() => {
                        dispatchPointsStatesHistory({type: "SAVE_PRESENT", value: displayPoint.id});
                    }}
                    />                        
                </div>
                <p style={{margin: 5}}>Timetable</p>
                <div style={style.row}>
                    <TimetableEditor timetable={displayPoint.timetable} 
                    onChange={(updatedTimetable: TimeInterval[]) => {
                        dispatchPointsStatesHistory({type: "UPDATE", value: {...displayPoint, timetable: updatedTimetable}});
                    }}/>
                </div>
                <p style={{margin: 5}}>Description</p>
                <div style={style.row}>
                    <textarea style={{
                        ...style.input, 
                        textAlign: "left", 
                        flexGrow: 1,
                        background: theme.bg_secondary, 
                        color: theme.text, 
                        resize: "vertical",
                        height: "auto"}} 
                        value={displayPoint.description ? displayPoint.description : ""}
                        placeholder="No description"
                        onChange={(newVal) => {
                            dispatchPointsStatesHistory({type: "UPDATE_PRESENT", 
                                                        value: {...displayPoint, description: newVal.target.value}});
                        }}
                        onBlur={() => {
                            dispatchPointsStatesHistory({type: "SAVE_PRESENT", value: displayPoint.id});
                        }}
                    />
                </div>
                <div style={{display: "flex", flexGrow: 1}}>
                    <HoverButton
                    style={{
                        flexGrow: 1,
                        alignSelf: "flex-end",
                    }}
                    notHoveredColor={theme.bg_secondary}
                    hoveredColor={theme.bg_primary}
                    onClick={handleApplyChanges}
                    >
                    Apply
                    </HoverButton>
                </div>
             </>
            )
            :(<p>Select a point or add a new one.</p>)
            }
        </Animated.View>
}

export default RecyclingPointEditor;

const style: Record<string, React.CSSProperties> = {
    mainContainer: {
        border: "1px solid grey", 
        borderBottomLeftRadius: "10px",
        display: "flex",
        flex: 1,
        gap: 5,
        position: "absolute",
        right: 0,
        top: 0,
        justifyContent: "flex-start",
        flexDirection: "column",
        alignItems: "space-between", 
        padding: "10px", 
        width: 400,
        height: "80%",
        textAlign: "center",
        zIndex: 9999,
        overflowY: "auto",
        overflowX: "hidden",
    },
    spacer: {
        flex: 1,
        width: "100%",
    },
    row: {
        width: "100%", 
        display: "flex",
        alignItems: "center",
        gap: "5px",
        flexWrap: "nowrap",
    },
    input : {
        minWidth: 15,
        flex: 1,
        padding: "5px",
        border: "1px solid grey",
        borderRadius: "5px",
        textOverflow: "ellipsis"
    },
    timetable: {
        flex: 1
    }
}

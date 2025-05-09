import { useThemeContext } from "@/context/ThemeContext";
import { CSSProperties } from "react";
import ChangesCommiter from "../recyclingPointEditor/ChangesCommiter";
import { useCouncilMapContext } from "./CouncilMapContext";
import HoverButton from "../core/HoverButton";

/**
 * BottomToolBar Component
 *
 * This component renders a toolbar at the bottom of the Council Area Map, providing undo, redo, and commit changes functionalities.
 * It utilizes the CouncilMapContext to access the selected recycling point and dispatch history actions.
 *
 * Key Features:
 *   - Undo functionality to revert changes to the selected recycling point.
 *   - Redo functionality to reapply changes to the selected recycling point.
 *   - ChangesCommiter component to commit the changes to the backend.
 *   - Displays toast notifications to inform the user about the status of the actions.
 *   - Uses HoverButton components for interactive button styling.
 *   - Theming support via the ThemeContext.
 *
 * Functionality:
 *   - Implements handleRedo function to dispatch the "REDO" action to the points states history.
 *   - Implements handleUndo function to dispatch the "UNDO" action to the points states history.
 *   - Displays toast notifications if the user tries to perform undo/redo without selecting a point.
 *   - Renders HoverButton components for undo and redo actions.
 *   - Renders the ChangesCommiter component to commit the changes.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *   - ChangesCommiter: A component to commit the changes to the backend.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - useCouncilMapContext: Provides access to the Council Map context for managing the map state and actions.
 */

const BottomToolBar = () => {
    const { theme } = useThemeContext();
    
    const { selectedPointId, dispatchPointsStatesHistory, showToastNotification } = useCouncilMapContext();

    const handleRedo = () => {
        if (!selectedPointId) {
            showToastNotification("Redo works only on a selected point.");
            return;
        }
        dispatchPointsStatesHistory({type: "REDO", value: selectedPointId});
    }

    const handleUndo = () => {
        if (!selectedPointId){
            showToastNotification("Undo works only on a selected point.");
            return;
        }
        dispatchPointsStatesHistory({type: "UNDO", value: selectedPointId});
    }

    return (
        <div style={{...styles.mainContainer, background: theme.bg_secondary, color: theme.text}}>
            <HoverButton
            notHoveredColor={theme.bg_secondary}
            hoveredColor={theme.bg_primary} onClick={() => handleUndo()}
            active={selectedPointId !== null}
            >
            Undo
            </HoverButton>
            <HoverButton
            notHoveredColor={theme.bg_secondary}
            hoveredColor={theme.bg_primary}
            onClick={() => handleRedo()}
            active={selectedPointId !== null}
            >
            Redo
            </HoverButton>
            <ChangesCommiter />
        </div>
    )
}

export default BottomToolBar;

const styles: Record<string, CSSProperties> = {
    mainContainer: {
        display: "flex",
        position: "absolute",
        right: 30,
        bottom: 30,
        padding: 10,
        gap: 5,
        zIndex: 99999999,
        border: "1px solid grey",
        borderRadius: 10,
    }
};

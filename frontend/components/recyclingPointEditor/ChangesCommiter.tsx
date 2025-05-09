import { CSSProperties, useState } from "react";
import HoverButton from "../core/HoverButton";
import { useCouncilMapContext } from "../councilAreaMap/CouncilMapContext";
import { useThemeContext } from "@/context/ThemeContext";
import { ViewStyle } from "react-native";
import { Changes, NewRecyclingPointBackend, RecyclingPoint } from "@/types/types";
import { compareRecyclingPoints, resolvePointStateChanges } from "@/utils/recyclingPointUtils";
import { usePage } from "@/context/PageContext";
import { fetchProtectedEndpoint } from "@/utils/apiCalls";

import { BACKEND_URL } from "@/config";
import { timeIntervalToWeeklyHours } from "@/utils/time";
import { useAuth } from "@/context/AuthContext";

/**
 * ChangesCommiter Component
 *
 * This component provides a button that allows council users to commit all changes made to recycling points on the Council Map to the backend.
 * It utilizes the CouncilMapContext to access the history of recycling point states and the AuthContext to get the user's authentication data.
 *
 * Key Features:
 *   - Commits all changes made to recycling points to the backend.
 *   - Utilizes the CouncilMapContext to access the history of recycling point states.
 *   - Utilizes the AuthContext to get the user's authentication data.
 *   - Displays a warning overlay to confirm the commit action.
 *   - Displays toast notifications to inform the user about the status of the commit action.
 *   - Uses HoverButton components for interactive button styling.
 *   - Theming support via the ThemeContext.
 *
 * Functionality:
 *   - Implements onConfirmCommitChanges function to commit all changes to the backend.
 *   - Displays a warning overlay to confirm the commit action.
 *   - Displays toast notifications to inform the user about the status of the commit action.
 *   - Renders a HoverButton component for committing the changes.
 *   - Checks if all points have applied changes before committing.
 *   - Sends only the necessary changes to the backend (updated, deleted, and new points).
 *   - Converts the data to the format expected by the backend.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *
 * Hooks:
 *   - useCouncilMapContext: Provides access to the Council Map context for managing the map state and actions.
 *   - useThemeContext: Provides access to the application's theme for styling.
 *   - usePage: Provides access to the application's page context for displaying notifications.
 *   - useAuth: Provides access to the application's authentication context for user authentication and data.
 */

function newRecyclingPointForBackend(recyclingPoint: RecyclingPoint, userId: number, gssCode: string) : NewRecyclingPointBackend {
    return {
        point_id: -1337, // won't be the actual id, backend assigns a new one
        user_id: userId,
        gss_code: gssCode,
        material_ids: recyclingPoint.type.map(m => m.id),
        latitude: recyclingPoint.latitude,
        longitude: recyclingPoint.longitude,
        times_open: timeIntervalToWeeklyHours(recyclingPoint.timetable)
    }
}

const ChangesCommiter = () => {
    const { theme } = useThemeContext();
    const { pointsStatesHistory } = useCouncilMapContext();
    const { showOverlay, showToastNotification } = usePage();

    const { userData } = useAuth();

    if (!userData?.userId || userData?.userRole !== "COUNCIL" || !userData?.gssCode) {
        throw new Error("Changes commiter called but data required is not provided, or permissions are insufficient.");
    }
    
    const onConfirmCommitChanges = async () : Promise<void> => {
        const pointsIds: number[] = Object.keys(pointsStatesHistory).map(id => parseInt(id));
        
        for (const pointId of pointsIds) {
            if (!pointsStatesHistory[pointId].isPresentApplied) {
                showToastNotification("Some points have unapplied changes (red icons). Please apply all changes before committing.");
                return;
            }
        }

        const changes: Changes = {"updated": [], "deleted": [], "new": []};
        for (const pointId of pointsIds) {
            const pointHistory = pointsStatesHistory[pointId];
            const presentIndex = pointsStatesHistory[pointId].presentIndex;
            // present index = -1 indicates a deleted point
            if (presentIndex === -1) {
                // if point was new and has been deleted, we don't need to send it to the backend
                if (pointsStatesHistory[pointId].states[0].isNew) {
                    continue;
                }
                changes["deleted"].push(pointId);
                continue;
            }
            const presentState = pointHistory.states[pointHistory.presentIndex];
            if (pointHistory.states[0].isNew) {
                changes["new"].push(newRecyclingPointForBackend(presentState, userData.userId, userData?.gssCode));
                continue;
            }
            const initialState = pointHistory.states[0];
            if (presentState === initialState) continue; // if a point was not edited at all, don't send any changes
            if (!compareRecyclingPoints(initialState, presentState)) {
                const changedFields: any = resolvePointStateChanges(initialState, presentState);
                changes.updated.push({point_id: pointId, changed_fields: changedFields}); 
            }
        }
        
        console.log("CouncilMapChangesCommiter changes to be send to the backend: ", changes);

        const response = await fetchProtectedEndpoint(`${BACKEND_URL}/recycling-points`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(changes)

        });
        const resJson = await response.json();
        console.log("CouncilMapChangesCommiter changes commited response: ", resJson);
    }

    return (<>
           <HoverButton
           style={{...styles.commitButton} as ViewStyle}
           notHoveredColor={theme.bg_secondary}
           hoveredColor={theme.bg_primary}
           onClick={() => {
                const pointsIds: number[] = Object.keys(pointsStatesHistory).map(id => parseInt(id));
                
                for (const pointId of pointsIds) {
                    if (!pointsStatesHistory[pointId].isPresentApplied) {
                        console.log("POINT IS NOT APPLIED");
                        showToastNotification("Some points have unapplied changes (red icons). Please apply all changes before committing.");
                        return;
                    }
                }
               showOverlay(["You are about to commit all changes you have made.", "They will go live right after you press Accept."],
                             [(<HoverButton
                               notHoveredColor={theme.secondary}
                               style={{borderColor: "grey", textColor: "white"}}
                               onClick={onConfirmCommitChanges}
                               >Accept</HoverButton>
                             ),
                             (
                               <HoverButton
                               notHoveredColor="red"
                               style={{borderColor: "grey", textColor: "white"}}
                               onClick={() => {console.log("Cancelled")}}
                               >Cancel</HoverButton>
                             )]);
           }}>
                Commit all changes
            </HoverButton>
            </>
    )
}

export default ChangesCommiter;

const styles: Record<string, CSSProperties> = {
    commitButton: {
        border: "1px solid grey",
        borderRadius: 10,
        padding: 5,
    }
}

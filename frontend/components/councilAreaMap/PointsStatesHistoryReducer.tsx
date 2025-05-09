import { RecyclingPoint } from "@/types/types";
import { HistoryAction, PointsStatesHistory } from "./_types";
import { compareRecyclingPoints, recyclingPointCheckRequiredFields } from "@/utils/recyclingPointUtils";

/**
 * PointsStatesHistoryReducer Component
 *
 * This component provides a reducer function for managing the history of recycling point states within the Council Map.
 * It handles different actions such as adding, updating, deleting, undoing, and redoing changes to recycling points.
 *
 * Key Features:
 *   - Manages the history of recycling point states, allowing for undo/redo functionality.
 *   - Handles different actions for updating the history, such as adding new entries, updating the present state, and saving the present state.
 *   - Provides a way to mark the current state as applied, indicating that the user has confirmed the changes.
 *   - Allows for deleting recycling points by setting the presentIndex to -1.
 *   - Implements undo/redo functionality by moving the presentIndex pointer within the history.
 *   - Compares recycling point states to avoid unnecessary updates.
 *   - Checks for required fields before applying changes.
 *
 * Functionality:
 *   - Handles different actions for updating the history, such as adding new entries, updating the present state, and saving the present state.
 *   - Provides a way to mark the current state as applied, indicating that the user has confirmed the changes.
 *   - Allows for deleting recycling points by setting the presentIndex to -1.
 *   - Implements undo/redo functionality by moving the presentIndex pointer within the history.
 *   - Compares recycling point states to avoid unnecessary updates.
 *   - Checks for required fields before applying changes.
 *
 * Actions:
 *   - APPLY: Marks the current state as applied, indicating that the user has confirmed the changes.
 *   - DELETE: Sets the present index for the specified point to -1, effectively deleting the point.
 *   - UPDATE: Adds a new entry to the history and moves the present pointer to the new state.
 *   - SAVE_PRESENT: Marks the present state as persistent, so the next UPDATE_PRESENT call will create a new history entry.
 *   - UPDATE_PRESENT: Updates the present state in the history, without creating a new entry (used for small changes).
 *   - ADD_EXISTING: Adds a new history entry for an existing recycling point (when fetching from the backend).
 *   - ADD_NEW: Adds a new history entry for a newly created recycling point.
 *   - UNDO: Moves the present pointer one step back in the history.
 *   - REDO: Moves the present pointer one step forward in the history.
 */

const pointsStatesHistoryReducer = (state: PointsStatesHistory, action: HistoryAction) : PointsStatesHistory => {
    switch(action.type) {
        case "APPLY": {
            if (typeof action.value !== "number"){
                console.log("FIXME: pointsStatesHistoryReducer: APPLY action called but value provided is either missing or invalid.\n" +
                           "Type of action.value is " + typeof action.value);
                return state;
            }
            const pointId = action.value;
            if (!recyclingPointCheckRequiredFields(state[pointId].states[state[pointId].presentIndex])) {
                console.log("FIXME: pointsStatesHistoryReducer: APPLY action called but the point is missing required fields.");
                return state;
            }
            const newState: PointsStatesHistory = {
                ...state,
                [pointId]: {
                    states: [...state[pointId].states],
                    isPresentApplied: true,
                    presentIndex: state[pointId].presentIndex,
                    allowUpdatePresent: false
                }
            }
            return newState;
        }
        case "DELETE": {
            if (typeof action.value !== "number"){
                console.log("FIXME: pointsStatesHistoryReducer: DELTE action called but the value is invalid.");
                return state;
            }
            const pointId = action.value;
            const newState: PointsStatesHistory = {
                ...state,
                [pointId]: {
                    states: [...state[pointId].states],
                    isPresentApplied: true,
                    allowUpdatePresent: false,
                    presentIndex: -1 // indicates that the point is deleted and it won't be displayed anywhere
                }
            }
            return newState;
        }
        // creates a new history entry on every dispatch
        case "UPDATE": {
            if (typeof action.value === "number" || !("id" in action.value)){
                console.log("FIXME: pointsStatesHistoryReducer: UPDATE action called but the value is invalid.");
                return state;
            }
            const newRecyclingPointState = action.value;
            let presentIndex = state[newRecyclingPointState.id].presentIndex;
            let newPointStates: RecyclingPoint[] = [...state[newRecyclingPointState.id].states];
            // if states are identical don't update
            if (compareRecyclingPoints(newRecyclingPointState, state[newRecyclingPointState.id].states[presentIndex])){
                return state;
            }
            // truncate the history if new action was applied after undoing 
            if (presentIndex < state[newRecyclingPointState.id].states.length - 1) {
                newPointStates = state[newRecyclingPointState.id].states.slice(0, presentIndex + 1);
                presentIndex = newPointStates.length - 1;
            }
            newPointStates.push(newRecyclingPointState);
            return {
                ...state,
                [newRecyclingPointState.id]: {
                    states: newPointStates,
                    isPresentApplied: false,
                    presentIndex: newPointStates.length - 1,
                    allowUpdatePresent: false
                }
            }

        }
        case "SAVE_PRESENT": {
            if (typeof action.value !== "number"){
                console.log("FIXME: pointsStatesHistoryReducer: SAVE_PRESENT action called but the value is invalid.");
                return state;
            }
            const recyclingPointId = action.value;
            return {
                ...state,
                [recyclingPointId]: {
                    ...state[recyclingPointId],
                    allowUpdatePresent: false
                }
            }
        }
        // creates a new history entry only first time dispatched, and keeps updating that entry for all further 
        case "UPDATE_PRESENT": {
            if (typeof action.value === "number" || !("id" in action.value)){
                console.log("FIXME: pointsStatesHistoryReducer: UPDATE action called but the value is invalid.");
                return state;
            }
            const updatedRecyclingPoint = action.value;
            let presentIndex = state[updatedRecyclingPoint.id].presentIndex;
            let allowUpdatePresent = state[updatedRecyclingPoint.id].allowUpdatePresent;
            let newPointStates: RecyclingPoint[] = [...state[updatedRecyclingPoint.id].states];
            // truncate the history if new action was applied after undoing 
            if (presentIndex < newPointStates.length - 1) {
                newPointStates = state[updatedRecyclingPoint.id].states.slice(0, presentIndex + 1);
                presentIndex = newPointStates.length - 1;
            }

            if (!allowUpdatePresent) {
                const presentStateCopy = {...state[updatedRecyclingPoint.id].states[presentIndex]};
                newPointStates.push(presentStateCopy);
                presentIndex += 1;
            }

            allowUpdatePresent = true;

            newPointStates[presentIndex] = {...updatedRecyclingPoint};

            const newState: PointsStatesHistory = {
                ...state,
                [updatedRecyclingPoint.id]: {
                    states: newPointStates,
                    isPresentApplied: false,
                    presentIndex: presentIndex,
                    allowUpdatePresent: true
                }
            }
            return newState;
        }
        case "ADD_EXISTING": {
            if (typeof action.value === "number" || !("id" in action.value)){
                console.log("FIXME: pointsStatesHistoryReducer: ADD_EXISTING action called but the value is invalid.");
                return state;
            }
            const newRecyclingPoint = action.value;
            const newState: PointsStatesHistory = {
                ...state,
                [newRecyclingPoint.id]: {
                    states: [newRecyclingPoint],
                    isPresentApplied: true,
                    presentIndex: 0,
                    allowUpdatePresent: false
                }
            }
            return newState;

        }
        case "ADD_NEW": {
            if (typeof action.value === "number" || !("id" in action.value)){
                console.log("FIXME: pointsStatesHistoryReducer: ADD_NEW action called but the value is invalid.");
                return state;
            }
            if (Object.keys(state).find(p => parseInt(p) === action.value?.id)) { // fuck off it's not a number can't you see the previous if statement?????
                console.log("FIXME: pointsStatesHistoryReducer: ADD_NEW action: IDs of two points clashed.");
                return state;
            }
            const newRecyclingPoint = action.value;
            const newState: PointsStatesHistory = {
                ...state,
                [newRecyclingPoint.id]: {
                    states: [newRecyclingPoint],
                    isPresentApplied: false,
                    presentIndex: 0,
                    allowUpdatePresent: false
                }
            }
            return newState;
        }
        case "UNDO": {
            if (typeof action.value !== "number") {
                console.log("FIXME: pointsStatesHistoryReducer: UNDO action called but the value is invalid.");
                return state;
            }
            const pointId: number = action.value;
            const presentIndex: number = state[pointId].presentIndex;
            console.log("present index: " + (presentIndex - 1) + " states length: " + state[pointId].states.length);
            if (presentIndex <= 0) {
                return state;
            }
            const newState: PointsStatesHistory = {
                ...state,
                [pointId] : {
                    ...state[pointId],
                    presentIndex: presentIndex - 1,
                    isPresentApplied: false,
                    allowUpdatePresent: false
                }
            };
            return newState;
        }
        case "REDO": {
            if (typeof action.value !== "number") {
                console.log("FIXME: pointsStatesHistoryReducer: UNDO action called but the value is invalid.");
                return state;
            }
            const pointId: number = action.value;
            const currentPresentIndex: number = state[pointId].presentIndex;
            if (currentPresentIndex >= state[pointId].states.length - 1) {
                return state;
            }
            const newState: PointsStatesHistory = {
                ...state,
                [pointId] : {
                    ...state[pointId],
                    presentIndex: currentPresentIndex + 1,
                    isPresentApplied: false,
                    allowUpdatePresent: false
                }
            };
            return newState;
        }
        default: {
            console.log("FIXME: pointsStatesHistoryReducer: undefined action, actionType: " + action.type);
            return state;
        }
    }
}

export default pointsStatesHistoryReducer;

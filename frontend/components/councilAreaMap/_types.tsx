import { RecyclingPoint } from "@/types/types";

/**
 * _types.tsx
 *
 * This file defines the types and interfaces used for managing the state history of recycling points within the Council Area Map component.
 * It provides a structured way to track changes to recycling points, allowing for undo/redo functionality and efficient state management.
 *
 * Key Types:
 *   - PointsStatesHistory: An object that stores the history of each recycling point, indexed by the point's ID.
 *   - RecyclingPointHistory: An object that contains the history of a single recycling point, including its states, current position in the history, and flags for managing updates.
 *   - HistoryAction: An object that represents an action performed on the history of a recycling point, such as undoing, redoing, updating, or deleting.
 *
 * Functionality:
 *   - Provides a way to store and manage the history of recycling point states.
 *   - Allows for undo/redo functionality by moving the presentIndex pointer within the history.
 *   - Supports different types of updates to the history, such as adding new entries, updating the present state, and saving the present state.
 *   - Provides a way to mark the current state as applied, indicating that the user has confirmed the changes.
 *   - Allows for deleting recycling points by setting the presentIndex to -1.
 *
 * History Actions:
 *   - UNDO: Moves the present pointer one step back in the history.
 *   - REDO: Moves the present pointer one step forward in the history.
 *   - UPDATE: Adds a new entry to the history and moves the present pointer to the new state.
 *   - UPDATE_PRESENT: Updates the present state in the history, without creating a new entry (used for small changes).
 *   - SAVE_PRESENT: Marks the present state as persistent, so the next UPDATE_PRESENT call will create a new history entry.
 *   - ADD_NEW: Adds a new history entry for a newly created recycling point.
 *   - ADD_EXISTING: Adds a new history entry for an existing recycling point (when fetching from the backend).
 *   - APPLY: Marks the current state as applied, indicating that the user has confirmed the changes.
 *   - DELETE: Sets the present indexs for the specified point to -1, effectively deleting the point.
 */

export type PointsStatesHistory = {
    [pointId: number] : RecyclingPointHistory;    
}

export type RecyclingPointHistory = {
    states: RecyclingPoint[];
    presentIndex: number;
    isPresentApplied: boolean;
    allowUpdatePresent: boolean;
}

export type HistoryAction = {
    type: "UNDO" | "REDO" | "UPDATE" | "UPDATE_PRESENT" | "SAVE_PRESENT" | "ADD_NEW" | "ADD_EXISTING" | "APPLY" | "DELETE";
    value: RecyclingPoint | number;
}

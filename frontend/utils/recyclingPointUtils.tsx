import { ChangedField, NewRecyclingPointBackend, RecyclingPoint } from "@/types/types";
import { compareTimetables, timeIntervalToWeeklyHours, weeklyHoursToTimeInterval } from "./time";

/**
 * recyclingPointUtils.tsx
 *
 * This file provides utility functions for managing and comparing recycling point data.
 * It includes functions for comparing recycling points, checking required fields, converting recycling point data
 * from the backend format, resolving changes between recycling point states, and comparing recycling point types.
 *
 * Key Functions:
 *   - compareRecyclingPoints: Compares two RecyclingPoint objects to determine if they are equal.
 *   - recyclingPointCheckRequiredFields: Checks if a RecyclingPoint object has all the required fields filled.
 *   - convertRecyclingPointFromBackend: Converts a recycling point object from the backend format to the frontend format.
 *   - resolvePointStateChanges: Resolves the changes between two RecyclingPoint objects and returns an object containing the changed fields.
 *   - compareTypes: Compares two arrays of recycling point types to determine if they are equal.
 *
 * Functionality:
 *   - compareRecyclingPoints:
 *     - Compares the id, type, latitude, longitude, description, postCode, and timetable of two RecyclingPoint objects.
 *     - Returns true if all the fields are equal, false otherwise.
 *   - recyclingPointCheckRequiredFields:
 *     - Checks if the type array has at least one element and if the postCode is not null or an empty string.
 *     - Returns true if all the required fields are filled, false otherwise.
 *   - convertRecyclingPointFromBackend:
 *     - Converts the point_id, latitude, longitude, times_open, materials, and description fields from the backend format to the frontend format.
 *     - Uses the weeklyHoursToTimeInterval function to convert the times_open field to a TimeInterval object.
 *     - Uses the materialsList to map material names to material objects.
 *   - resolvePointStateChanges:
 *     - Compares the type, latitude, longitude, postCode, timetable, and description fields of two RecyclingPoint objects.
 *     - Returns an object containing the changed fields and their new values.
 *     - Uses the timeIntervalToWeeklyHours function to convert the timetable field to the backend format.
 *   - compareTypes:
 *     - Compares two arrays of recycling point types to determine if they are equal, regardless of order.
 *
 * Dependencies:
 *   - @/types/types: Contains type definitions for ChangedField, NewRecyclingPointBackend, and RecyclingPoint.
 *   - ./time: Contains utility functions for working with time intervals and timetables.
 */

export function compareRecyclingPoints(r1: RecyclingPoint, r2: RecyclingPoint): boolean {
    return r1.id === r2.id && compareTypes(r1.type, r2.type) && r1.latitude === r2.latitude && r1.longitude === r2.longitude
        && r1.description === r2.description && r1.postCode === r2.postCode && compareTimetables(r1.timetable, r2.timetable);
}

export function recyclingPointCheckRequiredFields(recyclingPoint: RecyclingPoint): boolean {
    return (recyclingPoint.type.length > 0 && recyclingPoint.postCode !== null && recyclingPoint.postCode !== "");
}

export function convertRecyclingPointFromBackend(point: any, materialsList: any[]) : RecyclingPoint {
    console.log("RecyclingPointUtils : converRecyclingPointFromBackend : converting point : ", point);
    console.log("RecyclingPointUtils : converRecyclingPointFromBackend : material list: ", materialsList);
    return {
        id: point.point_id,
        latitude: point.latitude,
        longitude: point.longitude,
        timetable: weeklyHoursToTimeInterval(point.times_open),
        postCode: "FIXME no postcode backend", // backend doesn't store it (to discuss)
        // sometimes we don't have the list of all materials, in that case materialList is simply array of material names without ids.
        type: materialsList.filter((material: any) => point.materials.includes(material.name?.toLowerCase() || material)),
        description: "FIXME no description backend" //backend doesn't store it (to discuss)
    }
}

// assumes all required fields have been verified before callilng this function
export function resolvePointStateChanges(initialState: RecyclingPoint, finalState: RecyclingPoint): any {
    const changedFields: any = {};
    
    if (!compareTypes(initialState.type.map(t => t.name), finalState.type.map(t => t.name))) {
        changedFields["material_ids"] = finalState.type.map(t => t.id);
    }
    if (initialState.latitude !== finalState.latitude) {
        changedFields["latitude"] = finalState.latitude;
    }
    if (initialState.longitude !== finalState.longitude) {
        changedFields["longitude"] = finalState.longitude;
    }
    if (initialState.postCode !== finalState.postCode) {
        changedFields["postcode"] = finalState.postCode;
    }
    if (!compareTimetables(initialState.timetable, finalState.timetable)) {
        changedFields["times_open"] = timeIntervalToWeeklyHours(finalState.timetable);
    }
    if (initialState.description !== finalState.description) {
        changedFields["description"] = finalState.description;
    }

    return changedFields;
}

export function compareTypes(types1: string[], types2: string[]): boolean {
    if (types1.length !== types2.length) return false;
    const typesSet = new Set(types1);
    const frequencies: Record<string, number> = {};
    for (const type of types1) {
        frequencies[type] = (frequencies[type] || 0) + 1;
    }
    for (const type of types2) {
        if(!typesSet.has(type) || !frequencies[type]) return false;
        frequencies[type]--;
    }
    return true;
}

import { Point2D, RecyclingPoint, TimeInterval } from "@/types/types";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store"

/**
 * apiCalls.tsx
 *
 * This file provides utility functions for making API calls to the backend, including fetching protected endpoints with authentication.
 * It also includes mocked data and functions for development purposes.
 *
 * Key Functions:
 *   - fetchProtectedEndpoint: Fetches a protected endpoint, automatically including the access token in the request headers.
 *   - getCouncilAreas: Returns mocked GeoJSON data for council areas.
 *   - getCouncilData: Returns mocked data for council information, including area shape, recycling point types, and recycling points.
 *
 * Functionality:
 *   - fetchProtectedEndpoint:
 *     - Retrieves the access token from secure storage on native platforms.
 *     - Includes the access token in the Authorization header for native requests.
 *     - Includes credentials for web requests (cookies).
 *   - getCouncilAreas:
 *     - Returns a hardcoded GeoJSON FeatureCollection representing council areas.
 *   - getCouncilData:
 *     - Simulates an API call with a delay.
 *     - Returns hardcoded data for council area shape, recycling point types, and recycling points.
 *
 * Mocked Data:
 *   - timetable: A sample timetable for recycling points.
 *   - points: An array of sample recycling points.
 *
 * Dependencies:
 *   - @/types/types: Contains type definitions for Point2D, RecyclingPoint, and TimeInterval.
 *   - react-native: Used for platform detection.
 *   - expo-secure-store: Used for securely storing the access token on native platforms.
 */

const timetable: TimeInterval[] = [{opensAt: {hour: 10, minute: 0}, closesAt: {hour: 23, minute: 0}, openFullDay: false},
                                   {opensAt: {hour: 10, minute: 0}, closesAt: {hour: 23, minute: 0}, openFullDay: false},
                                   {opensAt: {hour: 10, minute: 0}, closesAt: {hour: 23, minute: 0}, openFullDay: false},
                                   {opensAt: {hour: 10, minute: 0}, closesAt: {hour: 23, minute: 0}, openFullDay: false},
                                   {opensAt: {hour: 10, minute: 0}, closesAt: {hour: 19, minute: 30}, openFullDay: false},
                                   {opensAt: {hour: 0, minute: 0}, closesAt: {hour: 0, minute: 0}, openFullDay: true},
                                   {opensAt: {hour: 0, minute: 0}, closesAt: {hour: 0, minute: 0}, openFullDay: true}]

const points = [{ id: 1, longitude: -0.09, latitude: 51.515364, description: "A test point number 1", type: ["HDPE", "PP"], timetable: timetable, postCode: "LN31QW"},
                   {id: 2, longitude: -0.05, latitude: 51.515555, description: "A test point number 2", type: ["HDPE", "PG"], timetable: timetable, postCode: "LN12FE"},
                   {id: 3, longitude: -0.01, latitude: 51.52, description: "A test point number 3", type: ["HDPE"], timetable: timetable, postCode: "LN21XD"},]

// Use it when you need to fetch a protected endpoint. This function authomatically includes credentials, the access_token.
// On web, the access_token is supplies in the cookies,
// on native it's supplied in the Authorization header.
export async function fetchProtectedEndpoint(url: string, options?: RequestInit) {
    let access_token; // only for native
    if (Platform.OS !== "web") {
        try {
            access_token = await SecureStore.getItemAsync("access_token");
            if (!access_token) {
                throw new Error("Could not obtain the access token from storage, it likely was never set before.");
            }
        } catch (error: any) {
            throw new Error("Error retrieving token from storage: " + error.message);
        }
    }
    return fetch(url, {
        ...options,
        headers: {
            ...options?.headers,
            ...(Platform.OS !== "web" ? { Authorization: `Bearer ${access_token}` } : {})
        },
        credentials: "include"
    });
};

// MOCKED 
export function getCouncilAreas() {
    const areas = [
                    [
                        [1.492486, 52.277431],
                        [-1.468019, 51.849913],
                        [-0.937164, 50.761640],
                        [2.222868, 51.570254],
                        [1.492486, 52.277431]
                    ],
                    [
                      [0.259780, 53.667330],
                      [-4.778555, 52.968703],
                      [-1.467, 51.85],
                      [1.49249, 52.27744],
                      [0.259780, 53.667330]
                    ]]
    const features: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: [
          {
            type: "Feature",
            id: 1,
            properties: {
              name: "GSS10372882",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                  areas[0]
              ]
            }
          },
          {
            type: "Feature",
            id: 2,
            properties: {
              name: "GSS1230987",
            },
            geometry: {
              type: "Polygon",
              coordinates: [
                  areas[1]
              ]
            }
          }
        ]
    };

    return features;
}

const sleepAsync = (seconds: number) => {
    return new Promise(resolve => setTimeout(resolve, seconds * 1000));
};


// MOCKED
export async function getCouncilData() {
    

    await sleepAsync(1); // simulate delay
    return {
        areaShape: [[51.300746, -0.185260], [51.375456, -0.419443], [51.501567, -0.523341], [51.567818, -0.503701], [51.617662, -0.368049],
                    [51.680029, -0.071846], [51.619386, 0.223311], [51.392842, 0.254149], [51.301706, 0.010722], [51.301706, 0.010722]],
        recyclingPointTypesList: ["HDPE", "PP", "Cardboard", "Aluminium", "PG"],
        points: points
    }
};

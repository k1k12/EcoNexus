import { Point2D, Box2D } from "@/types/types";

/**
 * mapUtils.tsx
 *
 * This file provides utility functions for performing geometric calculations and operations related to maps and areas.
 * It includes functions for determining if a point is inside an area, calculating the center of an area,
 * converting between coordinate systems, and finding the area that contains a given point.
 *
 * Key Functions:
 *   - isPointInsideArea: Checks if a point is inside a complex polygon area.
 *   - isPointInBoxArea: Checks if a point is inside a simple rectangular area.
 *   - latLonToLonLat: Swaps latitude and longitude coordinates in an array of points.
 *   - findAreaCenter: Calculates the center point of an area.
 *   - boundAreas: Calculates the bounding box of a set of areas.
 *   - findContainingArea: Finds the GeoJSON feature that contains a given point.
 *
 * Functionality:
 *   - isPointInsideArea:
 *     - Implements the ray-casting algorithm to determine if a point is inside a polygon.
 *     - Handles cases where the point is on a vertex or edge of the polygon.
 *   - isPointInBoxArea:
 *     - Checks if a point is within the bounds of a rectangle defined by its corners.
 *   - latLonToLonLat:
 *     - Converts an array of latitude/longitude coordinate pairs to longitude/latitude pairs.
 *   - findAreaCenter:
 *     - Calculates the center of an area by finding the midpoint of its bounding box.
 *   - boundAreas:
 *     - Determines the minimum and maximum x and y coordinates of a set of areas.
 *   - findContainingArea:
 *     - Checks if the point is within the bounding box of all areas.
 *     - Iterates through the areas and uses isPointInsideArea to find the containing area.
 *
 * Dependencies:
 *   - @/types/types: Contains type definitions for Point2D and Box2D.
 */

// use this one for complex shapes, when area is not just a box 
export function isPointInsideArea(point: [number, number], area: number[][]): boolean {
    if (area.length < 3) return false;
    
    const [x, y] = point;
    let inside = false;
    
    for (let i = 0, j = area.length - 1; i < area.length; j = i++) {
        const [xi, yi] = area[i];
        const [xj, yj] = area[j];
        
        // check if the point is exactly on a vertex
        if (x === xi && y === yi) return true;
        
        // check if the point is on a horizontal edge
        if (yi === yj && yi === y && x > Math.min(xi, xj) && x < Math.max(xi, xj)) {
            return true;
        }
        
        // check if the point is on a vertical edge
        if (xi === xj && xi === x && y > Math.min(yi, yj) && y < Math.max(yi, yj)) {
            return true;
        }
        
        // check if the point is on a non-vertical, non-horizontal edge
        if ((yi > y) !== (yj > y)) {
            const intersectX = (yj - yi) * (x - xi) / (xj - xi) + yi;
            if (y === intersectX) return true;
        }
        
        // ray-casting intersection test
        const intersect = ((yi > y) !== (yj > y)) &&
            (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    
    return inside;
}

// swaps coordinates
export function latLonToLonLat(points: number[][]): number[][] {
  return points.map(([lat, lon]) => [lon, lat]);
}

export function findAreaCenter(area: number[][]) : [number, number] {
    const boundingBox = boundAreas([area]);
    const xCenter = (boundingBox[0] + boundingBox[2]) / 2;
    const yCenter = (boundingBox[1] + boundingBox[3]) / 2;

    return [xCenter, yCenter];
}

// use this for simple rectangle shapes
export function isPointInBoxArea(point: Point2D, box: Box2D): boolean {
  const xMin = Math.min(box.topLeft.x, box.bottomLeft.x);
  const xMax = Math.max(box.topRight.x, box.bottomRigth.x);
  const yMin = Math.min(box.bottomLeft.y, box.bottomRigth.y);
  const yMax = Math.max(box.topLeft.y, box.topRight.y);

  return (
    point.x >= xMin &&
    point.x <= xMax &&
    point.y >= yMin &&
    point.y <= yMax
  );
}

export function boundAreas(areas: number[][][]): number[] {
  let xMin: number | null = null;
  let xMax: number | null = null;
  let yMin: number | null = null;
  let yMax: number | null = null;

  for (const area of areas) {
    for (const [x, y] of area) {
      if (xMin === null || x < xMin) xMin = x;
      if (xMax === null || x > xMax) xMax = x;
      if (yMin === null || y < yMin) yMin = y;
      if (yMax === null || y > yMax) yMax = y;
    }
  }

  if (xMin === null || xMax === null || yMin === null || yMax === null) {
    throw new Error("Invalid areas input");
  }

  return [xMin, yMin, xMax, yMax];
}

export function findContainingArea(point: Point2D, areas: GeoJSON.FeatureCollection) : GeoJSON.Feature | null {
    const areasPolygons : number[][][] = areas.features.map(f => f.geometry.coordinates[0]);
    const boundingBox = boundAreas(areasPolygons);

    if (!isPointInBoxArea(point, {
                                topRight: {x: boundingBox[2], y: boundingBox[3]},
                                topLeft: {x: boundingBox[0], y: boundingBox[3]},
                                bottomLeft: {x: boundingBox[0], y: boundingBox[1]},
                                bottomRigth: {x: boundingBox[2], y: boundingBox[1]}
    })){
        return null;
    }

    for (const area of areas.features) {
        if (isPointInsideArea([point.x, point.y], area.geometry.coordinates[0]))
            return area;
    }
    return null;
}

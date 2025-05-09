import { UserRole } from "@/types/types"

/**
 * userRoleMatcher.ts
 *
 * This file provides a utility function for mapping a string representation of a user role to a UserRole enum value.
 *
 * Key Functions:
 *   - matchUserRole: Maps a string representation of a user role to a UserRole enum value.
 *
 * Functionality:
 *   - matchUserRole:
 *     - Takes a string representing a user role as input.
 *     - Uses a switch statement to map the string to a UserRole enum value.
 *     - Returns the corresponding UserRole enum value.
 *     - If the input string does not match any known user roles, returns "GUEST".
 *
 * Dependencies:
 *   - @/types/types: Contains the definition of the UserRole enum.
 */

export function matchUserRole(role: string) : UserRole {
    switch (role) {
        case "user": return "USER";
        case "council": return "COUNCIL";
        case "admin": return "ADMIN";
        default: return "GUEST"
    }
}

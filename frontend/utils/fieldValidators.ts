/**
 * fieldValidators.ts
 *
 * This file provides utility functions for validating user input fields, such as email, password, and name.
 * It uses regular expressions to ensure that the input meets specific criteria.
 *
 * Key Functions:
 *   - checkValidEmail: Checks if an email address is valid.
 *   - checkValidPassword: Checks if a password is valid.
 *   - checkValidName: Checks if a name is valid.
 *
 * Functionality:
 *   - checkValidEmail:
 *     - Uses a regular expression to check if the email address is in a valid format.
 *     - Returns true if the email address is valid, false otherwise.
 *   - checkValidPassword:
 *     - Uses a regular expression to check if the password meets the following criteria:
 *       - At least 8 characters long.
 *       - Contains at least one lowercase letter.
 *       - Contains at least one uppercase letter.
 *       - Contains at least one digit.
 *     - Returns true if the password is valid, false otherwise.
 *   - checkValidName:
 *     - Uses a regular expression to check if the name contains only letters and is between 1 and 50 characters long.
 *     - Returns true if the name is valid, false otherwise.
 */

export function checkValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function checkValidPassword(password: string): boolean {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password);
}

export function checkValidName(name: string): boolean {
    return /^[A-Za-z]{1,50}$/.test(name);
}


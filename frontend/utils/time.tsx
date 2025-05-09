import { Hour, HourMinute, Minute, TimeInterval, WeeklyHours } from "@/types/types";

/**
 * time.tsx
 *
 * This file provides utility functions for working with time-related data, including hours, minutes, and time intervals.
 * It includes functions for validating time values, converting between string and numerical representations of time,
 * comparing time intervals, generating default timetables, and converting between TimeInterval and WeeklyHours formats.
 *
 * Key Functions:
 *   - checkValidHourMinute: Checks if an HourMinute object has valid hour and minute values.
 *   - checkValidHour: Checks if an hour value is valid.
 *   - checkValidMinute: Checks if a minute value is valid.
 *   - strToHourMinute: Converts a string in the format "HH:MM" to an HourMinute object.
 *   - hourMinuteToStr: Converts an HourMinute object to a string in the format "HH:MM".
 *   - hourToStr: Converts an Hour to a string in the format "HH".
 *   - minuteToStr: Converts a Minute to a string in the format "MM".
 *   - compareTimetables: Compares two TimeInterval arrays to determine if they are equal.
 *   - generateDefaultTimetable: Generates a default TimeInterval array with the same opening times for each day.
 *   - timeIntervalToWeeklyHours: Converts a TimeInterval array to a WeeklyHours object.
 *   - weeklyHoursToTimeInterval: Converts a WeeklyHours object to a TimeInterval array.
 *
 * Functionality:
 *   - Provides validation functions to ensure that time values are within the valid range.
 *   - Provides conversion functions to convert between string and numerical representations of time.
 *   - Provides a comparison function to compare two TimeInterval arrays.
 *   - Provides a function to generate a default TimeInterval array.
 *   - Provides conversion functions to convert between TimeInterval and WeeklyHours formats.
 *
 * Dependencies:
 *   - @/types/types: Contains type definitions for Hour, HourMinute, Minute, TimeInterval, and WeeklyHours.
 */

export function checkValidHourMinute(hourMinute: HourMinute): boolean {
    return (hourMinute.hour >= 0 && hourMinute.hour <= 23) && (hourMinute.minute >= 0 && hourMinute.minute <= 59)
}

export function checkValidHour(hour: Hour): boolean {
    return (hour >= 0 && hour <= 23);
}

export function checkValidMinute(minute: Minute): boolean {
    return (minute >= 0 && minute <= 59);
}

export function strToHourMinute(str: string) : HourMinute {
    const parts = str.split(":");
    if (parts.length !== 2) {
        throw new Error("Invalid time string passed, cannot convert to number representation");
    }
    const hour = parseInt(parts[0]) as Hour;
    const minute = parseInt(parts[1]) as Minute;
    return { hour, minute }
}

export function hourMinuteToStr(hourMinute: HourMinute): string {
    if (!checkValidHourMinute(hourMinute)){return "Invalid time";}
    let timestr: string = hourMinute.hour < 10 ? "0" : "";
    timestr += hourMinute.hour;
    timestr += ":";
    timestr += hourMinute.minute < 10 ? ("0" + hourMinute.minute) : hourMinute.minute;

    return timestr;
}

export function hourToStr(hour: Hour) : string {
    if (!checkValidHour(hour)) return "Invalid time";
    return hour < 10 ? ("0" + hour.toString()) : hour.toString();
}

export function minuteToStr(minute: Minute) : string {
    if (!checkValidMinute(minute)) return "Invalid time";
    return minute < 10 ? ("0" + minute.toString()) : minute.toString();
}

export function compareTimetables(tt1: TimeInterval[], tt2: TimeInterval[]): boolean {
    if (tt1.length !== tt2.length) return false;

    return tt1.every((interval, i) => 
        interval.openFullDay === tt2[i].openFullDay &&
        interval.closed === tt2[i].closed &&
        interval.opensAt.hour === tt2[i].opensAt.hour &&
        interval.opensAt.minute === tt2[i].opensAt.minute &&
        interval.closesAt.hour === tt2[i].closesAt.hour &&
        interval.closesAt.minute === tt2[i].closesAt.minute
    );
}

export function generateDefaultTimetable(): TimeInterval[] {
    const interval = {opensAt: {hour: 8, minute: 0}, closesAt: {hour: 20, minute: 0}, openFullDay: false, closed: false}
    return Array(7).fill(interval);
}

function timeIntervalDayToWeeklyHoursDay(day: TimeInterval) : [string, string] {
    if (day.closed) return ["Closed", "Closed"];
    if (day.openFullDay) return ["00:01", "23:59"];
    return [hourMinuteToStr(day.opensAt), hourMinuteToStr(day.closesAt)];
}

export function timeIntervalToWeeklyHours(timetable: TimeInterval[]) : WeeklyHours {
    return {
        monday: timeIntervalDayToWeeklyHoursDay(timetable[0]),
        tuesday: timeIntervalDayToWeeklyHoursDay(timetable[1]),
        wednesday: timeIntervalDayToWeeklyHoursDay(timetable[2]),
        thursday: timeIntervalDayToWeeklyHoursDay(timetable[3]),
        friday: timeIntervalDayToWeeklyHoursDay(timetable[4]),
        saturday: timeIntervalDayToWeeklyHoursDay(timetable[5]),
        sunday: timeIntervalDayToWeeklyHoursDay(timetable[6])
    }
}

function weeklyHoursDayToTimeIntervalDay(weeklyHoursDay: any) : TimeInterval {
    if (weeklyHoursDay[0] === "Closed") {
        return {
            closed: true, openFullDay: false,
            opensAt: {hour: 0, minute: 0}, 
            closesAt: {hour: 0, minute: 0}
        }
    }
    if (weeklyHoursDay[0] === "00:01" && weeklyHoursDay[1] === "23:59") {
        return {
            closed: false, openFullDay: true,
            opensAt: {hour: 0, minute: 1}, 
            closesAt: {hour: 23, minute: 59}
        }
    }
    return {
        closed: false, openFullDay: false,
        opensAt: strToHourMinute(weeklyHoursDay[0]),
        closesAt: strToHourMinute(weeklyHoursDay[1])
    }
}

export function weeklyHoursToTimeInterval(weeklyHours: WeeklyHours) : TimeInterval[] {
    return [
        weeklyHoursDayToTimeIntervalDay(weeklyHours.monday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.tuesday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.wednesday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.thursday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.friday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.saturday),
        weeklyHoursDayToTimeIntervalDay(weeklyHours.sunday),
    ]
}

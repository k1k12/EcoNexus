import { Hour, HourMinute, Minute } from "@/types/types"
import { hourToStr, minuteToStr } from "@/utils/time";
import { StyleSheet, Text, TextStyle } from "react-native";
import { TextInput, View } from "react-native";

/**
 * TimeEdit Component
 *
 * This component provides a time input field with separate inputs for hours and minutes.
 * It allows users to edit the time by directly inputting numeric values for hours and minutes.
 *
 * Key Features:
 *   - Separate input fields for hours and minutes.
 *   - Numeric keyboard input for easy time entry.
 *   - Input validation to ensure valid hour (0-23) and minute (0-59) values.
 *   - Optional active state to enable or disable editing.
 *   - Customizable styling through the style prop.
 *   - Callback function to notify parent component of time changes.
 *
 * Functionality:
 *   - Renders two TextInput components for hours and minutes, separated by a colon.
 *   - Validates user input to ensure valid hour and minute values.
 *   - Updates the time state and calls the onChange callback function when the input changes.
 *   - Disables editing and reduces opacity when the component is not active.
 *
 * Props:
 *   - time: An object with hour and minute properties representing the current time.
 *   - isActive: An optional boolean indicating whether the component is active and editable.
 *   - style: An optional style object to customize the appearance of the component.
 *   - onChange: A callback function that is called when the time changes.
 *
 * Types:
 *   - HourMinute: An object with hour and minute properties, both of type number.
 *   - TimeEditStyle: An interface extending TextStyle with an optional colonColor property.
 *
 * Utils:
 *   - hourToStr: A function to convert an hour number to a string with leading zero if necessary.
 *   - minuteToStr: A function to convert a minute number to a string with leading zero if necessary.
 */

interface TimeEditStyle extends TextStyle {
    colonColor?: string,
}

const TimeEdit = ({time, isActive, style, onChange} : {
    time: HourMinute, 
    isActive?: boolean,
    style?: TimeEditStyle, 
    onChange: (newTime: HourMinute) => void
}) => {
    const hourStr = hourToStr(time.hour);
    const minuteStr = minuteToStr(time.minute);
    
    const handleChangeMinute = (newMinute: string) : void => {
        const minuteInt: number = parseInt(newMinute);
        if (isNaN(minuteInt)) return;
        if (minuteInt < 0 || minuteInt > 59) return;
        const minuteMinute: Minute = minuteInt as Minute;
        const newHourMinute: HourMinute = {hour: time.hour, minute: minuteMinute};
        onChange(newHourMinute);
    }

    const handleChangeHour = (newHour: string) : void => {
        const hourInt: number = parseInt(newHour);
        if (isNaN(hourInt)) return;
        if (hourInt < 0 || hourInt > 23) return;
        const hourHour: Minute = hourInt as Hour;
        const newHourMinute: HourMinute = {hour: hourHour, minute: time.minute};
        onChange(newHourMinute);
    }

    return (
        <View pointerEvents={isActive === undefined ? "auto" : (isActive ? "auto" : "none")}
            style={styles.rootContainer}>
            <TextInput
            style={[
                styles.timeInput,
                style,
                (isActive !== undefined && !isActive) && styles.timeInputDisabled
            ]}
            keyboardType="numeric"
            value={isActive === undefined ? hourStr : (isActive ? hourStr : "00")}
            onChangeText={(newVal) => {handleChangeHour(newVal)}}
            />
            <Text
            style={{color: style?.colonColor}}
            >
            :
            </Text>
            <TextInput 
            style={[
                styles.timeInput,
                style,
                (isActive !== undefined && !isActive) && styles.timeInputDisabled
            ]}
            value={isActive === undefined ? minuteStr : (isActive ? minuteStr : "00")}
            keyboardType="numeric"
            onChangeText={(newVal) => {handleChangeMinute(newVal)}}
            />
        </View>
    )
}

export default TimeEdit;

const styles = StyleSheet.create({
    rootContainer: {
        borderRadius: 5,
        borderWidth: 1,
        borderColor: "grey",
        flexDirection: "row",
        justifyContent: 'center',
    },
    timeInput: {
        textAlign: "center",
        width: 20,
    },
    timeInputDisabled: {
        opacity: 0.5
    }
})

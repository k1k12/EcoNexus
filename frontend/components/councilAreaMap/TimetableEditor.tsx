import { HourMinute, TimeInterval } from "@/types/types";
import TimeEdit from "../core/TimeEdit";
import { useThemeContext } from "@/context/ThemeContext";
import { Days } from "@/types/types";

/**
 * TimetableEditor Component
 *
 * This component provides an editor for managing the timetable of a recycling point.
 * It allows users to set the opening and closing times, mark the point as open for the full day, or mark it as closed for each day of the week.
 *
 * Key Features:
 *   - Displays a table with rows for each day of the week.
 *   - Allows users to set the opening and closing times for each day using the TimeEdit component.
 *   - Provides checkboxes for marking the point as open for the full day or closed for each day.
 *   - Notifies the parent component of changes to the timetable via the onChange callback function.
 *   - Uses the ThemeContext to ensure consistent styling and appearance.
 *
 * Functionality:
 *   - Renders a table with rows for each day of the week.
 *   - Uses the TimeEdit component to allow users to set the opening and closing times for each day.
 *   - Provides checkboxes for marking the point as open for the full day or closed for each day.
 *   - Implements handleChangeOpensAt function to update the opening time for a specific day.
 *   - Implements handleChangeClosesAt function to update the closing time for a specific day.
 *   - Implements handleChangeOpenFullDay function to mark the point as open for the full day for a specific day.
 *   - Implements handleChangeClosed function to mark the point as closed for a specific day.
 *   - Notifies the parent component of changes to the timetable via the onChange callback function.
 *
 * Components:
 *   - TimeEdit: A component for editing the time.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const TimetableEditor = ({timetable, onChange} : {
                          timetable: TimeInterval[], 
                          onChange: (newTimetable: TimeInterval[]) => void
}) => {
    const { theme } = useThemeContext();
    
    const handleChangeOpensAt = (updatedValue: HourMinute, day: number) : void => {
        const updatedTimetable: TimeInterval[] = timetable.map((timeInterval: TimeInterval, i: number) => {
            return (i === day ? {...timeInterval, opensAt: updatedValue} : timeInterval)
        })

        onChange(updatedTimetable); 
    }

    const handleChangeClosesAt = (updatedValue: HourMinute, day: number) : void => {
        const updatedTimetable: TimeInterval[] = timetable.map((timeInterval: TimeInterval, i: number) => {
            return (i === day ? {...timeInterval, closesAt: updatedValue} : timeInterval)
        })

        onChange(updatedTimetable); 
    }
    
    const handleChangeOpenFullDay = (updatedValue: boolean, day: number) : void => {
        const updatedTimetable: TimeInterval[] = timetable.map((timeInterval: TimeInterval, i: number) => {
            return (i === day ? {...timeInterval, openFullDay: updatedValue, closed: false} : timeInterval)
        })

        onChange(updatedTimetable); 
    }

    const handleChangeClosed = (updatedValue: boolean, day: number) : void => {
        const updatedTimetable: TimeInterval[] = timetable.map((timeInterval: TimeInterval, i: number) => {
            return (i === day ? {...timeInterval, closed: updatedValue, openFullDay: false} : timeInterval)
        })

        onChange(updatedTimetable); 
    }

    return (
        <table style={styles.timetable}>
            <thead>
                <tr>
                    <th>Day</th>
                    <th>Open</th>
                    <th>Close</th>
                    <th>Full Day</th>
                    <th>Closed</th>
                </tr>
            </thead>
            <tbody>
                {timetable.map((interval: TimeInterval, i: number) => (
                    <tr key={i}>
                        <td>{Days[i]}</td>
                        <td style={styles.cell}>
                            <TimeEdit 
                            isActive={!interval.openFullDay && !interval.closed}
                            time={interval.opensAt} 
                            style={{color: theme.text, colonColor: theme.text}}
                            onChange={(newVal: HourMinute) => {handleChangeOpensAt(newVal, i)}} />
                        </td>
                        <td style={styles.cell}>
                            <TimeEdit 
                            time={interval.closesAt} 
                            isActive={!interval.openFullDay && !interval.closed}
                            style={{color: theme.text, colonColor: theme.text}}
                            onChange={(newVal: HourMinute) => {handleChangeClosesAt(newVal, i)}} />
                        </td>
                        <td>
                            <input
                            type="checkbox"
                            checked={interval.openFullDay} 
                            onChange={(newVal) => {handleChangeOpenFullDay(newVal.target.checked, i)}} />
                        </td>
                        <td>
                            <input
                            type="checkbox"
                            checked={interval.closed} 
                            onChange={(newVal) => {handleChangeClosed(newVal.target.checked, i)}} />
                        </td>
                    </tr>
                ))}                            
            </tbody>
        </table>
    );
}

export default TimetableEditor;

const styles = {
    timetable: {
        width: '100%',
    },
    cell: {
        padding: 8
    }
}

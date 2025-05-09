import { Days, RecyclingPoint } from "@/types/types";
import { Platform, ScrollView, StyleSheet, Text, View } from "react-native";
import HoverButton from "../core/HoverButton";
import ArrowIcon from "@/assets/icons/arrow";
import { useThemeContext } from "@/context/ThemeContext";
import { hourMinuteToStr } from "@/utils/time";

/**
 * RecyclingPointDetailsViewer Component
 *
 * This component displays the details of a recycling point, including its type, description, postcode, and timetable.
 * It adapts its appearance based on the platform (web or native) and uses the ThemeContext for styling.
 *
 * Key Features:
 *   - Displays the type, description, postcode, and timetable of a recycling point.
 *   - Adapts its appearance based on the platform (web or native).
 *   - Uses the ThemeContext for styling.
 *   - Provides a close button to close the details viewer.
 *   - Uses a ScrollView to accommodate varying content lengths.
 *
 * Functionality:
 *   - Renders a container with the details of the recycling point.
 *   - Displays a close button to close the details viewer.
 *   - Uses a ScrollView to accommodate varying content lengths.
 *   - Uses the hourMinuteToStr function to format the opening and closing times.
 *
 * Components:
 *   - HoverButton: A reusable button component with hover effect.
 *   - ArrowIcon: Displays an arrow icon.
 *
 * Hooks:
 *   - useThemeContext: Provides access to the application's theme for styling.
 */

const RecyclingPointDetailsViewer = ({point, onClose} : {point: RecyclingPoint, onClose: () => void}) => {
    const { theme } = useThemeContext();

    const isWeb = Platform.OS === "web";

    if (!point) return null;
    
    return (
        <View style={{flex: 1, gap: 10, backgroundColor: theme.bg_secondary}}>
            <View style={[styles.row, styles.underlineBottom, { alignItems: "center" }]}>
              {!isWeb &&
              <HoverButton
                onClick={onClose}
                style={{
                  borderWidth: 0,
                  width: 40,
                }}
                notHoveredColor={theme.bg_secondary}
                hoveredColor={theme.bg_primary}
              >
                <ArrowIcon rotation={180} width={20} height={20} stroke={theme.primary}/>
              </HoverButton>
              }
              {isWeb && <View style={{ width: 40 }} />}

              <View style={{ flex: 1, alignItems: "center" }}>
                <Text style={{ color: theme.text , fontSize: 18, fontWeight: "bold"}}>Details</Text>
              </View>
              {isWeb &&  
              <HoverButton
                onClick={onClose}
                style={{
                  borderWidth: 0,
                  width: 40,
                }}
                notHoveredColor={theme.bg_secondary}
                hoveredColor={theme.bg_primary}
              >
                <ArrowIcon rotation={0} width={20} height={20} stroke={theme.primary}/>
              </HoverButton>
              }
              {!isWeb && <View style={{ width: 40 }} />}
            </View>            
            <ScrollView 
                style={{
                    flex: 1,
                    width: "100%",
                }}
                contentContainerStyle={{
                    flexDirection: "column",
                    justifyContent: "flex-start",
                    margin: 20,
                    flexGrow: 1,
                    gap: 15
                }}
                >
                    <View style={[styles.row, {justifyContent: "center"}]}>
                        <Text style={{color: theme.primary, fontWeight: "bold", fontSize: 18}}>Recycles</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{color: theme.text}}>{point.type.join(", ")}</Text>
                    </View>
                    {point.description &&
                    <>
                    <View style={styles.row}>
                        <Text style={{color: theme.primary, fontWeight: "bold", fontSize: 16}}>Description</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{color: theme.text}}>{point.description}</Text>
                    </View>
                    </>
                    }
                    <View style={[styles.row, {justifyContent: "center"}]}>
                        <Text style={{color: theme.primary, fontWeight: "bold", fontSize: 18}}>Post code</Text>
                    </View>
                    <View style={styles.row}>
                        <Text style={{color: theme.text}}>{point.postCode}</Text>
                    </View>
                    <Text style={{textAlign: "center", color: theme.primary, fontWeight: "bold", fontSize: 16}}>Timetable</Text>
                    <View style={[styles.row, styles.underlineBottom]}>
                        <View style={styles.cell}>
                            <Text style={[styles.cellText, {color: theme.text}]}>Day</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={[styles.cellText, {color: theme.text}]}>Opens at</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={[styles.cellText, {color: theme.text}]}>Closes at</Text>
                        </View>
                        <View style={styles.cell}>
                            <Text style={[styles.cellText, {color: theme.text}]}>Full day</Text>
                        </View>
                    </View>
                    {point.timetable.map((interval, i) => {
                      return (
                        <View key={i} style={[styles.row, styles.underlineBottom]}>                            
                            <View style={styles.cell}>
                                <Text style={[styles.cellText, {color: theme.text}]}>
                                {Days[i]}
                                </Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={[styles.cellText, {color: theme.text}]}>
                                {hourMinuteToStr(interval.opensAt)}
                                </Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={[styles.cellText, {color: theme.text}]}>
                                {hourMinuteToStr(interval.closesAt)}
                                </Text>
                            </View>
                            <View style={styles.cell}>
                                <Text style={[styles.cellText, {color: theme.text}]}>
                                {interval.openFullDay ? "Yes" : "No"}
                                </Text>
                            </View>
                        </View>
                        )
                    })}
                </ScrollView>
        </View>
    )
};

export default RecyclingPointDetailsViewer;

const styles = StyleSheet.create({
    row : {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        width: "100%",
    },
    underlineBottom: {
        borderBottomWidth: 1,
        borderBottomColor: "grey",
    },
    cell : {
        flex: 1,
        flexDirection: "row",
        alignContent: "center",
    },
    cellText : {
        flex: 1,
        textAlign: "center"
    }
});

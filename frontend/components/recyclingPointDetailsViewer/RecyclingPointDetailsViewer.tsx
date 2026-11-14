import { Days, RecyclingPoint } from "@/types/types";
import { Pressable, ScrollView, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { FONT } from "@/constants/Fonts";
import { materialLabel } from "@/components/dashboard/DashboardParts";
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


    if (!point) return null;
    
    // "08:00 to 18:00", "Open all day" or "Closed" for each day
    const hoursFor = (interval: any) => {
        if (interval.closed) return "Closed";
        if (interval.openFullDay) return "Open all day";
        return `${hourMinuteToStr(interval.opensAt)} to ${hourMinuteToStr(interval.closesAt)}`;
    };

    return (
        <View style={{ flex: 1, backgroundColor: theme.bg_secondary }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12 }}>
                <Text style={{ fontFamily: FONT.bold, fontSize: 22, color: theme.text }} accessibilityRole="header">Recycling point</Text>
                <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close the details" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
                    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                        <Path d="M6 6l12 12M18 6 6 18" stroke={theme.text_muted} strokeWidth={2.2} strokeLinecap="round" />
                    </Svg>
                </Pressable>
            </View>
            <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24, gap: 22 }}>
                <View>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: theme.text_muted, marginBottom: 8 }}>Takes</Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        {point.type.map((material) => (
                            <Text key={material.name} style={{ paddingVertical: 6, paddingHorizontal: 12, borderRadius: 10, overflow: "hidden", backgroundColor: theme.accent, color: theme.on_accent, fontFamily: FONT.bold, fontSize: 14 }}>
                                {materialLabel(material.name)}
                            </Text>
                        ))}
                    </View>
                </View>

                {point.description ? (
                    <View>
                        <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: theme.text_muted, marginBottom: 6 }}>About this point</Text>
                        <Text style={{ fontFamily: FONT.regular, fontSize: 16, lineHeight: 23, color: theme.text }}>{point.description}</Text>
                    </View>
                ) : null}

                {point.postCode ? (
                    <View>
                        <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: theme.text_muted, marginBottom: 6 }}>Postcode</Text>
                        <Text style={{ fontFamily: FONT.medium, fontSize: 16, color: theme.text }}>{point.postCode}</Text>
                    </View>
                ) : null}

                <View>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: theme.text_muted, marginBottom: 4 }}>Opening times</Text>
                    {point.timetable.map((interval, i) => (
                        <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderColor: theme.type === "dark" ? "#2c4a36" : "#d5ddd6" }}>
                            <Text style={{ fontFamily: FONT.medium, fontSize: 15, color: theme.text }}>{Days[i]}</Text>
                            <Text style={{ fontFamily: interval.closed ? FONT.regular : FONT.semiBold, fontSize: 15, color: interval.closed ? theme.text_muted : theme.text }}>{hoursFor(interval)}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    )
};

export default RecyclingPointDetailsViewer;

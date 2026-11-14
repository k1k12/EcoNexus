import { MotiView } from "moti"
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

import { useThemeContext } from "@/context/ThemeContext";
import { useScanContext } from "@/context/ScanContext";
import { FONT } from "@/constants/Fonts";
import { materialLabel, useDashboardColours } from "@/components/dashboard/DashboardParts";

/**
 * ItemInfo Component
 *
 * The result after a scan: the product, what its packaging is made of, and
 * whether it can be recycled. Recyclable items get a button to the map of
 * points that take that material.
 *
 * Props:
 *   - onClose: goes back to scanning.
 */
const ItemInfo = ({ onClose }: { onClose: () => void }) => {
    const { theme } = useThemeContext();
    const c = useDashboardColours();
    const { width } = useWindowDimensions();
    const { lastScannedItem, setStep } = useScanContext();

    if (!lastScannedItem) return null;

    const material = materialLabel(lastScannedItem.material.name);
    const recyclable = lastScannedItem.recyclable;

    return (
        <MotiView
            key="info"
            from={{ opacity: 0, translateY: 8 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0 }}
            style={{ flex: 1, width: "100%", alignItems: "center", justifyContent: "center", paddingHorizontal: 8 }}
        >
            <View style={{ width: "100%", maxWidth: 520 }}>
                <Pressable onPress={onClose} accessibilityRole="button" style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, minHeight: 44, marginBottom: 8 }}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                        <Path d="M19 12H5M11 6l-6 6 6 6" stroke={theme.text_muted} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
                    </Svg>
                    <Text style={{ fontFamily: FONT.semiBold, fontSize: 15, color: theme.text_muted }}>Back to scanning</Text>
                </Pressable>

                <View style={{ borderRadius: 24, padding: width >= 600 ? 32 : 22, backgroundColor: c.panel, gap: 18 }}>
                    <Text style={{ fontFamily: FONT.medium, fontSize: 15, color: theme.text_muted }}>Here's what we found</Text>
                    <Text style={{ fontFamily: FONT.bold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: theme.text, marginTop: -10 }} accessibilityRole="header">{lastScannedItem.name}</Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                        <Text style={{ paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, overflow: "hidden", backgroundColor: c.track, fontFamily: FONT.bold, fontSize: 15, color: theme.text }}>{material}</Text>
                        <Text style={{
                            paddingVertical: 7, paddingHorizontal: 12, borderRadius: 10, overflow: "hidden",
                            fontFamily: FONT.bold, fontSize: 15,
                            backgroundColor: recyclable ? theme.accent : "transparent",
                            color: recyclable ? theme.on_accent : theme.text,
                            borderWidth: recyclable ? 0 : 1.5, borderColor: theme.text_muted,
                        }}>
                            {recyclable ? "Recyclable" : "Not recyclable"}
                        </Text>
                    </View>

                    <Text style={{ fontFamily: FONT.regular, fontSize: 17, lineHeight: 25, color: theme.text_muted }}>
                        {recyclable
                            ? `The packaging is ${material.toLowerCase()}, which can be recycled. Take it to a point that accepts ${material.toLowerCase()}.`
                            : `The packaging is ${material.toLowerCase()}, which EcoNexus doesn't know a recycling point for. Check the label on the packaging for how to get rid of it.`}
                    </Text>

                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                        {recyclable && (
                            <Pressable onPress={() => setStep("MAP")} accessibilityRole="button" style={{ minHeight: 48, paddingHorizontal: 22, borderRadius: 12, backgroundColor: theme.accent, justifyContent: "center" }}>
                                <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: theme.on_accent }}>Find a point near me</Text>
                            </Pressable>
                        )}
                        <Pressable onPress={onClose} accessibilityRole="button" style={{ minHeight: 48, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1.5, borderColor: c.border, justifyContent: "center" }}>
                            <Text style={{ fontFamily: FONT.semiBold, fontSize: 16, color: theme.text }}>Scan something else</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </MotiView>
    )
}

export default ItemInfo;

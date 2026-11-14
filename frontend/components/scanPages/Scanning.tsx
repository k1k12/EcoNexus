import { MotiView } from "moti";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

import BarcodeScanner from "../barcodeScanner/barcodescanner";
import { useScanContext } from "@/context/ScanContext";
import { useThemeContext } from "@/context/ThemeContext";
import { usePage } from "@/context/PageContext";
import { BACKEND_URL } from "@/config";
import { FONT } from "@/constants/Fonts";
import { Material } from "@/types/types";
import { materialLabel, useDashboardColours } from "@/components/dashboard/DashboardParts";

/**
 * Scanning Component
 *
 * The first step of the scan page: a camera viewfinder, a labelled box to type
 * the barcode, a few products from the demo data to try with one tap, and the
 * last few things scanned on this device.
 *
 * On the web the camera only starts when asked, so visitors aren't hit with a
 * permission prompt the moment the page opens.
 */

type RecentScan = { name: string; material: string; recyclable: boolean; barcode: string };

// Real products that are in the demo database
const TRY_THESE = [
    { name: "Coca-Cola can", barcode: "5449000000996" },
    { name: "Nutella jar", barcode: "3029330003533" },
    { name: "Walkers crisps", barcode: "5000159484695" },
];

const RECENT_KEY = "econexus-recent-scans";

// Browser storage can be missing or blocked, so fall back to an empty list
const loadRecent = (): RecentScan[] => {
    try {
        if (typeof localStorage === "undefined") return [];
        const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
        return Array.isArray(saved) ? saved.slice(0, 5) : [];
    } catch {
        return [];
    }
};

const saveRecent = (list: RecentScan[]) => {
    try {
        if (typeof localStorage !== "undefined") localStorage.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {}
};

const Corners = ({ color }: { color: string }) => (
    <Svg width="100%" height="100%" viewBox="0 0 600 360" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute" }} pointerEvents="none">
        <Path d="M150 90V70h40M410 70h40v20M450 270v20h-40M190 290h-40v-20" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" />
        <Path d="M160 180h280" stroke={color} strokeWidth={2.5} opacity={0.9} />
    </Svg>
);

const Scanning = () => {
    const isWeb = Platform.OS === "web";
    const { width } = useWindowDimensions();
    const wide = width >= 900;
    const { theme } = useThemeContext();
    const c = useDashboardColours();
    const { showToastNotification } = usePage();
    const { setStep, materialList, setLastScannedItem } = useScanContext();

    const [barcode, setBarcode] = useState("");
    const [cameraOn, setCameraOn] = useState(!isWeb);
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [looking, setLooking] = useState(false);
    const [recent, setRecent] = useState<RecentScan[]>([]);
    const lastScanRef = useRef<number>(0);

    // Without this ref the scanner's callback keeps the first, empty material list
    const materialListRef = useRef<Material[]>(materialList);
    useEffect(() => {
        materialListRef.current = materialList;
    }, [materialList]);

    useEffect(() => {
        setRecent(loadRecent());
    }, []);

    const lookUp = async (code: string) => {
        const cleaned = code.replace(/\D/g, "");
        if (cleaned.length !== 8 && cleaned.length !== 13) {
            showToastNotification("Barcodes are 8 or 13 digits long.");
            return;
        }
        const now = Date.now();
        if (now - lastScanRef.current < 500) return;
        lastScanRef.current = now;

        setLooking(true);
        try {
            const res = await fetch(`${BACKEND_URL}/product/${cleaned}`);
            if (!res.ok) {
                showToastNotification("We couldn't find that product.");
                return;
            }
            const product = await res.json();
            const material = materialListRef.current.find((m: Material) => m.name.toLowerCase() === product.material.name.toLowerCase());
            if (!material) {
                showToastNotification("We found the product but couldn't work out its material.");
                return;
            }
            const recyclable = product.recyclable ?? true;
            setLastScannedItem({ name: product.name, material, recyclable, barcode: cleaned });

            const next = [{ name: product.name, material: material.name, recyclable, barcode: cleaned }, ...recent.filter((r) => r.barcode !== cleaned)].slice(0, 5);
            setRecent(next);
            saveRecent(next);
            setStep("AFTER_SCANNED");
        } catch {
            showToastNotification("Network error, please try again.");
        } finally {
            setLooking(false);
        }
    };

    const panel = { borderRadius: 20, padding: 24, backgroundColor: c.panel };

    return (
        <MotiView key="scanning" from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ flex: 1, width: "100%" }}>
            <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 40 }}>
                <View style={{ width: "100%", maxWidth: 1200, alignSelf: "center", paddingHorizontal: wide ? 24 : 8, paddingTop: 24 }}>
                    <Text style={{ fontFamily: FONT.bold, fontSize: wide ? 48 : 34, letterSpacing: -1.5, color: theme.text }} accessibilityRole="header">What are you recycling?</Text>
                    <Text style={{ fontFamily: FONT.regular, fontSize: wide ? 20 : 17, lineHeight: wide ? 28 : 24, color: theme.text_muted, marginTop: 10, maxWidth: 720 }}>
                        Scan the barcode on the packaging and we'll tell you what it's made of and where it can go.
                    </Text>

                    <View style={{ flexDirection: wide ? "row" : "column", gap: wide ? 16 : 44, marginTop: 40 }}>
                        <View style={[panel, { flex: wide ? 3 : undefined }]}>
                            <View style={{ height: wide ? 360 : 260, borderRadius: 14, backgroundColor: "#08110b", overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                                {cameraOn && !cameraError && (
                                    <BarcodeScanner
                                        style={{ width: "100%", height: "100%", borderRadius: 14, overflow: "hidden" }}
                                        onBarcodeScanned={lookUp}
                                        onError={setCameraError}
                                    />
                                )}
                                <Corners color={theme.type === "dark" ? theme.accent : "#c6f36b"} />
                                <Text style={{ position: "absolute", bottom: 16, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10, backgroundColor: "rgba(14, 27, 19, 0.85)", fontFamily: FONT.medium, fontSize: 15, color: "#eef5ef", textAlign: "center", marginHorizontal: 16 }}>
                                    {cameraError ?? (cameraOn ? "Hold a barcode inside the corners" : "Your camera is off")}
                                </Text>
                            </View>
                            {isWeb && (
                                <View style={{ marginTop: 16, flexDirection: "row", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
                                    <Pressable
                                        onPress={() => { setCameraError(null); setCameraOn(!cameraOn); }}
                                        accessibilityRole="button"
                                        style={{ minHeight: 48, paddingHorizontal: 22, borderRadius: 12, backgroundColor: theme.accent, justifyContent: "center" }}
                                    >
                                        <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: theme.on_accent }}>{cameraOn ? "Turn off camera" : "Turn on camera"}</Text>
                                    </Pressable>
                                    <Text style={{ flexShrink: 1, fontFamily: FONT.regular, fontSize: 15, color: theme.text_muted }}>We only use the camera to read barcodes. Nothing is recorded.</Text>
                                </View>
                            )}
                        </View>

                        <View style={{ flex: wide ? 2 : undefined, gap: 16 }}>
                            <View style={{ borderRadius: 20, padding: 24, backgroundColor: c.isDark ? "#f2f5ef" : "#ffffff", position: "relative" }}>
                                <Text style={{ position: "absolute", top: -34, right: 18, fontFamily: FONT.hand, fontSize: 26, color: theme.accent, transform: [{ rotate: "-4deg" }] }}>no camera? no problem</Text>
                                <Text nativeID="barcode-label" style={{ fontFamily: FONT.bold, fontSize: 20, color: "#142019" }}>Type the barcode number</Text>
                                <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: "#3a4a40", marginTop: 4 }}>The 8 or 13 digits under the bars</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 }}>
                                    <TextInput
                                        value={barcode}
                                        onChangeText={setBarcode}
                                        onSubmitEditing={() => lookUp(barcode)}
                                        inputMode="numeric"
                                        placeholder="5449000000996"
                                        placeholderTextColor="#6b7f71"
                                        accessibilityLabelledBy="barcode-label"
                                        aria-label="Barcode number"
                                        style={{ flexGrow: 1, flexBasis: 180, minWidth: 0, height: 48, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1.5, borderColor: "#6b7f71", backgroundColor: "#ffffff", fontFamily: FONT.medium, fontSize: 17, letterSpacing: 0.5, color: "#142019" }}
                                    />
                                    <Pressable
                                        onPress={() => lookUp(barcode)}
                                        disabled={looking}
                                        accessibilityRole="button"
                                        style={{ height: 48, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "#2f6b45", justifyContent: "center" }}
                                    >
                                        <Text style={{ fontFamily: FONT.bold, fontSize: 16, color: "#ffffff" }}>{looking ? "Looking..." : "Look it up"}</Text>
                                    </Pressable>
                                </View>
                                <Text style={{ fontFamily: FONT.semiBold, fontSize: 14, color: "#3a4a40", marginTop: 18, marginBottom: 8 }}>Or try one of these</Text>
                                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                                    {TRY_THESE.map((item) => (
                                        <Pressable
                                            key={item.barcode}
                                            onPress={() => { setBarcode(item.barcode); lookUp(item.barcode); }}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Look up ${item.name}`}
                                            style={{ minHeight: 44, paddingHorizontal: 14, borderRadius: 10, borderWidth: 1.5, borderColor: "#2f6b45", justifyContent: "center" }}
                                        >
                                            <Text style={{ fontFamily: FONT.semiBold, fontSize: 15, color: "#142019" }}>{item.name}</Text>
                                        </Pressable>
                                    ))}
                                </View>
                            </View>

                            {recent.length > 0 && (
                                <View style={panel}>
                                    <Text style={{ fontFamily: FONT.bold, fontSize: 20, color: theme.text }} accessibilityRole="header">Scanned recently</Text>
                                    <View style={{ marginTop: 12 }}>
                                        {recent.map((item) => (
                                            <Pressable
                                                key={item.barcode}
                                                onPress={() => lookUp(item.barcode)}
                                                accessibilityRole="button"
                                                accessibilityLabel={`${item.name}, ${materialLabel(item.material)}, ${item.recyclable ? "recyclable" : "not recyclable"}. Look it up again`}
                                                style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderTopWidth: 1, borderColor: c.border }}
                                            >
                                                <Text style={{ flex: 1, fontFamily: FONT.semiBold, fontSize: 15, color: theme.text }} numberOfLines={1}>{item.name}</Text>
                                                <Text style={{ fontFamily: FONT.regular, fontSize: 14, color: theme.text_muted }}>{materialLabel(item.material)}</Text>
                                                <Text style={{
                                                    paddingVertical: 4, paddingHorizontal: 10, borderRadius: 8, overflow: "hidden",
                                                    fontFamily: FONT.bold, fontSize: 13,
                                                    backgroundColor: item.recyclable ? theme.accent : "transparent",
                                                    color: item.recyclable ? theme.on_accent : theme.text,
                                                    borderWidth: item.recyclable ? 0 : 1.5, borderColor: theme.text_muted,
                                                }}>
                                                    {item.recyclable ? "Recyclable" : "Not recyclable"}
                                                </Text>
                                            </Pressable>
                                        ))}
                                    </View>
                                </View>
                            )}
                        </View>
                    </View>
                </View>
            </ScrollView>
        </MotiView>
    );
};

export default Scanning;

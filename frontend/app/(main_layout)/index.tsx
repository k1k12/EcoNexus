import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, useWindowDimensions } from 'react-native';
import { router } from 'expo-router';

import { useThemeContext } from '@/context/ThemeContext';
import { FONT } from '@/constants/Fonts';
import { DEMO_ACCOUNTS, DEMO_ACCOUNTS_ENABLED } from '@/constants/DemoAccounts';
import { useDemoLogin } from '@/hooks/useDemoLogin';
import PhoneMockup from '@/components/home/PhoneMockup';
import { Underline, CurlyArrow, BottleDoodle, CupDoodle, BoxDoodle, AreaSketch } from '@/components/home/Doodles';

/**
 * Home Component
 *
 * The landing page: what EcoNexus does, who it's for, and a quick way into the
 * demo accounts. Bold type on forest green in dark mode, soft sage in light
 * mode, with a few hand-drawn touches. Stacks into one column on narrow screens.
 */

const FEATURES = [
    { title: "Scan the barcode", text: "With your phone camera, or type the number. Anything we haven't seen before gets looked up on Open Food Facts." },
    { title: "Learn the material", text: "The packaging is matched to one of 16 materials, from glass and cardboard to PET, HDPE and Tetra Pak." },
    { title: "Find a point", text: "The map shows the recycling points nearby that accept it, and when they're open." },
    { title: "See your week", text: "Your dashboard adds up what you've recycled, by day and by material." },
];

const Home: React.FC = () => {
    const { theme } = useThemeContext();
    const { width } = useWindowDimensions();
    const { logInAs, loadingRole, error } = useDemoLogin();

    const isDark = theme.type === "dark";
    const wide = width >= 900;

    // Colours for the sections that differ between light and dark mode
    const c = {
        border: isDark ? "#3a5a45" : "#9fb3a5",
        bandBg: isDark ? "#f2f5ef" : theme.bg_secondary,
        bandText: "#142019",
        bandMuted: "#3a4a40",
        bandAccent: "#2f6b45",
        panel: isDark ? theme.bg_secondary : "#e3eee4",
        river: isDark ? "#3a5a45" : "#b9cfc0",
        road: isDark ? "#24402e" : "#cdd9cf",
        underline: isDark ? theme.text : theme.accent,
        demoButtonBg: isDark ? "#0e1b13" : "#ffffff",
        demoButtonText: isDark ? "#eef5ef" : "#142019",
    };

    const styles = StyleSheet.create({
        scroll: {
            flex: 1,
            width: "100%",
        },
        section: {
            width: "100%",
            maxWidth: 1200,
            alignSelf: "center",
            paddingHorizontal: wide ? 24 : 8,
        },
        row: {
            flexDirection: wide ? "row" : "column",
            gap: 40,
        },
        hand: {
            fontFamily: FONT.hand,
            color: theme.accent,
        },
        // Hero
        hero: {
            paddingTop: wide ? 40 : 20,
            paddingBottom: 64,
            alignItems: wide ? "center" : "stretch",
        },
        heroText: {
            flex: wide ? 1 : undefined,
        },
        kicker: {
            fontSize: 30,
            marginBottom: 12,
            transform: [{ rotate: "-2deg" }],
            alignSelf: "flex-start",
        },
        h1: {
            fontFamily: FONT.bold,
            fontSize: wide ? 88 : 52,
            lineHeight: wide ? 86 : 52,
            letterSpacing: wide ? -3.5 : -2,
            color: theme.text,
        },
        greenWord: {
            alignSelf: "flex-start",
        },
        greenText: {
            fontFamily: FONT.bold,
            fontSize: wide ? 88 : 52,
            lineHeight: wide ? 92 : 58,
            letterSpacing: wide ? -3.5 : -2,
            color: theme.accent,
        },
        underline: {
            marginTop: -6,
        },
        subtitle: {
            fontFamily: FONT.semiBold,
            fontSize: wide ? 30 : 24,
            color: theme.text,
            marginTop: 22,
            letterSpacing: -0.5,
        },
        lead: {
            fontFamily: FONT.regular,
            fontSize: 19,
            lineHeight: 29,
            color: theme.text_muted,
            marginTop: 16,
            maxWidth: 520,
        },
        buttons: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 12,
            marginTop: 30,
        },
        primaryButton: {
            minHeight: 52,
            paddingHorizontal: 24,
            borderRadius: 12,
            backgroundColor: theme.accent,
            justifyContent: "center",
        },
        primaryButtonText: {
            fontFamily: FONT.bold,
            fontSize: 17,
            color: theme.on_accent,
        },
        secondaryButton: {
            minHeight: 52,
            paddingHorizontal: 20,
            borderRadius: 12,
            borderWidth: 1.5,
            borderColor: c.border,
            justifyContent: "center",
        },
        secondaryButtonText: {
            fontFamily: FONT.semiBold,
            fontSize: 17,
            color: theme.text,
        },
        heroPicture: {
            flex: wide ? 1 : undefined,
            alignItems: "center",
            paddingTop: wide ? 50 : 0,
            paddingBottom: 30,
        },
        // On narrow screens the note sits above the phone instead of beside it
        note: {
            position: wide ? "absolute" : "relative",
            top: 0,
            left: wide ? 0 : -40,
            marginBottom: wide ? 0 : 18,
            fontSize: 28,
            lineHeight: 30,
            maxWidth: 180,
            transform: [{ rotate: "-6deg" }],
        },
        noteArrow: {
            position: "absolute",
            top: 74,
            left: wide ? 40 : 30,
        },
        // What it does
        band: {
            backgroundColor: c.bandBg,
            paddingVertical: 64,
            borderRadius: wide ? 24 : 16,
        },
        h2: {
            fontFamily: FONT.bold,
            fontSize: wide ? 46 : 36,
            lineHeight: wide ? 48 : 38,
            letterSpacing: -1.5,
        },
        bandIntro: {
            flex: wide ? 1 : undefined,
        },
        bandNote: {
            fontSize: 26,
            color: c.bandAccent,
            marginTop: 14,
            transform: [{ rotate: "-2deg" }],
            alignSelf: "flex-start",
        },
        doodles: {
            flexDirection: "row",
            gap: 14,
            marginTop: 24,
        },
        featureList: {
            flex: wide ? 2 : undefined,
        },
        feature: {
            flexDirection: wide ? "row" : "column",
            gap: wide ? 32 : 6,
            paddingVertical: 22,
            borderTopWidth: 2,
            borderColor: c.bandText,
        },
        featureTitle: {
            fontFamily: FONT.bold,
            fontSize: 23,
            color: c.bandText,
            width: wide ? 220 : undefined,
        },
        featureText: {
            fontFamily: FONT.regular,
            fontSize: 18,
            lineHeight: 27,
            color: c.bandMuted,
            flex: wide ? 1 : undefined,
        },
        // Councils
        councils: {
            paddingVertical: 64,
            alignItems: wide ? "center" : "stretch",
        },
        label: {
            fontFamily: FONT.semiBold,
            fontSize: 16,
            color: theme.accent,
            marginBottom: 10,
        },
        body: {
            fontFamily: FONT.regular,
            fontSize: 18,
            lineHeight: 27,
            color: theme.text_muted,
            marginTop: 16,
            maxWidth: 500,
        },
        sketch: {
            flex: wide ? 1 : undefined,
            height: 300,
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: c.panel,
        },
        sketchNote: {
            position: "absolute",
            right: 18,
            bottom: 12,
            fontSize: 24,
            color: theme.text,
            transform: [{ rotate: "-3deg" }],
        },
        // Demo
        demo: {
            paddingBottom: 64,
        },
        demoCard: {
            borderRadius: 20,
            backgroundColor: theme.accent,
            padding: wide ? 40 : 24,
            flexDirection: wide ? "row" : "column",
            alignItems: wide ? "center" : "flex-start",
            gap: 24,
        },
        demoTitle: {
            fontFamily: FONT.bold,
            fontSize: wide ? 44 : 34,
            letterSpacing: -1.5,
            color: theme.on_accent,
        },
        demoText: {
            fontFamily: FONT.regular,
            fontSize: 18,
            lineHeight: 26,
            color: theme.on_accent,
            marginTop: 10,
            maxWidth: 480,
        },
        demoError: {
            fontFamily: FONT.semiBold,
            fontSize: 15,
            color: theme.on_accent,
            marginTop: 10,
        },
        demoButtons: {
            flexDirection: "row",
            flexWrap: "wrap",
            gap: 10,
        },
        demoButton: {
            minHeight: 48,
            paddingHorizontal: 20,
            borderRadius: 12,
            backgroundColor: c.demoButtonBg,
            justifyContent: "center",
        },
        demoButtonText: {
            fontFamily: FONT.bold,
            fontSize: 16,
            color: c.demoButtonText,
        },
        // Footer
        footer: {
            borderTopWidth: 1,
            borderColor: c.border,
            paddingVertical: 28,
            flexDirection: wide ? "row" : "column",
            alignItems: wide ? "center" : "flex-start",
            gap: wide ? 32 : 10,
        },
        footerName: {
            fontFamily: FONT.bold,
            fontSize: 18,
            color: theme.text,
        },
        footerText: {
            fontFamily: FONT.regular,
            fontSize: 15,
            lineHeight: 22,
            color: theme.text_muted,
            flex: wide ? 1 : undefined,
        },
        footerLink: {
            fontFamily: FONT.semiBold,
            fontSize: 15,
            color: theme.accent,
            textDecorationLine: "underline",
        },
    });

    return (
        <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 24 }}>

            <View style={[styles.section, styles.row, styles.hero]}>
                <View style={styles.heroText}>
                    <Text style={[styles.hand, styles.kicker]}>Scan, Sort, Save</Text>
                    <Text style={styles.h1} accessibilityRole="header">Ready to be</Text>
                    <View style={styles.greenWord}>
                        <Text style={styles.greenText}>green?</Text>
                        <View style={styles.underline}>
                            <Underline color={c.underline} width={wide ? 250 : 150} height={wide ? 22 : 16} />
                        </View>
                    </View>
                    <Text style={styles.subtitle}>Scan and keep recycling simple!</Text>
                    <Text style={styles.lead}>
                        EcoNexus uses barcode recognition and location-based services to help you identify
                        recyclable items, and shows where they can be disposed of in your local community.
                    </Text>
                    <View style={styles.buttons}>
                        <Pressable style={styles.primaryButton} onPress={() => router.navigate("/scan")} accessibilityRole="button">
                            <Text style={styles.primaryButtonText}>Scan something</Text>
                        </Pressable>
                        <Pressable style={styles.secondaryButton} onPress={() => router.navigate("/usermap")} accessibilityRole="button">
                            <Text style={styles.secondaryButtonText}>Open the map</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.heroPicture}>
                    <Text style={[styles.hand, styles.note]}>a real scan from the demo</Text>
                    {wide && (
                        <View style={styles.noteArrow}>
                            <CurlyArrow color={theme.accent} />
                        </View>
                    )}
                    <PhoneMockup />
                </View>
            </View>

            <View style={styles.band}>
                <View style={[styles.section, styles.row]}>
                    <View style={styles.bandIntro}>
                        <Text style={[styles.h2, { color: c.bandText }]} accessibilityRole="header">What it actually does</Text>
                        <Text style={[styles.hand, styles.bandNote]}>(it's a uni project, but it works)</Text>
                        <View style={styles.doodles}>
                            <BottleDoodle color={c.bandAccent} />
                            <CupDoodle color={c.bandAccent} />
                            <BoxDoodle color={c.bandAccent} />
                        </View>
                    </View>
                    <View style={styles.featureList}>
                        {FEATURES.map((feature, i) => (
                            <View key={feature.title} style={[styles.feature, i === FEATURES.length - 1 && { borderBottomWidth: 2 }]}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureText}>{feature.text}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </View>

            <View style={[styles.section, styles.row, styles.councils]}>
                <View style={{ flex: wide ? 1 : undefined }}>
                    <Text style={styles.label}>For councils</Text>
                    <Text style={[styles.h2, { color: theme.text }]} accessibilityRole="header">Your area. Your points. Kept up to date.</Text>
                    <Text style={styles.body}>
                        Local councils can log recycling data specific to their area: drop points onto the map,
                        set what each one takes and when it's open, and see which materials people bring most.
                        An admin approves each new council first.
                    </Text>
                </View>
                <View style={styles.sketch}>
                    <AreaSketch color={theme.accent} river={c.river} road={c.road} />
                    <Text style={[styles.hand, styles.sketchNote]}>the demo area, around Newcastle</Text>
                </View>
            </View>

            <View style={[styles.section, styles.demo]}>
                <View style={styles.demoCard}>
                    <View style={{ flex: wide ? 1 : undefined }}>
                        <Text style={styles.demoTitle} accessibilityRole="header">Try EcoNexus</Text>
                        {DEMO_ACCOUNTS_ENABLED ? (
                            <Text style={styles.demoText}>Log in as any role to look around. There's no need to sign up.</Text>
                        ) : (
                            <Text style={styles.demoText}>Create an account to start tracking what you recycle.</Text>
                        )}
                        {error && <Text style={styles.demoError}>{error}</Text>}
                    </View>
                    <View style={styles.demoButtons}>
                        {DEMO_ACCOUNTS_ENABLED ? (
                            DEMO_ACCOUNTS.map((account) => (
                                <Pressable
                                    key={account.role}
                                    style={styles.demoButton}
                                    onPress={() => logInAs(account)}
                                    disabled={loadingRole !== null}
                                    accessibilityRole="button"
                                    accessibilityLabel={`Log in as the demo ${account.role}`}
                                >
                                    <Text style={styles.demoButtonText}>
                                        {loadingRole === account.role ? "Logging in..." : account.role}
                                    </Text>
                                </Pressable>
                            ))
                        ) : (
                            <Pressable style={styles.demoButton} onPress={() => router.navigate("/login")} accessibilityRole="button">
                                <Text style={styles.demoButtonText}>Sign In / Create Account</Text>
                            </Pressable>
                        )}
                    </View>
                </View>
            </View>

            <View style={[styles.section, styles.footer]}>
                <Text style={styles.footerName}>EcoNexus</Text>
                <Text style={styles.footerText}>
                    Made by Team 30 at Newcastle University. Supporting UN Sustainable Development Goals 11
                    (Sustainable Cities and Communities) and 12 (Responsible Consumption and Production).
                </Text>
                <Pressable onPress={() => router.navigate("/mission")} accessibilityRole="link">
                    <Text style={styles.footerLink}>Our Mission</Text>
                </Pressable>
                <Pressable onPress={() => Linking.openURL("https://github.com/k1k12/EcoNexus")} accessibilityRole="link">
                    <Text style={styles.footerLink}>Code on GitHub</Text>
                </Pressable>
            </View>
        </ScrollView>
    );
};

export default Home;

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

import { FONT } from "@/constants/Fonts";
import { Barcode } from "@/components/home/Doodles";

/**
 * PhoneMockup
 *
 * A tilted phone showing what a scan result looks like, using a product from
 * the demo data. It's a picture of the app, so it always uses light colours
 * whatever the theme.
 */
const PhoneMockup = () => {
  return (
    <View style={styles.phone} accessibilityRole="image" accessibilityLabel="Phone showing a scan result: Coca-Cola can, metal, recyclable, with the nearest point that takes metal">
      <View style={styles.screen}>
        <View style={styles.scanArea}>
          <Barcode color="#17231b" scanLine="#2f7a4c" />
          <Text style={styles.barcodeNumber}>5449000000996</Text>
        </View>

        <View>
          <Text style={styles.caption}>Scanned just now</Text>
          <Text style={styles.product}>Coca-Cola can</Text>
        </View>

        <View style={styles.tags}>
          <Text style={[styles.tag, styles.material]}>Metal</Text>
          <View style={[styles.tag, styles.recyclable]}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M20 6 9 17l-5-5" stroke="#ffffff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            </Svg>
            <Text style={styles.recyclableText}>Recyclable</Text>
          </View>
        </View>

        <View style={styles.point}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" stroke="#a5560a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={12} cy={10} r={3} stroke="#a5560a" strokeWidth={2} />
          </Svg>
          <View style={{ flexShrink: 1 }}>
            <Text style={styles.pointTitle}>Nearest point takes metal</Text>
            <Text style={styles.caption}>Open all day</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  phone: {
    width: 290,
    borderRadius: 38,
    backgroundColor: "#050b07",
    padding: 11,
    transform: [{ rotate: "3deg" }],
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 30 },
    shadowOpacity: 0.35,
    shadowRadius: 30,
    elevation: 12,
  },
  screen: {
    borderRadius: 28,
    backgroundColor: "#ffffff",
    padding: 20,
    gap: 14,
  },
  scanArea: {
    height: 140,
    borderRadius: 16,
    backgroundColor: "#eef3ec",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  barcodeNumber: {
    fontFamily: "monospace",
    fontSize: 10,
    color: "#3d4b42",
  },
  caption: {
    fontFamily: FONT.medium,
    fontSize: 13,
    color: "#55645a",
  },
  product: {
    fontFamily: FONT.bold,
    fontSize: 22,
    color: "#17231b",
    marginTop: 2,
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  tag: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    overflow: "hidden",
    fontFamily: FONT.bold,
    fontSize: 13,
  },
  material: {
    backgroundColor: "#e3eee4",
    color: "#23573a",
  },
  recyclable: {
    backgroundColor: "#23573a",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recyclableText: {
    fontFamily: FONT.bold,
    fontSize: 13,
    color: "#ffffff",
  },
  point: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e3e8df",
    padding: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  pointTitle: {
    fontFamily: FONT.bold,
    fontSize: 14,
    color: "#17231b",
  },
});

export default PhoneMockup;

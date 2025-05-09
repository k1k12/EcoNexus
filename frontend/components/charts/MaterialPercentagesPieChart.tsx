import React, { useState, useMemo } from "react";
import { View, Text } from "react-native";
import { PieChart } from "react-native-gifted-charts";

export type MaterialPercentage = {
  name: string;
  value: number;
  percentage: string;
  color: string;
};

type Props = {
  data: MaterialPercentage[];
  title?: string;
};

const MaterialPercentagesPieChart: React.FC<Props> = ({ data, title }) => {
  const [activeSegment, setActiveSegment] = useState<string | null>(null);

  const pieData = useMemo(() => {
    return data.map((material) => {
      const isActive = activeSegment === material.name;
      return {
        value: material.value,
        color: material.color,
        strokeWidth: isActive ? 2 : 1,
        strokeColor: isActive ? "#ffffff" : "rgba(255,255,255,0.5)",
        // Increase radius for active segment
        focused: isActive,
        // Only show percentage when segment is active
        text: isActive ? `${material.percentage}%` : "",
        textColor: "#ffffff",
        textSize: 14,
        fontWeight: "bold",
        id: material.name,
        onPress: () => setActiveSegment(isActive ? null : material.name)
      };
    });
  }, [data, activeSegment]);

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: "100%" }}>
      {title && (
        <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 8 }}>{title}</Text>
      )}
      <PieChart data={pieData} focusOnPress toggleFocusOnPress donut radius={80} innerRadius={15} showText/>
    </View>
  );
};

export default MaterialPercentagesPieChart;

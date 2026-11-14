import React from "react";
import Svg, { Path, Circle, G } from "react-native-svg";

/**
 * Doodles
 *
 * Hand-drawn style line art for the home page, drawn as SVG so it scales and
 * takes the theme's colours. Every doodle is decorative, so none of them is
 * read out by screen readers.
 */

type DoodleProps = {
  color: string;
  width?: number;
  height?: number;
};

// A wobbly marker underline, drawn twice like a quick pen stroke
export const Underline = ({ color, width = 220, height = 22 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 220 24" preserveAspectRatio="none" aria-hidden>
    <Path d="M3 15c38-7 84-10 128-8 30 1 58 4 86 9" stroke={color} strokeWidth={6} fill="none" strokeLinecap="round" />
    <Path d="M20 20c46-5 96-6 150-2" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" opacity={0.7} />
  </Svg>
);

// A loose curved arrow pointing down and to the right
export const CurlyArrow = ({ color, width = 90, height = 70 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 90 70" aria-hidden>
    <Path d="M6 6c10 24 30 42 64 46" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" />
    <Path d="M58 40l14 12-16 8" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const LeafMark = ({ color, width = 30, height = 30 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 40 40" fill="none" aria-hidden>
    <Path d="M20 35c-8-1-13-7-12-15 1-7 7-12 15-13 5 0 9 1 10 2-1 9-3 17-9 22-1 1-3 3-4 4Z" stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M9 33c5-6 10-11 17-16" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
  </Svg>
);

export const BottleDoodle = ({ color, width = 44, height = 60 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 44 60" fill="none" aria-hidden>
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 3h10M18 3v9c-7 4-10 9-10 16v26c0 2 1 3 3 3h22c2 0 3-1 3-3V28c0-7-3-12-10-16V3" />
      <Path d="M9 34c9 2 17 2 26 0" />
    </G>
  </Svg>
);

export const CupDoodle = ({ color, width = 40, height = 60 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 40 60" fill="none" aria-hidden>
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 10c9-3 19-3 28 1l-2 42c-8 3-16 3-24 0Z" />
      <Path d="M8 20c8 2 16 2 24-1" />
      <Path d="M14 4h12" />
    </G>
  </Svg>
);

export const BoxDoodle = ({ color, width = 56, height = 60 }: DoodleProps) => (
  <Svg width={width} height={height} viewBox="0 0 56 60" fill="none" aria-hidden>
    <G stroke={color} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M4 20 28 10l24 10v30L28 58 4 50Z" />
      <Path d="M4 20l24 10 24-10M28 30v28" />
      <Path d="M16 15l24 10" />
    </G>
  </Svg>
);

// A rough sketch of a council area: dashed outline, a river, two roads and some points
export const AreaSketch = ({ color, river, road }: { color: string; river: string; road: string }) => (
  <Svg width="100%" height="100%" viewBox="0 0 480 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
    <Path d="M70 60c40-20 120-30 190-24 70 4 130 20 160 50 20 30 10 90-10 130-30 40-110 60-190 56-80-2-140-24-160-60-20-40-24-120 10-152Z" fill="none" stroke={color} strokeWidth={2.5} strokeDasharray="8 7" strokeLinecap="round" />
    <Path d="M20 200c60-10 100 10 160-4s100-30 170-8 90 10 140 0" fill="none" stroke={river} strokeWidth={10} strokeLinecap="round" />
    <Path d="M150 0c10 60 20 120 6 300M330 0c-6 80 0 160 14 300" fill="none" stroke={road} strokeWidth={6} strokeLinecap="round" />
    <G fill={color}>
      <Circle cx={160} cy={110} r={9} />
      <Circle cx={250} cy={150} r={9} />
      <Circle cx={330} cy={100} r={9} />
      <Circle cx={210} cy={230} r={9} />
      <Circle cx={380} cy={200} r={9} />
    </G>
  </Svg>
);

// The barcode drawn on the phone mockup's scan screen
export const Barcode = ({ color, scanLine }: { color: string; scanLine: string }) => {
  const bars = [[0, 4], [8, 2], [13, 6], [22, 2], [27, 4], [35, 2], [40, 6], [49, 3], [56, 2], [61, 5], [70, 2], [75, 4], [83, 6], [92, 2], [97, 3], [104, 5], [113, 2], [118, 4], [126, 2], [131, 6], [141, 2], [146, 4]];
  return (
    <Svg width={150} height={60} viewBox="0 0 150 60" aria-hidden>
      <G fill={color}>
        {bars.map(([x, w]) => (
          <Path key={x} d={`M${x} 0h${w}v56h-${w}Z`} />
        ))}
      </G>
      <Path d="M0 27h150v2H0Z" fill={scanLine} />
    </Svg>
  );
};

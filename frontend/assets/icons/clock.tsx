import * as React from "react";
import Svg, { SvgProps, Circle, Polyline } from "react-native-svg";
const ClockIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-clock-icon lucide-clock"
    {...props}
  >
    <Circle cx={12} cy={12} r={10} />
    <Polyline points="12 6 12 12 16 14" />
  </Svg>
);
export default ClockIcon;
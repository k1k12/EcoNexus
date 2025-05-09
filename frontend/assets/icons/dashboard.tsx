import * as React from "react";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";
const DashboardIcon = (props: SvgProps) => (
  <Svg
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.stroke || "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-chart-column"
    {...props}
  >
    <Path d="M3 3v16a2 2 0 0 0 2 2h16" stroke="black" fill="white"/>
    <Path d="M18 17V9" stroke="black" fill="none"/>
    <Path d="M13 17V5" stroke="black" fill="none"/>
    <Path d="M8 17v-3" stroke="black" fill="none"/>
  </Svg>
);

export default DashboardIcon;

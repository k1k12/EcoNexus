import * as React from "react";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

const ScanIcon = (props: SvgProps) => (
  <Svg
      width={props.width ?? "24"}
      height={props.height ?? "24"}
      viewBox="0 0 24 24"
      fill="none"
      stroke={props.stroke ?? "black"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
    <Rect width={5} height={5} x={3} y={3} rx={1} fill="none" />
    <Rect width={5} height={5} x={16} y={3} rx={1} fill="none" />
    <Rect width={5} height={5} x={3} y={16} rx={1} fill="none" />
    <Path d="M21 16h-3a2 2 0 0 0-2 2v3" fill="none" />
    <Path d="M21 21v.01" fill="none" />
    <Path d="M12 7v3a2 2 0 0 1-2 2H7" fill="none"/>
    <Path d="M3 12h.01" fill="none"/>
    <Path d="M12 3h.01" fill="none"/>
    <Path d="M12 16v.01" fill="none"/>
    <Path d="M16 12h1" fill="none"/>
    <Path d="M21 12v.01" fill="none"/>
    <Path d="M12 21v-1" fill="none"/>
  </Svg>
);
export default ScanIcon;

import * as React from "react";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

const MapIcon = (props: SvgProps) => (
  <Svg
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.stroke || "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-map"
    {...props}
  >
    <Path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" fill="white" stroke="black"/>
    <Path d="M15 5.764v15" fill="none" stroke="black"/>
    <Path d="M9 3.236v15" fill="none" stroke="black"/>
  </Svg>
); 

export default MapIcon;

import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";

interface ArrowIconProps extends SvgProps {
  rotation?: number; // degrees
}

const ArrowIcon = ({ rotation = 0, ...props }: ArrowIconProps) => (
  <Svg
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.stroke || "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    style={[props.style, { transform: [{ rotate: `${rotation}deg` }] }]}
    {...props}
  >
    <Path d="M5 12h14" />
    <Path d="M12 5l7 7-7 7" />
  </Svg>
);

export default ArrowIcon;

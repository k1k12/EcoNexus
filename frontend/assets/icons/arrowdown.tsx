import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
const ArrowDownIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-arrow-big-down-icon lucide-arrow-big-down"
    {...props}
  >
    <Path d="M15 6v6h4l-7 7-7-7h4V6h6z" />
  </Svg>
);
export default ArrowDownIcon;
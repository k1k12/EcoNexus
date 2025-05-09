import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
const ArrowUpIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-arrow-big-up-icon lucide-arrow-big-up"
    {...props}
  >
    <Path d="M9 18v-6H5l7-7 7 7h-4v6H9z" />
  </Svg>
);
export default ArrowUpIcon;

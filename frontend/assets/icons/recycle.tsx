import * as React from "react";
import Svg, { Path, SvgProps } from "react-native-svg";
const RecycleIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-recycle-icon lucide-recycle"
    {...props}
  >
    <Path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
    <Path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
    <Path d="m14 16-3 3 3 3" />
    <Path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
    <Path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
    <Path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
  </Svg>
);
export default RecycleIcon;
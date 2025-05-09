import * as React from "react";
import Svg, { Path, Polyline, Line, SvgProps } from "react-native-svg";

const SignInIcon = (props: SvgProps) => (
  <Svg
  width={props.width || 24}
  height={props.height || 24}
  viewBox="0 0 24 24"
  fill="none"
  stroke={props.stroke || "currentColor"}
  strokeWidth={4}
  strokeLinecap="round"
  strokeLinejoin="round"
  className="lucide lucide-log-in-icon lucide-log-in"
  {...props}
>
  <Path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
  <Polyline points="10 17 15 12 10 7" />
  <Line x1={15} x2={3} y1={12} y2={12} />
</Svg>
);

export default SignInIcon;
import * as React from "react";
import Svg, { Rect, Path, SvgProps } from "react-native-svg";

const QRCodeIcon = (props: SvgProps) => (
  <Svg
    width={24}
    height={24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="lucide lucide-qr-code"
    {...props}
  >
    <Rect width={5} height={5} x={3} y={3} rx={1} />
    <Rect width={5} height={5} x={16} y={3} rx={1} />
    <Rect width={5} height={5} x={3} y={16} rx={1} />
    <Path d="M21 16h-3a2 2 0 0 0-2 2v3" />
    <Path d="M21 21v.01" />
    <Path d="M12 7v3a2 2 0 0 1-2 2H7" />
    <Path d="M3 12h.01" />
    <Path d="M12 3h.01" />
    <Path d="M12 16v.01" />
    <Path d="M16 12h1" />
    <Path d="M21 12v.01" />
    <Path d="M12 21v-1" />
  </Svg>
);
export default QRCodeIcon;

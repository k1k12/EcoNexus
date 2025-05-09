import Svg, { Circle, Path, type SvgProps } from "react-native-svg"

const InfoIcon = (props: SvgProps) => (
  <Svg
    width={props.width || 24}
    height={props.height || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke={props.stroke || "currentColor"}
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <Circle cx={12} cy={12} r={10} />
    <Path d="M12 16v-4" />
    <Path d="M12 8h.01" />
  </Svg>
)

export default InfoIcon

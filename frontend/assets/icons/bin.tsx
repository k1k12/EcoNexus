import Svg, {Line, Path, SvgProps } from "react-native-svg";

export const binIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="cyan" stroke="blue" stroke-width="2" 
                        stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>`

export const incompleteBinIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="red" stroke="purple" stroke-width="2" 
                        stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>` 

export const selectedBinIconHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="yellow" stroke="red" stroke-width="2" 
                        stroke-linecap="round" stroke-linejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>` 



export const BinIcon = (props: SvgProps) => (
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

  <Path d="M3 6h18"/>
  <Path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
  <Path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  <Line x1="14" x2="14" y1="11" y2="17"/>
  <Line x1="10" x2="10" y1="11" y2="17"/>
  <Line x1="6" x2="6" y1="11" y2="17"/>

  </Svg>
);

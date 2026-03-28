import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampRoundProps } from "./types.js";

// Round stamp - East Asian / Chinese style
export function StampRound({
  color = "#cc0000",
  country = "CHINA",
  countryNative = "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD",
  portNative = "\u6DF1\u5733\u6E7E\u53E3\u5CB8",
  port = "SHENZHEN BAY PORT",
  date = "04 MAR 2024",
  type = "ENTRY",
  filter = "medium",
  fade = "corner",
  rotation = 6,
}: StampRoundProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade}>
        <circle cx="100" cy="100" r="90" fill="none" stroke={color} strokeWidth="3.5" />
        <circle cx="100" cy="100" r="82" fill="none" stroke={color} strokeWidth="0.9" />
        <circle cx="100" cy="100" r="34" fill="none" stroke={color} strokeWidth="1.2" />
        {/* Arc text top */}
        <path id="top-arc" d="M 22,100 A 78,78 0 0,1 178,100" fill="none" />
        <text fontFamily="sans-serif" fontSize="9.5" fill={color} letterSpacing="1.5">
          <textPath href="#top-arc" startOffset="12%">{country} BORDER INSPECTION</textPath>
        </text>
        {/* Arc text bottom */}
        <path id="bot-arc" d="M 24,110 A 76,76 0 0,0 176,110" fill="none" />
        <text fontFamily="sans-serif" fontSize="8" fill={color}>
          <textPath href="#bot-arc" startOffset="8%">{port}</textPath>
        </text>
        {/* Centre */}
        <text x="100" y="95" textAnchor="middle" fontFamily="sans-serif" fontSize="9" fill={color}>{countryNative}</text>
        <text x="100" y="108" textAnchor="middle" fontFamily="sans-serif" fontSize="7.5" fill={color}>{portNative}</text>
        {/* Date band */}
        <text x="100" y="148" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="15" fontWeight="bold" fill={color}>{date}</text>
        <text x="100" y="163" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>{type} / \u5165\u5883</text>
      </StampGroup>
    </svg>
  );
}

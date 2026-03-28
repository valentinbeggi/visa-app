import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampVisitPassProps } from "./types.js";

// Visit pass stamp - Singapore style
export function StampVisitPass({
  color = "#006831",
  country = "SINGAPORE",
  refNo = "A099",
  date = "09 SEP 2024",
  until = "09 OCT 2024",
  filter = "medium",
  fade = "center",
  rotation = -6,
}: StampVisitPassProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade}>
        <rect x="5" y="5" width="190" height="190" rx="8" fill="none" stroke={color} strokeWidth="3.5" />
        <rect x="10" y="10" width="180" height="180" rx="5" fill="none" stroke={color} strokeWidth="0.8" />
        <text x="100" y="33" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color} letterSpacing="1.5">VISIT PASS</text>
        <text x="100" y="48" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color} letterSpacing="1">IMMIGRATION</text>
        <text x="100" y="62" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color} letterSpacing="0.5">{country}</text>
        <line x1="15" y1="70" x2="185" y2="70" stroke={color} strokeWidth="1.5" />
        <text x="35" y="87" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color}>REFERENCE NO:</text>
        <text x="35" y="102" fontFamily="Courier New,monospace" fontSize="14" fontWeight="bold" fill={color}>{refNo}</text>
        <text x="100" y="122" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="17" fontWeight="bold" fill={color}>{date}</text>
        <line x1="15" y1="132" x2="185" y2="132" stroke={color} strokeWidth="0.8" />
        <text x="100" y="148" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color}>PERMITTED TO REMAIN UNTIL</text>
        <text x="100" y="164" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="14" fontWeight="bold" fill={color}>{until}</text>
        <line x1="15" y1="173" x2="185" y2="173" stroke={color} strokeWidth="0.5" />
        <text x="100" y="183" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="6.5" fill={color}>HOLDER NOT PERMITTED TO WORK OR ENGAGE IN BUSINESS</text>
      </StampGroup>
    </svg>
  );
}

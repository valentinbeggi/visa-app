import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampRectEntryProps } from "./types.js";

// Rectangular entry stamp - Asia style (Thailand, Japan, India)
export function StampRectEntry({
  color = "#1a4fa8",
  country = "THAILAND",
  airport = "SUVARNABHUMI AIRPORT",
  date = "12 SEP 2024",
  stayDays = 30,
  visaClass = "TOURIST",
  officerCode = "A-42",
  filter = "medium",
  fade = "topleft",
  rotation = -4,
}: StampRectEntryProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade}>
        <rect x="8" y="8" width="184" height="184" rx="5" fill="none" stroke={color} strokeWidth="3.5" />
        <rect x="13" y="13" width="174" height="174" rx="3" fill="none" stroke={color} strokeWidth="0.8" />
        <text x="100" y="35" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="8" fill={color} letterSpacing="2.5">IMMIGRATION</text>
        <text x="100" y="48" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7" fill={color} letterSpacing="1.2">{airport}</text>
        <line x1="18" y1="55" x2="182" y2="55" stroke={color} strokeWidth="1.2" />
        <text x="100" y="72" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="12" fill={color} letterSpacing="1">{country}</text>
        <text x="100" y="86" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>ADMITTED</text>
        <line x1="18" y1="94" x2="182" y2="94" strokeDasharray="3,2" stroke={color} strokeWidth="0.6" />
        <text x="100" y="116" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="17" fontWeight="bold" fill={color}>{date}</text>
        <line x1="18" y1="126" x2="182" y2="126" stroke={color} strokeWidth="1" />
        <text x="100" y="141" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color}>STAY NOT TO EXCEED {stayDays} DAYS</text>
        <text x="100" y="155" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color}>VISA CLASS: {visaClass}</text>
        <line x1="18" y1="163" x2="182" y2="163" stroke={color} strokeWidth="0.5" />
        <text x="28" y="176" fontFamily="Arial,sans-serif" fontSize="6.5" fill={color}>OFFICER: {officerCode}</text>
        <text x="172" y="176" textAnchor="end" fontFamily="Arial,sans-serif" fontSize="6.5" fill={color}>SIGNED</text>
      </StampGroup>
    </svg>
  );
}

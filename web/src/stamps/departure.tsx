import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampDepartureProps } from "./types.js";

// Departure band stamp - South-East Asian style (Malaysia, Indonesia, Philippines)
export function StampDeparture({
  color = "#b5000a",
  country = "MALAYSIA",
  airport = "KL INTERNATIONAL",
  date = "09 SEP 2024",
  code = "KELUAR",
  officerBadge = "B6 555",
  filter = "heavy",
  fade = "corner",
  rotation = 5,
}: StampDepartureProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade}>
        <rect x="5" y="5" width="190" height="190" rx="8" fill="none" stroke={color} strokeWidth="3.5" />
        {/* top header band */}
        <rect x="5" y="5" width="190" height="36" rx="8" fill={color} />
        <rect x="5" y="28" width="190" height="13" fill={color} />
        <text x="100" y="28" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="11" fill="white" letterSpacing="2">{country}</text>
        <text x="100" y="44" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color} letterSpacing="1.5">IMMIGRATION {"\u00B7"} {airport}</text>
        <line x1="14" y1="52" x2="186" y2="52" stroke={color} strokeWidth="1" />
        <text x="100" y="84" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="18" fontWeight="bold" fill={color}>{date}</text>
        <line x1="14" y1="94" x2="186" y2="94" stroke={color} strokeWidth="1.2" />
        <text x="100" y="120" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="20" fill={color} letterSpacing="4">{code}</text>
        <text x="100" y="136" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>DEPARTURE / MENINGGALKAN</text>
        <line x1="14" y1="145" x2="186" y2="145" strokeDasharray="4,2" stroke={color} strokeWidth="0.6" />
        <text x="20" y="160" fontFamily="Arial,sans-serif" fontSize="7" fill={color}>REG. 11 IMM. REGS - 63</text>
        <rect x="130" y="150" width="50" height="26" rx="3" fill="none" stroke={color} strokeWidth="1" />
        <text x="155" y="161" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="6" fill={color}>OFFICER</text>
        <text x="155" y="172" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9" fontWeight="bold" fill={color}>{officerBadge}</text>
      </StampGroup>
    </svg>
  );
}

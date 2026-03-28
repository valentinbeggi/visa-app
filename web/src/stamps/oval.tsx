import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampOvalProps } from "./types.js";

// Oval stamp - Schengen / EU style
export function StampOval({
  color = "#d35400",
  city = "AMSTERDAM",
  airport = "SCHIPHOL",
  code = "NL",
  date = "20.05.2024",
  gate = "G 107",
  filter = "light",
  fade = "none",
  rotation = -3,
}: StampOvalProps) {
  return (
    <svg viewBox="0 0 220 170" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade} size={220}>
        <ellipse cx="110" cy="85" rx="103" ry="78" fill="none" stroke={color} strokeWidth="3.5" />
        <ellipse cx="110" cy="85" rx="97" ry="72" fill="none" stroke={color} strokeWidth="0.8" />
        <text x="56" y="44" fontFamily="Arial Black,sans-serif" fontSize="16" fontWeight="900" fill={color}>{code}</text>
        <line x1="20" y1="55" x2="200" y2="55" stroke={color} strokeWidth="1.2" />
        <text x="110" y="76" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="17" fontWeight="bold" fill={color}>{date}</text>
        <line x1="20" y1="85" x2="200" y2="85" stroke={color} strokeWidth="0.8" />
        <text x="90" y="100" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9" fill={color}>{"\u2192"}</text>
        <text x="120" y="102" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color}>{city}</text>
        <text x="110" y="116" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color}>{airport}</text>
        <line x1="20" y1="124" x2="200" y2="124" stroke={color} strokeWidth="0.7" />
        <text x="110" y="138" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color}>SCHENGEN AREA {"\u00B7"} MAX 90/180 DAYS</text>
        <text x="110" y="152" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>{gate}</text>
      </StampGroup>
    </svg>
  );
}

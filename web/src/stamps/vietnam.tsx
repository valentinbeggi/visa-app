import { InkDefs, StampGroup } from "./ink-effects.js";
import type { StampVietnamProps } from "./types.js";

// Pentagon / irregular band stamp - Vietnam style
export function StampVietnam({
  color = "#003580",
  port = "N\u1ED8I B\u00C0I",
  portCode = "141A",
  date = "30 AUG 2024",
  type = "NH\u1EACP C\u1EA2NH / ENTRY",
  filter = "medium",
  fade = "topleft",
  rotation = 3,
}: StampVietnamProps) {
  return (
    <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" style={{ transform: `rotate(${rotation}deg)`, display: "block" }}>
      <InkDefs />
      <StampGroup filter={filter} fade={fade}>
        <rect x="6" y="6" width="188" height="188" rx="4" fill="none" stroke={color} strokeWidth="3" />
        <rect x="11" y="11" width="178" height="178" rx="2" fill="none" stroke={color} strokeWidth="0.8" />
        <text x="100" y="35" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="11" fill={color} letterSpacing="1.5">VIETNAM</text>
        <text x="100" y="50" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="10" fill={color} letterSpacing="1">IMMIGRATION</text>
        <line x1="16" y1="58" x2="184" y2="58" stroke={color} strokeWidth="1.5" />
        <text x="48" y="76" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>PORT NO</text>
        <text x="48" y="92" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="14" fontWeight="bold" fill={color}>{portCode}</text>
        <text x="148" y="76" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="8" fill={color}>AIRPORT</text>
        <text x="148" y="92" textAnchor="middle" fontFamily="Arial Black,sans-serif" fontSize="12" fill={color}>{port}</text>
        <line x1="16" y1="100" x2="184" y2="100" stroke={color} strokeWidth="0.8" />
        <text x="100" y="122" textAnchor="middle" fontFamily="Courier New,monospace" fontSize="17" fontWeight="bold" fill={color}>{date}</text>
        <path d="M 60 135 L 80 145 L 100 135 L 120 145 L 140 135" stroke={color} strokeWidth="0.8" fill="none" />
        <text x="100" y="163" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="7.5" fill={color}>{type}</text>
        {/* stylised plane */}
        <path d="M 80 177 L 85 173 L 90 177 L 100 172 L 110 177 L 115 173 L 120 177" stroke={color} strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      </StampGroup>
    </svg>
  );
}

// ─── Passport Stamp Library ───
// Re-exports for easy consumption. Each stamp is a self-contained SVG component
// with configurable ink wear, fade, rotation, and country-specific props.
//
// Usage:
//   import { StampRectEntry, StampRound, STAMPS, PRESETS } from "@/stamps";
//   <StampRectEntry country="JAPAN" color="#8B0000" filter="medium" fade="topleft" />

export { StampRectEntry } from "./rect-entry.js";
export { StampRound } from "./round.js";
export { StampOval } from "./oval.js";
export { StampDeparture } from "./departure.js";
export { StampVisitPass } from "./visit-pass.js";
export { StampVietnam } from "./vietnam.js";
export { InkDefs, StampGroup } from "./ink-effects.js";
export { PRESETS, INK_OPTIONS, FADE_OPTIONS } from "./presets.js";
export { getStampForTrip, getTransitStamps } from "./country-mapping.js";
export type { StampConfig } from "./country-mapping.js";
export type * from "./types.js";

import type { StampRegistryEntry } from "./types.js";
import { StampRectEntry } from "./rect-entry.js";
import { StampRound } from "./round.js";
import { StampOval } from "./oval.js";
import { StampDeparture } from "./departure.js";
import { StampVisitPass } from "./visit-pass.js";
import { StampVietnam } from "./vietnam.js";

// Registry maps stamp type keys to their component + metadata.
// Useful for dynamic rendering (e.g. galleries, playground controls).
export const STAMPS: Record<string, StampRegistryEntry> = {
  rectEntry: { component: StampRectEntry as StampRegistryEntry["component"], label: "Rectangular Entry", aspect: "1/1" },
  round: { component: StampRound as StampRegistryEntry["component"], label: "Round (East Asian)", aspect: "1/1" },
  oval: { component: StampOval as StampRegistryEntry["component"], label: "Oval (Schengen EU)", aspect: "13/10" },
  departure: { component: StampDeparture as StampRegistryEntry["component"], label: "Departure Band", aspect: "1/1" },
  visitPass: { component: StampVisitPass as StampRegistryEntry["component"], label: "Visit Pass", aspect: "1/1" },
  vietnam: { component: StampVietnam as StampRegistryEntry["component"], label: "Vietnam / Irregular", aspect: "1/1" },
};

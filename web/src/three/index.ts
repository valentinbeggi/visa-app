// ─── Three.js passport module ───
// Everything needed to render the 3D passport scene.
//
// Usage:
//   import { usePassportScene } from "@/three";
//   usePassportScene(containerRef, nationality, nationalityCode, trips, currentPage);

export { usePassportScene } from "./use-passport-scene.js";
export { PASSPORT_COLORS, STAMP_COLORS, PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS } from "./constants.js";
export {
  createPassportCoverTexture,
  createPassportBackTexture,
  createPageTexture,
  createBlankPageTexture,
} from "./textures.js";
export type { TripData } from "./textures.js";

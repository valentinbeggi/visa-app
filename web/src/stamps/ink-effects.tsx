import type { InkFilter, FadeStyle } from "./types.js";

// ─── Shared SVG filter defs (inject once per SVG) ───
// Three ink-wear presets: light, medium, heavy
export function InkDefs() {
  return (
    <defs>
      {/* Turbulence-based ink bleed */}
      <filter id="ink-light" x="-10%" y="-10%" width="120%" height="120%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.065" numOctaves="4" seed="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.8" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feComposite in="displaced" in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="ink-medium" x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="4" seed="7" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feComposite in="displaced" in2="SourceGraphic" operator="in" />
      </filter>
      <filter id="ink-heavy" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
        <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="5" seed="12" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="6" xChannelSelector="R" yChannelSelector="G" result="displaced" />
        <feComposite in="displaced" in2="SourceGraphic" operator="in" />
      </filter>

      {/* Fade-out radial masks - simulate uneven ink coverage */}
      <radialGradient id="fade-center" cx="50%" cy="50%" r="52%">
        <stop offset="0%" stopColor="white" stopOpacity="0.18" />
        <stop offset="55%" stopColor="white" stopOpacity="0.04" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="fade-topleft" cx="20%" cy="22%" r="60%">
        <stop offset="0%" stopColor="white" stopOpacity="0.28" />
        <stop offset="50%" stopColor="white" stopOpacity="0.08" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>
      <radialGradient id="fade-corner" cx="80%" cy="75%" r="55%">
        <stop offset="0%" stopColor="white" stopOpacity="0.32" />
        <stop offset="45%" stopColor="white" stopOpacity="0.1" />
        <stop offset="100%" stopColor="white" stopOpacity="0" />
      </radialGradient>

      {/* Scratch / wear texture */}
      <filter id="worn" x="0" y="0" width="100%" height="100%">
        <feTurbulence type="turbulence" baseFrequency="0.9" numOctaves="2" seed="5" result="t" />
        <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 -8 9" result="mask" />
        <feComposite in="SourceGraphic" in2="mask" operator="in" />
      </filter>
    </defs>
  );
}

const FILTER_MAP: Record<InkFilter, string> = {
  none: "",
  light: "url(#ink-light)",
  medium: "url(#ink-medium)",
  heavy: "url(#ink-heavy)",
};

const FADE_MAP: Record<FadeStyle, string | null> = {
  none: null,
  center: "fade-center",
  topleft: "fade-topleft",
  corner: "fade-corner",
};

// ─── Wrapper that applies ink filter + fade to stamp children ───
export function StampGroup({
  filter,
  fade,
  children,
  size = 200,
}: {
  filter: InkFilter;
  fade: FadeStyle;
  children: React.ReactNode;
  size?: number;
}) {
  const fadeId = FADE_MAP[fade];
  return (
    <g filter={FILTER_MAP[filter] || ""}>
      {children}
      {fadeId && (
        <rect
          x="0" y="0"
          width={size} height={size}
          fill={`url(#${fadeId})`}
          style={{ pointerEvents: "none", mixBlendMode: "screen" }}
        />
      )}
    </g>
  );
}

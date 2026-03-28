// ─── Canvas texture generators for 3D passport pages ───
// Pure functions that return HTMLCanvasElement. No Three.js dependency.

import {
  STAMP_COLORS,
  EU_COUNTRIES,
  PASSPORT_NATIONALITY_LABEL,
  PASSPORT_LABEL,
  REGIONAL_AIRPORTS,
  COUNTRY_REGION,
} from "./constants.js";

export interface TripData {
  country: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  visaStatus: string;
  approved: boolean;
  stayAllowed: string;
  notes: string;
}

// ─── Seeded PRNG (mulberry32) ───

function seedFromString(str: string) {
  let hash = 0;
  for (let charIdx = 0; charIdx < str.length; charIdx++) {
    hash = (hash << 5) - hash + str.charCodeAt(charIdx);
    hash |= 0;
  }
  return Math.abs(hash);
}

function mulberry32(seed: number) {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let temp = Math.imul(state ^ (state >>> 15), 1 | state);
    temp = (temp + Math.imul(temp ^ (temp >>> 7), 61 | temp)) ^ temp;
    return ((temp ^ (temp >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Helpers ───

const TEX_W = 512;
const TEX_H = 720;
const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201, 168, 76, 0.5)";

function formatDateDDMMYY(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0].slice(2)}`;
  }
  return dateStr;
}

// ─── Leather grain texture (overlapping radial gradients, not random dots) ───

function addLeatherGrain(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  rand: () => number
) {
  // Parse base color to RGB for mixing
  ctx.save();

  // Layer multiple semi-transparent radial gradients for grain banding
  const gradientCount = 18;
  for (let gradIdx = 0; gradIdx < gradientCount; gradIdx++) {
    const cx = rand() * width;
    const cy = rand() * height;
    const radius = 100 + rand() * 250;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    const lighten = rand() > 0.5;
    const alpha = 0.02 + rand() * 0.04;
    if (lighten) {
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`);
      gradient.addColorStop(1, "rgba(255,255,255,0)");
    } else {
      gradient.addColorStop(0, `rgba(0,0,0,${alpha})`);
      gradient.addColorStop(1, "rgba(0,0,0,0)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  // Directional fiber lines (Perlin-like banding)
  ctx.globalAlpha = 0.015;
  ctx.strokeStyle = "rgba(255,255,255,1)";
  ctx.lineWidth = 0.5;
  for (let lineIdx = 0; lineIdx < 120; lineIdx++) {
    const startY = rand() * height;
    ctx.beginPath();
    ctx.moveTo(0, startY);
    let currentY = startY;
    for (let segX = 0; segX < width; segX += 8) {
      currentY += (rand() - 0.5) * 3;
      ctx.lineTo(segX, currentY);
    }
    ctx.stroke();
  }

  // Edge vignette (darker at edges, lighter center)
  const vignetteGrad = ctx.createRadialGradient(
    width / 2, height / 2, Math.min(width, height) * 0.15,
    width / 2, height / 2, Math.max(width, height) * 0.7
  );
  vignetteGrad.addColorStop(0, "rgba(255,255,255,0.03)");
  vignetteGrad.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.globalAlpha = 1;
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, width, height);

  ctx.restore();
}

// ─── Gold foil double border with corner flourishes ───

function drawGoldBorder(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // Outer rule
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(24, 24, TEX_W - 48, TEX_H - 48);

  // Inner rule
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(34, 34, TEX_W - 68, TEX_H - 68);

  // Corner flourishes (L-shaped decorative marks at each corner)
  const flourishLen = 30;
  const inset = 28;
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;

  const corners = [
    { cx: inset, cy: inset, dx: 1, dy: 1 },
    { cx: TEX_W - inset, cy: inset, dx: -1, dy: 1 },
    { cx: inset, cy: TEX_H - inset, dx: 1, dy: -1 },
    { cx: TEX_W - inset, cy: TEX_H - inset, dx: -1, dy: -1 },
  ];

  for (const corner of corners) {
    // Short ornamental L
    ctx.beginPath();
    ctx.moveTo(corner.cx, corner.cy + corner.dy * flourishLen);
    ctx.lineTo(corner.cx, corner.cy);
    ctx.lineTo(corner.cx + corner.dx * flourishLen, corner.cy);
    ctx.stroke();

    // Small diamond at corner
    const diamondSize = 4;
    ctx.beginPath();
    ctx.moveTo(corner.cx, corner.cy - diamondSize * corner.dy * -1);
    ctx.lineTo(corner.cx + diamondSize, corner.cy);
    ctx.lineTo(corner.cx, corner.cy + diamondSize * corner.dy * -1);
    ctx.lineTo(corner.cx - diamondSize, corner.cy);
    ctx.closePath();
    ctx.fillStyle = GOLD;
    ctx.fill();
  }

  ctx.restore();
}

// ─── Heraldic emblem (laurel wreath, shield, stars) ───

function drawHeraldicEmblem(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Laurel wreath — two curved branches of leaves
  ctx.strokeStyle = GOLD;
  ctx.fillStyle = GOLD;
  ctx.lineWidth = 1;

  for (const side of [-1, 1]) {
    ctx.save();
    ctx.scale(side, 1);

    // Main branch curve
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.quadraticCurveTo(55, 40, 58, -10);
    ctx.quadraticCurveTo(55, -45, 20, -65);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Leaves along the branch
    for (let leafIdx = 0; leafIdx < 10; leafIdx++) {
      const leafT = leafIdx / 9;
      // Interpolate along the quadratic path (approximate)
      const baseAngle = -Math.PI * 0.35 + leafT * Math.PI * 0.85;
      const branchRadius = 55 - leafIdx * 1.5;
      const leafX = Math.sin(baseAngle) * branchRadius * 0.9;
      const leafY = 60 - leafT * 125;
      const leafAngle = baseAngle + Math.PI * 0.2;
      const leafLen = 10 + leafIdx * 0.5;

      ctx.save();
      ctx.translate(leafX, leafY);
      ctx.rotate(leafAngle);

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(leafLen * 0.3, -leafLen * 0.4, leafLen, 0);
      ctx.quadraticCurveTo(leafLen * 0.3, leafLen * 0.4, 0, 0);
      ctx.globalAlpha = 0.7 + leafIdx * 0.03;
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  // Central shield
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(-28, -35);
  ctx.lineTo(28, -35);
  ctx.lineTo(28, 5);
  ctx.quadraticCurveTo(28, 30, 0, 42);
  ctx.quadraticCurveTo(-28, 30, -28, 5);
  ctx.closePath();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Shield inner line
  ctx.beginPath();
  ctx.moveTo(-22, -29);
  ctx.lineTo(22, -29);
  ctx.lineTo(22, 3);
  ctx.quadraticCurveTo(22, 24, 0, 34);
  ctx.quadraticCurveTo(-22, 24, -22, 3);
  ctx.closePath();
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Horizontal bar across shield
  ctx.beginPath();
  ctx.moveTo(-22, -8);
  ctx.lineTo(22, -8);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Vertical bar
  ctx.beginPath();
  ctx.moveTo(0, -29);
  ctx.lineTo(0, 34);
  ctx.stroke();

  // Stars around the emblem (12 for EU, or 5 for others — we do 8 generically)
  const starCount = 8;
  const starRadius = 72;
  ctx.globalAlpha = 0.8;
  for (let starIdx = 0; starIdx < starCount; starIdx++) {
    const starAngle = (starIdx / starCount) * Math.PI * 2 - Math.PI / 2;
    const sx = Math.cos(starAngle) * starRadius;
    const sy = Math.sin(starAngle) * starRadius;
    drawStar(ctx, sx, sy, 3.5, 1.5, 5);
  }

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number
) {
  ctx.beginPath();
  for (let pointIdx = 0; pointIdx < points * 2; pointIdx++) {
    const angle = (pointIdx / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const radius = pointIdx % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * radius;
    const py = cy + Math.sin(angle) * radius;
    if (pointIdx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
}

// ─── ICAO biometric passport icon ───

function drawBiometricIcon(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.translate(cx, cy);

  // Outer rectangle (chip)
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.strokeRect(-12, -8, 24, 16);

  // Circle inside
  ctx.beginPath();
  ctx.arc(0, 0, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Vertical line through circle
  ctx.beginPath();
  ctx.moveTo(0, -5);
  ctx.lineTo(0, 5);
  ctx.stroke();

  ctx.restore();
}

// ─── Passport front cover ───

export function createPassportCoverTexture(
  nationality: string,
  nationalityCode: string,
  color: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seedFromString(nationalityCode + "cover"));

  // Base color
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Leather grain
  addLeatherGrain(ctx, TEX_W, TEX_H, rand);

  // Gold border with flourishes
  drawGoldBorder(ctx);

  // EU label (if applicable)
  const isEU = EU_COUNTRIES.has(nationalityCode);
  ctx.fillStyle = GOLD;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let topTextY = 90;
  if (isEU) {
    ctx.font = "500 12px 'Inter', sans-serif";
    ctx.letterSpacing = "4px";
    ctx.fillText("UNION EUROPÉENNE", TEX_W / 2, 75);
    ctx.letterSpacing = "0px";
    topTextY = 108;
  }

  // Nationality name
  const natLabel = PASSPORT_NATIONALITY_LABEL[nationalityCode] ?? nationality.toUpperCase();
  // Fit text — if long, use smaller font
  const natFontSize = natLabel.length > 28 ? 14 : natLabel.length > 20 ? 16 : 18;
  ctx.font = `600 ${natFontSize}px 'Playfair Display', serif`;
  ctx.letterSpacing = "2px";
  ctx.fillText(natLabel, TEX_W / 2, topTextY);
  ctx.letterSpacing = "0px";

  // Heraldic emblem
  drawHeraldicEmblem(ctx, TEX_W / 2, 290);

  // "PASSEPORT" label
  const passportLabel = PASSPORT_LABEL[nationalityCode] ?? PASSPORT_LABEL.DEFAULT;
  ctx.fillStyle = GOLD;
  ctx.font = "600 20px 'Inter', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(passportLabel, TEX_W / 2, 460);
  ctx.letterSpacing = "0px";

  // Decorative line under passport label
  ctx.beginPath();
  ctx.moveTo(160, 480);
  ctx.lineTo(TEX_W - 160, 480);
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Biometric icon
  drawBiometricIcon(ctx, TEX_W / 2, 520);

  return canvas;
}

// ─── Passport back cover ───

export function createPassportBackTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seedFromString(color + "back"));

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, TEX_W, TEX_H);
  addLeatherGrain(ctx, TEX_W, TEX_H, rand);

  // Simple gold border
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(24, 24, TEX_W - 48, TEX_H - 48);

  return canvas;
}

// ─── Filigree watermark (guilloche / rosette pattern) ───

function drawFiligreeWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.035;
  ctx.strokeStyle = "#8b7752";
  ctx.lineWidth = 0.6;

  const cx = TEX_W / 2;
  const cy = TEX_H / 2;

  // Rosette: overlapping sine-modulated circles
  for (let ringIdx = 0; ringIdx < 6; ringIdx++) {
    const baseRadius = 40 + ringIdx * 35;
    ctx.beginPath();
    for (let angle = 0; angle <= Math.PI * 2; angle += 0.02) {
      const wobble = Math.sin(angle * 12 + ringIdx * 1.3) * 8;
      const radius = baseRadius + wobble;
      const px = cx + Math.cos(angle) * radius;
      const py = cy + Math.sin(angle) * radius;
      if (angle === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
  }

  // Spiraling guilloche lines
  for (let spiralIdx = 0; spiralIdx < 3; spiralIdx++) {
    ctx.beginPath();
    const offset = spiralIdx * 2.1;
    for (let angle = 0; angle < Math.PI * 8; angle += 0.03) {
      const radius = 20 + angle * 6 + Math.sin(angle * 7 + offset) * 12;
      const px = cx + Math.cos(angle + offset) * radius * 0.4;
      const py = cy + Math.sin(angle + offset) * radius * 0.4;
      if (angle === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Paper fiber texture ───

function drawPaperFibers(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.save();
  ctx.lineWidth = 0.4;

  for (let fiberIdx = 0; fiberIdx < 300; fiberIdx++) {
    const startX = rand() * TEX_W;
    const startY = rand() * TEX_H;
    const fiberAngle = rand() * Math.PI;
    const fiberLen = 3 + rand() * 8;
    const isWarm = rand() > 0.5;
    const alpha = 0.02 + rand() * 0.03;

    ctx.strokeStyle = isWarm
      ? `rgba(160, 140, 110, ${alpha})`
      : `rgba(120, 125, 130, ${alpha})`;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + Math.cos(fiberAngle) * fiberLen,
      startY + Math.sin(fiberAngle) * fiberLen
    );
    ctx.stroke();
  }

  ctx.restore();
}

// ─── Color unevenness (aged paper patches) ───

function drawPaperUnevenness(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.save();
  for (let patchIdx = 0; patchIdx < 8; patchIdx++) {
    const patchX = rand() * TEX_W;
    const patchY = rand() * TEX_H;
    const patchRadius = 60 + rand() * 120;
    const gradient = ctx.createRadialGradient(patchX, patchY, 0, patchX, patchY, patchRadius);
    const warmShift = rand() > 0.5;
    if (warmShift) {
      gradient.addColorStop(0, `rgba(180, 160, 120, 0.03)`);
    } else {
      gradient.addColorStop(0, `rgba(200, 195, 185, 0.03)`);
    }
    gradient.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, TEX_W, TEX_H);
  }
  ctx.restore();
}

// ─── Page background ───

function drawPageBackground(ctx: CanvasRenderingContext2D, rand: () => number, pageNumber: number) {
  // Base gradient
  const gradient = ctx.createLinearGradient(0, 0, TEX_W, TEX_H);
  gradient.addColorStop(0, "#faf8f0");
  gradient.addColorStop(0.5, "#f5f0e0");
  gradient.addColorStop(1, "#efe8d4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, TEX_W, TEX_H);

  // Filigree watermark
  drawFiligreeWatermark(ctx);

  // Paper fibers
  drawPaperFibers(ctx, rand);

  // Color unevenness
  drawPaperUnevenness(ctx, rand);

  // Page header: "VISAS" with decorative rule
  ctx.fillStyle = "rgba(139, 119, 82, 0.25)";
  ctx.font = "600 13px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "8px";
  ctx.fillText("VISAS", TEX_W / 2, 38);
  ctx.letterSpacing = "0px";

  ctx.beginPath();
  ctx.moveTo(180, 48);
  ctx.lineTo(TEX_W - 180, 48);
  ctx.strokeStyle = "rgba(139, 119, 82, 0.15)";
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Page number
  ctx.fillStyle = "rgba(139, 119, 82, 0.3)";
  ctx.font = "400 11px 'Inter', sans-serif";
  ctx.textAlign = "right";
  ctx.fillText(`${pageNumber}`, TEX_W - 40, TEX_H - 30);
}

// ─── Stamp shapes ───

interface StampPlacement {
  cx: number;
  cy: number;
  rotation: number;
  scale: number;
  shape: "circle" | "rect" | "oval";
  inkColor: string;
  inkAlpha: number;
  shadowBlur: number;
}

function getRegionForCountry(countryCode: string) {
  return COUNTRY_REGION[countryCode] ?? "EU";
}

function pickTransitAirports(region: string, count: number, rand: () => number) {
  const airports = REGIONAL_AIRPORTS[region] ?? REGIONAL_AIRPORTS.EU;
  const result: string[] = [];
  for (let pickIdx = 0; pickIdx < count; pickIdx++) {
    const idx = Math.floor(rand() * airports.length);
    result.push(airports[idx]);
  }
  return result;
}

// ─── Draw circular stamp ───

function drawCircularStamp(
  ctx: CanvasRenderingContext2D,
  placement: StampPlacement,
  countryCode: string,
  date: string,
  label: string
) {
  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.rotation);
  ctx.scale(placement.scale, placement.scale);

  const radius = 52;
  ctx.globalAlpha = placement.inkAlpha;
  ctx.shadowColor = placement.inkColor;
  ctx.shadowBlur = placement.shadowBlur;

  // Outer circle
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.strokeStyle = placement.inkColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(0, 0, radius - 6, 0, Math.PI * 2);
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Country code along top arc
  ctx.fillStyle = placement.inkColor;
  ctx.font = "700 11px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const arcText = countryCode.toUpperCase();
  const arcR = radius - 16;
  for (let charIdx = 0; charIdx < arcText.length; charIdx++) {
    const totalAngle = arcText.length * 0.18;
    const charAngle = -Math.PI / 2 - totalAngle / 2 + charIdx * 0.18 + 0.09;
    ctx.save();
    ctx.translate(Math.cos(charAngle) * arcR, Math.sin(charAngle) * arcR);
    ctx.rotate(charAngle + Math.PI / 2);
    ctx.fillText(arcText[charIdx], 0, 0);
    ctx.restore();
  }

  // Date in center
  ctx.font = "700 14px 'Courier New', monospace";
  ctx.fillText(formatDateDDMMYY(date), 0, 0);

  // Label below
  ctx.font = "600 9px 'Inter', sans-serif";
  ctx.globalAlpha = placement.inkAlpha * 0.85;
  ctx.fillText(label, 0, 18);

  // Small decorative stars (left and right)
  ctx.font = "8px serif";
  ctx.fillText("★", -30, 32);
  ctx.fillText("★", 30, 32);

  ctx.restore();
}

// ─── Draw rectangular stamp ───

function drawRectStamp(
  ctx: CanvasRenderingContext2D,
  placement: StampPlacement,
  countryCode: string,
  airportCode: string,
  date: string,
  stayDuration: string,
  isEntry: boolean
) {
  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.rotation);
  ctx.scale(placement.scale, placement.scale);

  const halfW = 65;
  const halfH = 42;
  ctx.globalAlpha = placement.inkAlpha;
  ctx.shadowColor = placement.inkColor;
  ctx.shadowBlur = placement.shadowBlur;

  // Double border
  ctx.strokeStyle = placement.inkColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(-halfW, -halfH, halfW * 2, halfH * 2);
  ctx.lineWidth = 0.8;
  ctx.strokeRect(-halfW + 4, -halfH + 4, (halfW - 4) * 2, (halfH - 4) * 2);

  ctx.shadowBlur = 0;

  // Header
  ctx.fillStyle = placement.inkColor;
  ctx.font = "700 8px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("IMMIGRATION", 0, -halfH + 14);

  // Divider line
  ctx.beginPath();
  ctx.moveTo(-halfW + 10, -halfH + 22);
  ctx.lineTo(halfW - 10, -halfH + 22);
  ctx.strokeStyle = placement.inkColor;
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = placement.inkAlpha * 0.6;
  ctx.stroke();
  ctx.globalAlpha = placement.inkAlpha;

  // Date in large monospace
  ctx.font = "700 16px 'Courier New', monospace";
  ctx.fillText(formatDateDDMMYY(date), 0, -2);

  // Airport code + country code
  ctx.font = "600 10px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`${airportCode}  ${countryCode}`, -halfW + 10, 18);

  // Entry/Exit badge
  ctx.textAlign = "right";
  ctx.font = "700 9px 'Inter', sans-serif";
  const badge = isEntry ? "ENTRY" : "EXIT";
  ctx.fillText(badge, halfW - 10, 18);

  // Stay duration
  if (stayDuration) {
    ctx.textAlign = "center";
    ctx.font = "400 8px 'Inter', sans-serif";
    ctx.globalAlpha = placement.inkAlpha * 0.7;
    ctx.fillText(`STAY: ${stayDuration}`, 0, 32);
  }

  ctx.restore();
}

// ─── Draw oval stamp ───

function drawOvalStamp(
  ctx: CanvasRenderingContext2D,
  placement: StampPlacement,
  countryCode: string,
  airportCode: string,
  date: string
) {
  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.rotation);
  ctx.scale(placement.scale, placement.scale);

  const rx = 55;
  const ry = 35;
  ctx.globalAlpha = placement.inkAlpha;
  ctx.shadowColor = placement.inkColor;
  ctx.shadowBlur = placement.shadowBlur;

  // Outer ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
  ctx.strokeStyle = placement.inkColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner ellipse
  ctx.beginPath();
  ctx.ellipse(0, 0, rx - 5, ry - 4, 0, 0, Math.PI * 2);
  ctx.lineWidth = 0.7;
  ctx.stroke();

  ctx.shadowBlur = 0;

  // Country code top
  ctx.fillStyle = placement.inkColor;
  ctx.font = "700 10px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(countryCode, 0, -14);

  // Date center
  ctx.font = "600 12px 'Courier New', monospace";
  ctx.fillText(formatDateDDMMYY(date), 0, 2);

  // Airport name
  ctx.font = "500 8px 'Inter', sans-serif";
  ctx.globalAlpha = placement.inkAlpha * 0.8;
  ctx.fillText(airportCode, 0, 18);

  ctx.restore();
}

// ─── Draw stamp onto clearcoat map ───

function drawStampOnClearcoatMap(
  ctx: CanvasRenderingContext2D,
  placement: StampPlacement,
  shape: "circle" | "rect" | "oval"
) {
  ctx.save();
  ctx.translate(placement.cx, placement.cy);
  ctx.rotate(placement.rotation);
  ctx.scale(placement.scale, placement.scale);
  ctx.fillStyle = "#ffffff";

  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(0, 0, 56, 0, Math.PI * 2);
    ctx.fill();
  } else if (shape === "rect") {
    ctx.fillRect(-68, -45, 136, 90);
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, 58, 38, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// ─── Visa stamp page ───

export function createPageTexture(
  trip: TripData,
  pageIndex: number,
  totalPages: number
) {
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = TEX_W;
  colorCanvas.height = TEX_H;
  const ctx = colorCanvas.getContext("2d")!;

  const clearcoatCanvas = document.createElement("canvas");
  clearcoatCanvas.width = TEX_W;
  clearcoatCanvas.height = TEX_H;
  const ccCtx = clearcoatCanvas.getContext("2d")!;

  // Clearcoat map: black (matte) everywhere, white where stamps are
  ccCtx.fillStyle = "#000000";
  ccCtx.fillRect(0, 0, TEX_W, TEX_H);

  // Seed from trip data for deterministic placement
  const seed = seedFromString(trip.countryCode + trip.arrivalDate + pageIndex + totalPages);
  const rand = mulberry32(seed);

  // Page number (realistic: offset by 16 + pageIndex * 2 for realism)
  const pageNumber = 16 + pageIndex * 2;
  drawPageBackground(ctx, rand, pageNumber);

  // ── Determine stamps ──
  const stampCount = 1 + Math.floor(rand() * 2.5); // 1 to 3
  const region = getRegionForCountry(trip.countryCode);
  const transitAirports = pickTransitAirports(region, 3, rand);
  const baseInkColor = trip.approved ? STAMP_COLORS.approved.primary : STAMP_COLORS.rejected.primary;

  const placements: StampPlacement[] = [];

  // Generate placement positions avoiding too much overlap
  for (let stampIdx = 0; stampIdx < stampCount; stampIdx++) {
    const isMain = stampIdx === 0;
    const shape: "circle" | "rect" | "oval" = isMain
      ? (["circle", "rect", "oval"] as const)[Math.floor(rand() * 3)]
      : (["circle", "rect", "oval"] as const)[Math.floor(rand() * 3)];

    const cx = isMain
      ? 150 + rand() * (TEX_W - 300)
      : 100 + rand() * (TEX_W - 200);
    const cy = isMain
      ? 200 + rand() * 200
      : 150 + rand() * 350;
    const rotation = (rand() - 0.5) * 0.5; // -15 to +15 degrees
    const scale = isMain ? 1.1 + rand() * 0.2 : 0.75 + rand() * 0.3;
    const inkAlpha = 0.7 + rand() * 0.25;
    const shadowBlur = 0.5 + rand() * 1.0;

    const inkColor = isMain
      ? baseInkColor
      : `rgba(26, 58, 107, ${0.6 + rand() * 0.3})`;

    placements.push({ cx, cy, rotation, scale, shape, inkColor, inkAlpha, shadowBlur });
  }

  // Draw stamps in reverse order (main stamp on top)
  for (let drawIdx = placements.length - 1; drawIdx >= 0; drawIdx--) {
    const placement = placements[drawIdx];
    const isMain = drawIdx === 0;

    if (placement.shape === "circle") {
      drawCircularStamp(
        ctx, placement,
        isMain ? trip.country.toUpperCase() : trip.countryCode,
        isMain ? trip.arrivalDate : trip.arrivalDate,
        isMain ? (trip.approved ? "APPROVED" : "REJECTED") : "TRANSIT"
      );
    } else if (placement.shape === "rect") {
      const airport = isMain ? transitAirports[0] : transitAirports[drawIdx] ?? transitAirports[0];
      drawRectStamp(
        ctx, placement,
        trip.countryCode,
        airport,
        isMain ? trip.arrivalDate : trip.departureDate,
        isMain ? trip.stayAllowed : "",
        isMain
      );
    } else {
      const airport = isMain ? transitAirports[0] : transitAirports[drawIdx] ?? transitAirports[0];
      drawOvalStamp(
        ctx, placement,
        trip.countryCode,
        airport,
        isMain ? trip.arrivalDate : trip.departureDate
      );
    }

    // Also mark on clearcoat map
    drawStampOnClearcoatMap(ccCtx, placement, placement.shape);
  }

  // Notes at bottom
  if (trip.notes) {
    ctx.fillStyle = "rgba(100, 80, 50, 0.5)";
    ctx.font = "italic 300 11px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = trip.notes.split(" ");
    let line = "";
    let lineY = 580;
    const maxWidth = 380;
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, TEX_W / 2, lineY);
        line = word;
        lineY += 16;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, TEX_W / 2, lineY);
  }

  return { color: colorCanvas, clearcoatMap: clearcoatCanvas };
}

// ─── Blank page ───

export function createBlankPageTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = TEX_W;
  canvas.height = TEX_H;
  const ctx = canvas.getContext("2d")!;
  const rand = mulberry32(seedFromString("blank"));

  drawPageBackground(ctx, rand, 14);

  return canvas;
}

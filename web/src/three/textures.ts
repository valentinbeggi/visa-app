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
  primaryRuleName?: string;
  mandatoryRegistration?: string | null;
}

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

const TEX_W = 512;
const TEX_H = 720;
const GOLD = "#c9a84c";
const GOLD_DIM = "rgba(201, 168, 76, 0.5)";

function createCanvas(width = TEX_W, height = TEX_H) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return { canvas, ctx: canvas.getContext("2d")! };
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  centerX: number,
  startY: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = startY;
  for (const word of words) {
    const testLine = line + (line ? " " : "") + word;
    if (ctx.measureText(testLine).width > maxWidth && line) {
      ctx.fillText(line, centerX, currentY);
      line = word;
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  if (line) ctx.fillText(line, centerX, currentY);
}

function formatDateDDMMYY(dateStr: string) {
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0].slice(2)}`;
  }
  return dateStr;
}

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

export function createPassportCoverTexture(
  nationality: string,
  nationalityCode: string,
  color: string
) {
  const { canvas, ctx } = createCanvas();
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

export function createPassportBackTexture(color: string) {
  const { canvas, ctx } = createCanvas();
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

function drawGlobeWatermark(ctx: CanvasRenderingContext2D) {
  ctx.save();
  const cx = TEX_W / 2;
  const cy = TEX_H * 0.46;
  const globeR = 150;

  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = "#8b7752";
  ctx.lineWidth = 1.4;

  // Outer circle (globe outline)
  ctx.beginPath();
  ctx.arc(cx, cy, globeR, 0, Math.PI * 2);
  ctx.stroke();

  // Second outline for thickness
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(cx, cy, globeR - 4, 0, Math.PI * 2);
  ctx.stroke();

  // Equator
  ctx.lineWidth = 1.0;
  ctx.beginPath();
  ctx.moveTo(cx - globeR, cy);
  ctx.lineTo(cx + globeR, cy);
  ctx.stroke();

  // Latitude lines (ellipses at various heights)
  ctx.lineWidth = 0.6;
  for (const latFraction of [-0.7, -0.45, -0.2, 0.2, 0.45, 0.7]) {
    const latY = cy + latFraction * globeR;
    const latRx = Math.sqrt(globeR * globeR - (latFraction * globeR) ** 2);
    ctx.beginPath();
    ctx.ellipse(cx, latY, latRx, latRx * 0.12, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Longitude meridians (vertical ellipses)
  for (const lonFraction of [-0.7, -0.4, -0.15, 0.15, 0.4, 0.7]) {
    const meridianRx = Math.abs(lonFraction) * globeR;
    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(meridianRx, 6), globeR, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rough continent shapes — simple blobs suggesting landmasses
  ctx.globalAlpha = 0.09;
  ctx.fillStyle = "#8b7752";

  // "Europe/Africa" blob (right-center)
  ctx.beginPath();
  ctx.moveTo(cx + 15, cy - 70);
  ctx.quadraticCurveTo(cx + 45, cy - 50, cx + 40, cy - 10);
  ctx.quadraticCurveTo(cx + 50, cy + 20, cx + 30, cy + 60);
  ctx.quadraticCurveTo(cx + 20, cy + 80, cx + 10, cy + 50);
  ctx.quadraticCurveTo(cx - 5, cy + 20, cx + 5, cy - 20);
  ctx.quadraticCurveTo(cx - 5, cy - 55, cx + 15, cy - 70);
  ctx.fill();

  // "Americas" blob (left side)
  ctx.beginPath();
  ctx.moveTo(cx - 60, cy - 80);
  ctx.quadraticCurveTo(cx - 30, cy - 90, cx - 25, cy - 55);
  ctx.quadraticCurveTo(cx - 20, cy - 30, cx - 40, cy - 15);
  ctx.quadraticCurveTo(cx - 35, cy + 10, cx - 45, cy + 40);
  ctx.quadraticCurveTo(cx - 55, cy + 70, cx - 70, cy + 50);
  ctx.quadraticCurveTo(cx - 80, cy + 20, cx - 70, cy - 20);
  ctx.quadraticCurveTo(cx - 75, cy - 60, cx - 60, cy - 80);
  ctx.fill();

  // "Asia" blob (upper right)
  ctx.beginPath();
  ctx.moveTo(cx + 55, cy - 60);
  ctx.quadraticCurveTo(cx + 90, cy - 70, cx + 100, cy - 40);
  ctx.quadraticCurveTo(cx + 110, cy - 10, cx + 85, cy + 10);
  ctx.quadraticCurveTo(cx + 60, cy + 5, cx + 55, cy - 25);
  ctx.quadraticCurveTo(cx + 45, cy - 45, cx + 55, cy - 60);
  ctx.fill();

  // Decorative compass rose at bottom of globe
  ctx.globalAlpha = 0.14;
  ctx.strokeStyle = "#8b7752";
  ctx.lineWidth = 0.8;
  const compassY = cy + globeR + 30;
  const compassR = 20;

  // Cardinal lines
  for (const cardinalAngle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    ctx.beginPath();
    ctx.moveTo(cx, compassY);
    ctx.lineTo(
      cx + Math.cos(cardinalAngle) * compassR,
      compassY + Math.sin(cardinalAngle) * compassR
    );
    ctx.stroke();
  }
  // Diamond points
  for (const pointAngle of [0, Math.PI / 2, Math.PI, Math.PI * 1.5]) {
    const tipX = cx + Math.cos(pointAngle) * compassR;
    const tipY = compassY + Math.sin(pointAngle) * compassR;
    const perpAngle = pointAngle + Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(cx + Math.cos(perpAngle) * 3, compassY + Math.sin(perpAngle) * 3);
    ctx.lineTo(cx, compassY);
    ctx.lineTo(cx - Math.cos(perpAngle) * 3, compassY - Math.sin(perpAngle) * 3);
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

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

function drawGuillocheBands(ctx: CanvasRenderingContext2D) {
  ctx.save();

  // Two vertical bands — one on the left third, one on the right third
  const bandCenters = [TEX_W * 0.22, TEX_W * 0.78];
  const bandWidth = 60;
  const yStart = 55;
  const yEnd = TEX_H - 40;

  for (const bandCx of bandCenters) {
    // ── Outer wavy border lines (red-ish tint) ──
    ctx.globalAlpha = 0.16;
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = "#a04040";

    for (const side of [-1, 1]) {
      for (const offset of [0, 4]) {
        ctx.beginPath();
        for (let py = yStart; py <= yEnd; py += 1) {
          const wave = Math.sin(py * 0.035) * (bandWidth / 2 - offset);
          const px = bandCx + side * (bandWidth / 2 + wave * 0.15) + wave * 0.3;
          if (py === yStart) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.stroke();
      }
    }

    // ── Inner crosshatch guilloche (blue-ish tint) ──
    ctx.globalAlpha = 0.13;
    ctx.strokeStyle = "#2a4080";
    ctx.lineWidth = 0.6;

    // Sinusoidal wave bundles — multiple overlapping sine waves
    for (let waveIdx = 0; waveIdx < 12; waveIdx++) {
      const freq = 0.025 + waveIdx * 0.004;
      const amplitude = 8 + waveIdx * 3;
      const phase = waveIdx * 0.8;

      ctx.beginPath();
      for (let py = yStart; py <= yEnd; py += 1.5) {
        const px = bandCx + Math.sin(py * freq + phase) * amplitude;
        if (py === yStart) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // Mirrored waves for the crosshatch effect
    ctx.globalAlpha = 0.11;
    for (let waveIdx = 0; waveIdx < 12; waveIdx++) {
      const freq = 0.025 + waveIdx * 0.004;
      const amplitude = 8 + waveIdx * 3;
      const phase = waveIdx * 0.8 + Math.PI;

      ctx.beginPath();
      for (let py = yStart; py <= yEnd; py += 1.5) {
        const px = bandCx + Math.sin(py * freq + phase) * amplitude;
        if (py === yStart) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    // ── Central diamond lattice pattern ──
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#2a4080";
    ctx.lineWidth = 0.5;
    const latticeSpacing = 12;

    for (let py = yStart; py < yEnd; py += latticeSpacing) {
      const waveOffset = Math.sin(py * 0.035) * 6;
      ctx.beginPath();
      ctx.moveTo(bandCx + waveOffset, py);
      ctx.lineTo(bandCx + 6 + waveOffset, py + latticeSpacing / 2);
      ctx.lineTo(bandCx + waveOffset, py + latticeSpacing);
      ctx.lineTo(bandCx - 6 + waveOffset, py + latticeSpacing / 2);
      ctx.closePath();
      ctx.stroke();
    }

    // ── Outer pink/red fine wave fill ──
    ctx.globalAlpha = 0.1;
    ctx.strokeStyle = "#a04040";
    ctx.lineWidth = 0.5;

    for (let waveIdx = 0; waveIdx < 8; waveIdx++) {
      const spread = bandWidth * 0.35 + waveIdx * 3;
      const freq = 0.04 + waveIdx * 0.003;

      ctx.beginPath();
      for (let py = yStart; py <= yEnd; py += 1.5) {
        const px = bandCx + Math.sin(py * freq + waveIdx) * spread;
        if (py === yStart) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawSecurityBorder(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.strokeStyle = "#8b7752";
  ctx.lineWidth = 0.4;

  // Microprint-style repeated text border
  const margin = 18;
  const text = "PASSPORT·VISA·IMMIGRATION·";
  ctx.font = "400 3.5px 'Inter', sans-serif";
  ctx.fillStyle = "#8b7752";
  ctx.globalAlpha = 0.06;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";

  // Top edge
  for (let xPos = margin; xPos < TEX_W - margin; xPos += ctx.measureText(text).width) {
    ctx.fillText(text, xPos, margin);
  }
  // Bottom edge
  for (let xPos = margin; xPos < TEX_W - margin; xPos += ctx.measureText(text).width) {
    ctx.fillText(text, xPos, TEX_H - margin - 4);
  }
  // Left edge (rotated)
  ctx.save();
  ctx.translate(margin, TEX_H - margin);
  ctx.rotate(-Math.PI / 2);
  for (let yPos = 0; yPos < TEX_H - margin * 2; yPos += ctx.measureText(text).width) {
    ctx.fillText(text, yPos, 0);
  }
  ctx.restore();
  // Right edge (rotated)
  ctx.save();
  ctx.translate(TEX_W - margin, margin);
  ctx.rotate(Math.PI / 2);
  for (let yPos = 0; yPos < TEX_H - margin * 2; yPos += ctx.measureText(text).width) {
    ctx.fillText(text, yPos, 0);
  }
  ctx.restore();

  // Thin decorative rule inside margins
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#8b7752";
  ctx.lineWidth = 0.5;
  ctx.setLineDash([4, 3]);
  ctx.strokeRect(margin + 6, margin + 6, TEX_W - (margin + 6) * 2, TEX_H - (margin + 6) * 2);
  ctx.setLineDash([]);

  ctx.restore();
}

function drawBindingShadow(ctx: CanvasRenderingContext2D, isLeftPage: boolean) {
  ctx.save();
  const shadowWidth = 35;
  const bindingX = isLeftPage ? TEX_W : 0;
  const gradient = ctx.createLinearGradient(
    isLeftPage ? TEX_W - shadowWidth : 0,
    0,
    bindingX,
    0
  );
  gradient.addColorStop(0, "rgba(0, 0, 0, 0)");
  gradient.addColorStop(0.6, "rgba(0, 0, 0, 0.03)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.08)");
  ctx.fillStyle = gradient;
  ctx.fillRect(
    isLeftPage ? TEX_W - shadowWidth : 0,
    0,
    shadowWidth,
    TEX_H
  );
  ctx.restore();
}

function drawEdgeAging(ctx: CanvasRenderingContext2D, rand: () => number) {
  ctx.save();
  // Subtle darkening along all edges (handling wear)
  const edgeWidth = 25;

  // Top edge
  const topGrad = ctx.createLinearGradient(0, 0, 0, edgeWidth);
  topGrad.addColorStop(0, "rgba(160, 140, 100, 0.06)");
  topGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, TEX_W, edgeWidth);

  // Bottom edge
  const botGrad = ctx.createLinearGradient(0, TEX_H, 0, TEX_H - edgeWidth);
  botGrad.addColorStop(0, "rgba(160, 140, 100, 0.06)");
  botGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.fillStyle = botGrad;
  ctx.fillRect(0, TEX_H - edgeWidth, TEX_W, edgeWidth);

  // Occasional small stains / foxing spots
  ctx.globalAlpha = 1;
  for (let spotIdx = 0; spotIdx < 4; spotIdx++) {
    const spotX = rand() * TEX_W;
    const spotY = rand() * TEX_H;
    const spotR = 2 + rand() * 6;
    const spotGrad = ctx.createRadialGradient(spotX, spotY, 0, spotX, spotY, spotR);
    spotGrad.addColorStop(0, `rgba(180, 155, 110, ${0.02 + rand() * 0.03})`);
    spotGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = spotGrad;
    ctx.fillRect(spotX - spotR, spotY - spotR, spotR * 2, spotR * 2);
  }

  ctx.restore();
}

function drawPageBackground(ctx: CanvasRenderingContext2D, rand: () => number, pageNumber: number, isLeftPage = true) {
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

  // Security microprint border
  drawSecurityBorder(ctx);

  // Binding shadow (spine side darkening)
  drawBindingShadow(ctx, isLeftPage);

  // Edge aging & foxing
  drawEdgeAging(ctx, rand);

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

export function createPageTexture(
  trip: TripData,
  pageIndex: number,
  totalPages: number
) {
  const { canvas: colorCanvas, ctx } = createCanvas();
  const { canvas: clearcoatCanvas, ctx: ccCtx } = createCanvas();

  ccCtx.fillStyle = "#000000";
  ccCtx.fillRect(0, 0, TEX_W, TEX_H);

  // Seed from trip data for deterministic placement
  const seed = seedFromString(trip.countryCode + trip.arrivalDate + pageIndex + totalPages);
  const rand = mulberry32(seed);

  // Page number (realistic: offset by 16 + pageIndex * 2 for realism)
  const pageNumber = 16 + pageIndex * 2;
  drawPageBackground(ctx, rand, pageNumber, false);
  drawGlobeWatermark(ctx);

  // ── Single main stamp ──
  const region = getRegionForCountry(trip.countryCode);
  const transitAirports = pickTransitAirports(region, 3, rand);
  const baseInkColor =
    trip.visaStatus === "not_found"
      ? STAMP_COLORS.not_found.primary
      : trip.approved
        ? STAMP_COLORS.approved.primary
        : STAMP_COLORS.rejected.primary;

  const shape = (["circle", "rect", "oval"] as const)[Math.floor(rand() * 3)];
  const placement: StampPlacement = {
    cx: TEX_W / 2 + (rand() - 0.5) * 80,
    cy: TEX_H * 0.45 + (rand() - 0.5) * 60,
    rotation: (rand() - 0.5) * 0.35,
    scale: 2.2 + rand() * 0.4,
    shape,
    inkColor: baseInkColor,
    inkAlpha: 0.75 + rand() * 0.2,
    shadowBlur: 0.5 + rand() * 1.0,
  };

  if (placement.shape === "circle") {
    drawCircularStamp(
      ctx, placement,
      trip.country.toUpperCase(),
      trip.arrivalDate,
      trip.visaStatus === "not_found"
        ? "NOT FOUND"
        : trip.approved
          ? "APPROVED"
          : "REJECTED"
    );
  } else if (placement.shape === "rect") {
    drawRectStamp(
      ctx, placement,
      trip.countryCode,
      transitAirports[0],
      trip.arrivalDate,
      trip.stayAllowed,
      true
    );
  } else {
    drawOvalStamp(
      ctx, placement,
      trip.countryCode,
      transitAirports[0],
      trip.arrivalDate
    );
  }

  drawStampOnClearcoatMap(ccCtx, placement, placement.shape);

  // Notes at bottom
  if (trip.notes) {
    ctx.fillStyle = "rgba(100, 80, 50, 0.5)";
    ctx.font = "italic 300 11px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    wrapText(ctx, trip.notes, TEX_W / 2, 580, 380, 16);
  }

  return { color: colorCanvas, clearcoatMap: clearcoatCanvas };
}

export function createVisaInfoTexture(trip: TripData, pageNumber: number) {
  const { canvas, ctx } = createCanvas();
  const rand = mulberry32(seedFromString(trip.countryCode + trip.arrivalDate + "info"));

  drawPageBackground(ctx, rand, pageNumber);
  drawGuillocheBands(ctx);

  const centerX = TEX_W / 2;

  // ── Country code ──
  ctx.fillStyle = "rgba(139, 119, 82, 0.5)";
  ctx.font = "500 20px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.letterSpacing = "6px";
  ctx.fillText(trip.countryCode.toUpperCase(), centerX, 110);
  ctx.letterSpacing = "0px";

  // ── Country name — large serif ──
  ctx.fillStyle = "#2a2420";
  const countryName = trip.country.toUpperCase();
  const countryFontSize = countryName.length > 18 ? 30 : countryName.length > 12 ? 36 : 42;
  ctx.font = `600 ${countryFontSize}px 'Playfair Display', Georgia, serif`;
  ctx.letterSpacing = "4px";
  ctx.fillText(countryName, centerX, 170);
  ctx.letterSpacing = "0px";

  // ── Gold decorative rule ──
  ctx.save();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.7;
  const ruleHalfWidth = 100;
  ctx.beginPath();
  ctx.moveTo(centerX - ruleHalfWidth, 215);
  ctx.lineTo(centerX + ruleHalfWidth, 215);
  ctx.stroke();
  // Small diamond at center of rule
  const diamondY = 215;
  ctx.fillStyle = GOLD;
  ctx.beginPath();
  ctx.moveTo(centerX, diamondY - 5);
  ctx.lineTo(centerX + 5, diamondY);
  ctx.moveTo(centerX, diamondY + 5);
  ctx.lineTo(centerX - 5, diamondY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // ── Dates ──
  ctx.fillStyle = "rgba(92, 82, 72, 0.85)";
  ctx.font = "400 20px 'Courier New', monospace";
  ctx.textAlign = "center";
  const formattedArrival = formatDateDDMMYY(trip.arrivalDate);
  const formattedDeparture = formatDateDDMMYY(trip.departureDate);
  ctx.fillText(`${formattedArrival}  —  ${formattedDeparture}`, centerX, 265);

  // ── Visa status badge ──
  const isApproved = trip.approved;
  const statusText = isApproved ? "APPROVED" : "REJECTED";
  const statusColors = isApproved ? STAMP_COLORS.approved : STAMP_COLORS.rejected;

  // Badge background
  const badgeWidth = 220;
  const badgeHeight = 48;
  const badgeX = centerX - badgeWidth / 2;
  const badgeY = 320;

  ctx.save();
  ctx.fillStyle = statusColors.bg;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4);
  ctx.fill();

  // Badge border
  ctx.strokeStyle = statusColors.primary;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 4);
  ctx.stroke();
  ctx.restore();

  // Badge text
  ctx.fillStyle = statusColors.primary;
  ctx.font = "700 20px 'Inter', sans-serif";
  ctx.letterSpacing = "6px";
  ctx.fillText(statusText, centerX, badgeY + badgeHeight / 2);
  ctx.letterSpacing = "0px";

  // ── Second gold rule ──
  ctx.save();
  ctx.strokeStyle = GOLD_DIM;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - 80, 410);
  ctx.lineTo(centerX + 80, 410);
  ctx.stroke();
  ctx.restore();

  // ── Visa type + stay duration ──
  const visaLabel = trip.visaStatus.replace(/_/g, " ").toUpperCase();
  const stayLabel = trip.stayAllowed ? ` · ${trip.stayAllowed}` : "";
  ctx.fillStyle = "rgba(92, 82, 72, 0.65)";
  ctx.font = "400 18px 'Inter', sans-serif";
  ctx.letterSpacing = "2px";
  ctx.fillText(`${visaLabel}${stayLabel}`, centerX, 450);
  ctx.letterSpacing = "0px";

  // ── Notes (if present) ──
  if (trip.notes) {
    ctx.fillStyle = "rgba(100, 80, 50, 0.5)";
    ctx.font = "italic 300 15px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    wrapText(ctx, trip.notes, centerX, 520, 380, 22);
  }

  return canvas;
}

export function createSpineTexture(baseColor: string) {
  const width = 64;
  const height = 512;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Base leather color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Slight darkening towards edges
  const edgeGrad = ctx.createLinearGradient(0, 0, width, 0);
  edgeGrad.addColorStop(0, "rgba(0,0,0,0.12)");
  edgeGrad.addColorStop(0.3, "rgba(0,0,0,0.02)");
  edgeGrad.addColorStop(0.7, "rgba(0,0,0,0.02)");
  edgeGrad.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = edgeGrad;
  ctx.fillRect(0, 0, width, height);

  // Stitch line — row of small dots down the center
  const stitchX = width / 2;
  const stitchSpacing = 10;
  const stitchCount = Math.floor(height / stitchSpacing);
  const marginY = (height - (stitchCount - 1) * stitchSpacing) / 2;

  for (let stitchIdx = 0; stitchIdx < stitchCount; stitchIdx++) {
    const dotY = marginY + stitchIdx * stitchSpacing;
    // Needle hole — tiny dark dot
    ctx.beginPath();
    ctx.arc(stitchX, dotY, 1.2, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.fill();

    // Thread segment between holes — short diagonal dashes
    if (stitchIdx < stitchCount - 1) {
      const nextY = dotY + stitchSpacing;
      ctx.beginPath();
      ctx.moveTo(stitchX - 1.5, dotY + 1.5);
      ctx.lineTo(stitchX + 1.5, nextY - 1.5);
      ctx.strokeStyle = "rgba(0, 0, 0, 0.18)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }
  }

  // Second stitch line slightly offset (double-stitched binding)
  const stitch2X = stitchX + 6;
  for (let stitchIdx = 0; stitchIdx < stitchCount; stitchIdx++) {
    const dotY = marginY + stitchIdx * stitchSpacing + stitchSpacing / 2;
    if (dotY > height - marginY) continue;

    ctx.beginPath();
    ctx.arc(stitch2X, dotY, 1, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fill();

    if (stitchIdx < stitchCount - 1) {
      const nextY = dotY + stitchSpacing;
      if (nextY <= height - marginY) {
        ctx.beginPath();
        ctx.moveTo(stitch2X + 1.5, dotY + 1.5);
        ctx.lineTo(stitch2X - 1.5, nextY - 1.5);
        ctx.strokeStyle = "rgba(0, 0, 0, 0.15)";
        ctx.lineWidth = 0.7;
        ctx.stroke();
      }
    }
  }

  return canvas;
}

export function createBlankPageTexture() {
  const { canvas, ctx } = createCanvas();
  const rand = mulberry32(seedFromString("blank"));

  drawPageBackground(ctx, rand, 14);

  return canvas;
}

// ─── Canvas texture generators for 3D passport pages ───
// Pure functions that return HTMLCanvasElement. No Three.js dependency.

import { STAMP_COLORS } from "./constants.js";

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

function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

function addLeatherNoise(ctx: CanvasRenderingContext2D, width: number, height: number, count = 3000) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function addPaperNoise(ctx: CanvasRenderingContext2D, width: number, height: number, count = 2000) {
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    ctx.fillStyle = `rgba(139, 119, 82, ${Math.random() * 0.05})`;
    ctx.fillRect(x, y, 1, 1);
  }
}

function createPageGradient(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#faf8f0");
  gradient.addColorStop(0.5, "#f5f0e0");
  gradient.addColorStop(1, "#efe8d4");
  return gradient;
}

// ─── Passport front cover ───
export function createPassportCoverTexture(
  nationality: string,
  nationalityCode: string,
  color: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 720);
  addLeatherNoise(ctx, 512, 720);

  // Gold embossed border
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 452, 660);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, 436, 644);

  // Emblem circle
  const centerX = 256;
  const emblemY = 260;
  ctx.beginPath();
  ctx.arc(centerX, emblemY, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, emblemY, 72, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Flag emoji
  ctx.font = "60px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getFlagEmoji(nationalityCode), centerX, emblemY);

  // Title
  ctx.fillStyle = "#c9a84c";
  ctx.font = "600 14px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("PASSPORT", centerX, 120);

  // Country name
  ctx.font = "700 20px 'Playfair Display', serif";
  ctx.fillText(nationality.toUpperCase(), centerX, 440);

  // Decorative line
  ctx.beginPath();
  ctx.moveTo(156, 470);
  ctx.lineTo(356, 470);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Small text
  ctx.font = "300 11px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(201, 168, 76, 0.7)";
  ctx.fillText("TRAVEL DOCUMENT", centerX, 495);

  return canvas;
}

// ─── Passport back cover ───
export function createPassportBackTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 720);
  addLeatherNoise(ctx, 512, 720);

  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 452, 660);

  return canvas;
}

// ─── Visa stamp page ───
export function createPageTexture(
  trip: TripData,
  pageIndex: number,
  totalPages: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = createPageGradient(ctx, 512, 720);
  ctx.fillRect(0, 0, 512, 720);
  addPaperNoise(ctx, 512, 720);

  // Watermark
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.font = "80px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#8b7752";
  ctx.translate(256, 360);
  ctx.rotate(-0.3);
  ctx.fillText(getFlagEmoji(trip.countryCode), 0, 0);
  ctx.restore();

  // Page number
  ctx.fillStyle = "rgba(139, 119, 82, 0.4)";
  ctx.font = "300 10px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${pageIndex + 1} / ${totalPages}`, 256, 700);

  // ── Stamp ──
  const colors = trip.approved ? STAMP_COLORS.approved : STAMP_COLORS.rejected;
  const stampCenterX = 256;
  const stampCenterY = 300;
  const rotation = (Math.random() - 0.5) * 0.2 - 0.05;

  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(rotation);

  // Outer stamp border
  const stampRadius = 130;
  ctx.beginPath();
  ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, stampRadius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Country name along top arc
  ctx.fillStyle = colors.primary;
  ctx.font = "700 18px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const countryName = trip.country.toUpperCase();
  ctx.save();
  const arcRadius = stampRadius - 28;
  const arcLen = countryName.length * 0.09;
  const startAngle = -Math.PI / 2 - arcLen;
  for (let charIdx = 0; charIdx < countryName.length; charIdx++) {
    const angle = startAngle + charIdx * 0.18;
    const charX = arcRadius * Math.cos(angle);
    const charY = arcRadius * Math.sin(angle);
    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(countryName[charIdx], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Flag emoji
  ctx.font = "40px serif";
  ctx.fillText(getFlagEmoji(trip.countryCode), 0, -40);

  // Status label
  const statusText = trip.approved ? "APPROVED" : "REJECTED";
  ctx.fillStyle = colors.secondary;
  ctx.font = "700 28px 'Special Elite', monospace";
  ctx.fillText(statusText, 0, 15);

  // Visa type
  const visaLabel = trip.visaStatus.replace(/_/g, " ").toUpperCase();
  ctx.fillStyle = colors.primary;
  ctx.font = "500 12px 'Inter', sans-serif";
  ctx.fillText(visaLabel, 0, 48);

  // Divider
  ctx.beginPath();
  ctx.moveTo(-80, 65);
  ctx.lineTo(80, 65);
  ctx.strokeStyle = `${colors.primary}66`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Dates
  ctx.fillStyle = colors.primary;
  ctx.font = "400 13px 'Inter', sans-serif";
  ctx.fillText(`${trip.arrivalDate} - ${trip.departureDate}`, 0, 85);

  // Stay allowed
  ctx.font = "300 11px 'Inter', sans-serif";
  ctx.fillStyle = `${colors.primary}cc`;
  ctx.fillText(`Stay: ${trip.stayAllowed}`, 0, 108);

  ctx.restore();

  // Notes at bottom
  if (trip.notes) {
    ctx.fillStyle = "rgba(100, 80, 50, 0.6)";
    ctx.font = "italic 300 12px 'Inter', sans-serif";
    ctx.textAlign = "center";

    const words = trip.notes.split(" ");
    let line = "";
    let lineY = 520;
    const maxWidth = 400;
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, 256, lineY);
        line = word;
        lineY += 18;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, 256, lineY);
  }

  // Entry/Exit labels
  ctx.fillStyle = "rgba(100, 80, 50, 0.5)";
  ctx.font = "600 10px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("IMMIGRATION", 30, 50);
  ctx.textAlign = "right";
  ctx.fillText(`DESTINATION ${pageIndex + 1}`, 482, 50);

  // Decorative top border
  ctx.beginPath();
  ctx.moveTo(30, 60);
  ctx.lineTo(482, 60);
  ctx.strokeStyle = "rgba(100, 80, 50, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas;
}

// ─── Blank page ───
export function createBlankPageTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = createPageGradient(ctx, 512, 720);
  ctx.fillRect(0, 0, 512, 720);

  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 720;
    ctx.fillStyle = `rgba(139, 119, 82, ${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Faint grid lines
  ctx.strokeStyle = "rgba(139, 119, 82, 0.06)";
  ctx.lineWidth = 0.5;
  for (let y = 80; y < 680; y += 30) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(472, y);
    ctx.stroke();
  }

  return canvas;
}

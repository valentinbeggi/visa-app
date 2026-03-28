// ─── Country → stamp design mapping ───
// Maps destination countries to the stamp style that matches their real-world
// immigration stamps, and generates randomized but deterministic props.

import type {
  StampType,
  InkFilter,
  FadeStyle,
  StampRectEntryProps,
  StampRoundProps,
  StampOvalProps,
  StampDepartureProps,
  StampVisitPassProps,
  StampVietnamProps,
} from "./types.js";

// ── Seeded PRNG (deterministic across re-renders) ──

function seededRandom(seed: string) {
  let hash = 0;
  for (let charIdx = 0; charIdx < seed.length; charIdx++) {
    hash = (hash << 5) - hash + seed.charCodeAt(charIdx);
    hash |= 0;
  }
  return () => {
    hash = (hash * 16807 + 0) % 2147483647;
    return (hash & 0x7fffffff) / 0x7fffffff;
  };
}

function pickRandom<T>(rng: () => number, items: T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomRotation(rng: () => number, min = -12, max = 12) {
  return Math.round(min + rng() * (max - min));
}

function randomInk(rng: () => number): InkFilter {
  return pickRandom(rng, ["light", "medium", "medium", "heavy"]);
}

function randomFade(rng: () => number): FadeStyle {
  return pickRandom(rng, ["none", "center", "topleft", "corner"]);
}

// ── Country → stamp design ──

/** Which stamp design a country's immigration uses */
const COUNTRY_STAMP_TYPE: Record<string, StampType> = {
  // East Asia — round stamps
  CN: "round", HK: "round", MO: "round", TW: "round",
  // Japan/Korea — rectangular entry
  JP: "rectEntry", KR: "rectEntry",
  // SE Asia — rectangular entry or departure
  TH: "rectEntry", ID: "departure", PH: "departure", MM: "rectEntry",
  KH: "rectEntry", LA: "rectEntry",
  // Malaysia/Brunei — departure style
  MY: "departure", BN: "visitPass",
  // Singapore — visit pass
  SG: "visitPass",
  // Vietnam — vietnam style
  VN: "vietnam",
  // India/subcontinent — rectangular
  IN: "rectEntry", LK: "rectEntry", NP: "rectEntry", BD: "rectEntry",
  // EU/Schengen — oval
  FR: "oval", DE: "oval", NL: "oval", IT: "oval", ES: "oval",
  PT: "oval", BE: "oval", AT: "oval", CH: "oval", SE: "oval",
  NO: "oval", DK: "oval", FI: "oval", GR: "oval", PL: "oval",
  CZ: "oval", HU: "oval", IE: "oval", LU: "oval", HR: "oval",
  // UK — oval (similar to EU but with own code)
  GB: "oval",
  // Americas — rectangular
  US: "rectEntry", CA: "rectEntry", MX: "rectEntry",
  BR: "rectEntry", AR: "rectEntry", CL: "rectEntry", CO: "rectEntry",
  // Middle East — rectangular
  AE: "rectEntry", QA: "rectEntry", SA: "rectEntry", TR: "rectEntry",
  IL: "rectEntry", JO: "rectEntry",
  // Oceania — rectangular
  AU: "rectEntry", NZ: "rectEntry",
  // Africa — rectangular
  ZA: "rectEntry", EG: "rectEntry", KE: "rectEntry", MA: "rectEntry",
  NG: "rectEntry", ET: "rectEntry", TZ: "rectEntry",
};

const DEFAULT_STAMP_TYPE: StampType = "rectEntry";

/** Ink colors that match real-world stamp colors for each country/region */
const STAMP_INK_COLORS: Record<string, string> = {
  // East Asia tends toward red/dark red
  CN: "#cc0000", HK: "#4a0080", TW: "#003580", JP: "#8B0000", KR: "#003580",
  // SE Asia — red/dark blue
  TH: "#1a4fa8", MY: "#b5000a", SG: "#006831", ID: "#b50000", PH: "#003087",
  VN: "#003580",
  // India — orange/dark
  IN: "#E07B00",
  // EU — varies
  FR: "#002395", DE: "#003399", NL: "#d35400", IT: "#006341", ES: "#aa151b",
  GB: "#1a2744", CH: "#d52b1e", SE: "#005293", PT: "#006600",
  // Americas
  US: "#003580", CA: "#d52b1e", BR: "#009739", MX: "#006341", AR: "#75AADB",
  // Middle East
  AE: "#003580", TR: "#E30A17", IL: "#003580",
  // Oceania
  AU: "#003580", NZ: "#003580",
  DEFAULT: "#1a3a6b",
};

/** Major airports per country for stamp text */
const COUNTRY_AIRPORTS: Record<string, { code: string; name: string }[]> = {
  JP: [{ code: "NRT", name: "NARITA INTL AIRPORT" }, { code: "HND", name: "HANEDA AIRPORT" }, { code: "KIX", name: "KANSAI INTL" }],
  TH: [{ code: "BKK", name: "SUVARNABHUMI AIRPORT" }, { code: "DMK", name: "DON MUEANG INTL" }],
  CN: [{ code: "PEK", name: "BEIJING CAPITAL" }, { code: "PVG", name: "PUDONG INTL" }, { code: "CAN", name: "GUANGZHOU BAIYUN" }],
  SG: [{ code: "SIN", name: "CHANGI AIRPORT" }],
  MY: [{ code: "KUL", name: "KL INTERNATIONAL" }, { code: "PEN", name: "PENANG INTL" }],
  ID: [{ code: "CGK", name: "SOEKARNO-HATTA" }, { code: "DPS", name: "NGURAH RAI INTL" }],
  VN: [{ code: "HAN", name: "NỘI BÀI" }, { code: "SGN", name: "TÂN SƠN NHẤT" }],
  IN: [{ code: "DEL", name: "INDIRA GANDHI INTL" }, { code: "BOM", name: "CHHATRAPATI SHIVAJI" }],
  KR: [{ code: "ICN", name: "INCHEON INTL" }, { code: "GMP", name: "GIMPO INTL" }],
  FR: [{ code: "CDG", name: "ROISSY CDG" }, { code: "ORY", name: "PARIS ORLY" }],
  DE: [{ code: "FRA", name: "FRANKFURT" }, { code: "MUC", name: "MÜNCHEN" }],
  NL: [{ code: "AMS", name: "SCHIPHOL" }],
  GB: [{ code: "LHR", name: "HEATHROW" }, { code: "LGW", name: "GATWICK" }],
  US: [{ code: "JFK", name: "JOHN F KENNEDY" }, { code: "LAX", name: "LOS ANGELES INTL" }, { code: "ORD", name: "O'HARE INTL" }],
  AU: [{ code: "SYD", name: "SYDNEY AIRPORT" }, { code: "MEL", name: "MELBOURNE AIRPORT" }],
  AE: [{ code: "DXB", name: "DUBAI INTL" }, { code: "AUH", name: "ABU DHABI INTL" }],
  TR: [{ code: "IST", name: "ISTANBUL AIRPORT" }],
  IT: [{ code: "FCO", name: "FIUMICINO" }, { code: "MXP", name: "MALPENSA" }],
  ES: [{ code: "MAD", name: "BARAJAS" }, { code: "BCN", name: "EL PRAT" }],
  BR: [{ code: "GRU", name: "GUARULHOS INTL" }],
  CA: [{ code: "YYZ", name: "TORONTO PEARSON" }, { code: "YVR", name: "VANCOUVER INTL" }],
};

const DEFAULT_AIRPORT = { code: "INT", name: "INTERNATIONAL AIRPORT" };

// ── Visa class labels ──

const VISA_CLASS_MAP: Record<string, string> = {
  visa_free: "TOURIST",
  visa_required: "VISA",
  evisa: "e-VISA",
  visa_on_arrival: "VOA",
  eta: "ETA",
  refused: "REFUSED",
};

// ── Public API ──

export interface StampConfig {
  stampType: StampType;
  props: Record<string, unknown>;
}

interface TripInput {
  country: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  visaStatus: string;
  approved: boolean;
  stayAllowed: string;
}

/** Format date from YYYY-MM-DD to stamp-appropriate format */
function formatStampDate(dateStr: string, style: "long" | "eu" | "compact") {
  const parts = dateStr.split("-");
  if (parts.length !== 3) return dateStr;
  const [year, month, day] = parts;
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const monthIdx = parseInt(month, 10) - 1;
  const monthName = months[monthIdx] ?? month;

  if (style === "long") return `${day} ${monthName} ${year}`;
  if (style === "eu") return `${day}.${month}.${year}`;
  return `${day}${monthName}${year.slice(2)}`;
}

/**
 * Given trip data, returns the stamp type + fully-populated props
 * with deterministic randomized ink/rotation/fade based on trip seed.
 */
export function getStampForTrip(trip: TripInput): StampConfig {
  const seed = `${trip.countryCode}-${trip.arrivalDate}-${trip.country}`;
  const rng = seededRandom(seed);

  const stampType = COUNTRY_STAMP_TYPE[trip.countryCode] ?? DEFAULT_STAMP_TYPE;
  const inkColor = STAMP_INK_COLORS[trip.countryCode] ?? STAMP_INK_COLORS.DEFAULT;
  const airports = COUNTRY_AIRPORTS[trip.countryCode] ?? [DEFAULT_AIRPORT];
  const airport = pickRandom(rng, airports);
  const rotation = randomRotation(rng);
  const filter = randomInk(rng);
  const fade = randomFade(rng);

  const stayDaysMatch = trip.stayAllowed.match(/\d+/);
  const stayDays = stayDaysMatch ? parseInt(stayDaysMatch[0], 10) : 30;

  switch (stampType) {
    case "rectEntry":
      return {
        stampType,
        props: {
          color: inkColor,
          country: trip.country.toUpperCase(),
          airport: airport.name,
          date: formatStampDate(trip.arrivalDate, "long"),
          stayDays,
          visaClass: VISA_CLASS_MAP[trip.visaStatus] ?? "TOURIST",
          officerCode: `${String.fromCharCode(65 + Math.floor(rng() * 26))}-${String(Math.floor(rng() * 99)).padStart(2, "0")}`,
          filter,
          fade,
          rotation,
        } satisfies StampRectEntryProps,
      };

    case "round":
      return {
        stampType,
        props: {
          color: inkColor,
          country: trip.country.toUpperCase(),
          port: airport.name,
          date: formatStampDate(trip.arrivalDate, "long"),
          type: trip.approved ? "ENTRY" : "REFUSED",
          filter,
          fade,
          rotation,
        } satisfies StampRoundProps,
      };

    case "oval":
      return {
        stampType,
        props: {
          color: inkColor,
          code: trip.countryCode,
          city: trip.country.toUpperCase(),
          airport: airport.name,
          date: formatStampDate(trip.arrivalDate, "eu"),
          gate: `${String.fromCharCode(65 + Math.floor(rng() * 7))} ${String(Math.floor(100 + rng() * 400))}`,
          filter,
          fade,
          rotation,
        } satisfies StampOvalProps,
      };

    case "departure":
      return {
        stampType,
        props: {
          color: inkColor,
          country: trip.country.toUpperCase(),
          airport: airport.name,
          date: formatStampDate(trip.arrivalDate, "long"),
          code: trip.approved ? "ENTRY" : "REFUSED",
          officerBadge: `${String.fromCharCode(65 + Math.floor(rng() * 26))}${Math.floor(1 + rng() * 9)} ${String(Math.floor(100 + rng() * 899))}`,
          filter,
          fade,
          rotation,
        } satisfies StampDepartureProps,
      };

    case "visitPass":
      return {
        stampType,
        props: {
          color: inkColor,
          country: trip.country.toUpperCase(),
          refNo: `${String.fromCharCode(65 + Math.floor(rng() * 26))}${String(Math.floor(100 + rng() * 899))}`,
          date: formatStampDate(trip.arrivalDate, "long"),
          until: formatStampDate(trip.departureDate, "long"),
          filter,
          fade,
          rotation,
        } satisfies StampVisitPassProps,
      };

    case "vietnam":
      return {
        stampType,
        props: {
          color: inkColor,
          port: airport.name,
          portCode: `${String(Math.floor(100 + rng() * 899))}${String.fromCharCode(65 + Math.floor(rng() * 4))}`,
          date: formatStampDate(trip.arrivalDate, "long"),
          type: trip.approved ? "NHẬP CẢNH / ENTRY" : "TỪ CHỐI / REFUSED",
          filter,
          fade,
          rotation,
        } satisfies StampVietnamProps,
      };
  }
}

/**
 * Generate 1-2 smaller transit stamps for a trip page.
 * Uses regional airports that make sense as layover points.
 */
export function getTransitStamps(trip: TripInput, count: 1 | 2 = 1): StampConfig[] {
  const seed = `transit-${trip.countryCode}-${trip.arrivalDate}`;
  const rng = seededRandom(seed);

  // Pick transit airports from a different region than the destination
  const allRegionAirports = Object.entries(COUNTRY_AIRPORTS)
    .filter(([code]) => code !== trip.countryCode)
    .flatMap(([, airports]) => airports);

  const stamps: StampConfig[] = [];

  for (let stampIdx = 0; stampIdx < count; stampIdx++) {
    const transitAirport = pickRandom(rng, allRegionAirports);
    // Transit stamps are always small rectangular or oval
    const transitType = pickRandom<StampType>(rng, ["rectEntry", "oval"]);
    const transitDate = formatStampDate(trip.arrivalDate, transitType === "oval" ? "eu" : "compact");

    if (transitType === "oval") {
      stamps.push({
        stampType: "oval",
        props: {
          color: "#1a3a6b",
          code: transitAirport.code.slice(0, 2),
          city: transitAirport.code,
          airport: transitAirport.name,
          date: transitDate,
          gate: `${String.fromCharCode(65 + Math.floor(rng() * 7))} ${Math.floor(100 + rng() * 300)}`,
          filter: pickRandom<InkFilter>(rng, ["light", "medium"]),
          fade: pickRandom<FadeStyle>(rng, ["none", "topleft"]),
          rotation: randomRotation(rng, -8, 8),
        } satisfies StampOvalProps,
      });
    } else {
      stamps.push({
        stampType: "rectEntry",
        props: {
          color: "#1a3a6b",
          country: "TRANSIT",
          airport: transitAirport.name,
          date: transitDate,
          stayDays: 0,
          visaClass: "TRANSIT",
          officerCode: `T-${String(Math.floor(rng() * 99)).padStart(2, "0")}`,
          filter: pickRandom<InkFilter>(rng, ["light", "medium"]),
          fade: pickRandom<FadeStyle>(rng, ["none", "center"]),
          rotation: randomRotation(rng, -8, 8),
        } satisfies StampRectEntryProps,
      });
    }
  }

  return stamps;
}

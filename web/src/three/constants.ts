export const PASSPORT_COLORS: Record<string, string> = {
  FR: "#3C1438",
  US: "#1a2744",
  GB: "#6b1028",
  DE: "#3C1438",
  JP: "#1a2744",
  CN: "#6b1028",
  IN: "#1a2744",
  BR: "#1a5632",
  RU: "#6b1028",
  AU: "#1a2744",
  CA: "#1a2744",
  KR: "#1a5632",
  NL: "#3C1438",
  IT: "#3C1438",
  ES: "#3C1438",
  SE: "#1a2744",
  CH: "#6b1028",
  SG: "#6b1028",
  TH: "#3C1438",
  MY: "#1a2744",
  DEFAULT: "#1a2744",
};

/** EU member country codes — used to show "UNION EUROPEENNE" on cover */
export const EU_COUNTRIES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

/** Country name in native language for passport cover */
export const PASSPORT_NATIONALITY_LABEL: Record<string, string> = {
  FR: "RÉPUBLIQUE FRANÇAISE",
  US: "UNITED STATES OF AMERICA",
  GB: "UNITED KINGDOM",
  DE: "BUNDESREPUBLIK DEUTSCHLAND",
  JP: "日本国 JAPAN",
  CN: "中华人民共和国",
  IN: "REPUBLIC OF INDIA",
  BR: "REPÚBLICA FEDERATIVA DO BRASIL",
  RU: "РОССИЙСКАЯ ФЕДЕРАЦИЯ",
  AU: "AUSTRALIA",
  CA: "CANADA",
  KR: "대한민국 REPUBLIC OF KOREA",
  NL: "KONINKRIJK DER NEDERLANDEN",
  IT: "REPUBBLICA ITALIANA",
  ES: "REINO DE ESPAÑA",
  SE: "KONUNGARIKET SVERIGE",
  CH: "CONFÉDÉRATION SUISSE",
  SG: "REPUBLIC OF SINGAPORE",
  TH: "ราชอาณาจักรไทย KINGDOM OF THAILAND",
  MY: "MALAYSIA",
};

/** "PASSPORT" in local language */
export const PASSPORT_LABEL: Record<string, string> = {
  FR: "PASSEPORT",
  DE: "REISEPASS",
  IT: "PASSAPORTO",
  ES: "PASAPORTE",
  NL: "PASPOORT",
  BR: "PASSAPORTE",
  JP: "旅券 PASSPORT",
  CN: "护照 PASSPORT",
  KR: "여권 PASSPORT",
  TH: "หนังสือเดินทาง",
  RU: "ПАСПОРТ",
  DEFAULT: "PASSPORT",
};

export const STAMP_COLORS = {
  approved: {
    primary: "#1a3a6b",
    secondary: "#1a5c3a",
    bg: "rgba(26, 58, 107, 0.12)",
    text: "#1a3a6b",
  },
  rejected: {
    primary: "#8b1a1a",
    secondary: "#8b1a1a",
    bg: "rgba(139, 26, 26, 0.12)",
    text: "#8b1a1a",
  },
  not_found: {
    primary: "#6b7280",
    secondary: "#9ca3af",
    bg: "rgba(107, 114, 128, 0.12)",
    text: "#6b7280",
  },
} as const;

/** IATA airport codes grouped by world region — for generating transit stamps */
export const REGIONAL_AIRPORTS: Record<string, string[]> = {
  EU: ["CDG", "FRA", "AMS", "LHR", "FCO", "MAD", "MUC", "ZRH", "BCN", "BRU"],
  ASIA: ["NRT", "HND", "ICN", "BKK", "SIN", "HKG", "PEK", "KUL", "CGK", "DEL"],
  AMERICAS: ["JFK", "LAX", "ORD", "MIA", "GRU", "YYZ", "EZE", "MEX", "SFO", "ATL"],
  OCEANIA: ["SYD", "MEL", "AKL", "BNE", "PER"],
  MIDDLE_EAST: ["DXB", "DOH", "AUH", "IST", "TLV"],
  AFRICA: ["JNB", "CAI", "NBO", "CMN", "ADD"],
};

/** Map country code → region for picking transit airports */
export const COUNTRY_REGION: Record<string, string> = {
  FR: "EU", DE: "EU", NL: "EU", IT: "EU", ES: "EU", GB: "EU", SE: "EU",
  CH: "EU", BE: "EU", AT: "EU", PT: "EU", IE: "EU", GR: "EU", PL: "EU",
  JP: "ASIA", CN: "ASIA", KR: "ASIA", TH: "ASIA", SG: "ASIA", MY: "ASIA",
  IN: "ASIA", ID: "ASIA", VN: "ASIA", HK: "ASIA", TW: "ASIA", PH: "ASIA",
  US: "AMERICAS", CA: "AMERICAS", BR: "AMERICAS", MX: "AMERICAS", AR: "AMERICAS",
  AU: "OCEANIA", NZ: "OCEANIA",
  AE: "MIDDLE_EAST", QA: "MIDDLE_EAST", TR: "MIDDLE_EAST", IL: "MIDDLE_EAST",
  ZA: "AFRICA", EG: "AFRICA", KE: "AFRICA", MA: "AFRICA", NG: "AFRICA",
};

export const PAGE_WIDTH = 1.4;
export const PAGE_HEIGHT = 2.0;
export const PAGE_THICKNESS = 0.008;

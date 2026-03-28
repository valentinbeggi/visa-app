import type {
  StampRectEntryProps,
  StampRoundProps,
  StampOvalProps,
  StampDepartureProps,
  StampVisitPassProps,
  StampVietnamProps,
} from "./types.js";

interface Preset<T> {
  label: string;
  props: T;
}

type PresetMap = {
  rectEntry: Preset<StampRectEntryProps>[];
  round: Preset<StampRoundProps>[];
  oval: Preset<StampOvalProps>[];
  departure: Preset<StampDepartureProps>[];
  visitPass: Preset<StampVisitPassProps>[];
  vietnam: Preset<StampVietnamProps>[];
};

export const PRESETS: PresetMap = {
  rectEntry: [
    { label: "Thailand", props: { country: "THAILAND", color: "#1a4fa8", airport: "SUVARNABHUMI AIRPORT", date: "12 SEP 2024", stayDays: 30, visaClass: "TOURIST", officerCode: "A-42", rotation: -4 } },
    { label: "Japan", props: { country: "JAPAN", color: "#8B0000", airport: "NARITA INTL AIRPORT", date: "03 MAR 2024", stayDays: 90, visaClass: "TEMPORARY", officerCode: "T-07", rotation: 3 } },
    { label: "India", props: { country: "INDIA", color: "#E07B00", airport: "INDIRA GANDHI INTL", date: "27 JAN 2024", stayDays: 60, visaClass: "e-VISA", officerCode: "D-19", rotation: -2 } },
  ],
  round: [
    { label: "China", props: { country: "CHINA", countryNative: "\u4E2D\u534E\u4EBA\u6C11\u5171\u548C\u56FD", portNative: "\u6DF1\u5733\u6E7E\u53E3\u5CB8", port: "SHENZHEN BAY PORT", color: "#cc0000", date: "04 MAR 2024", type: "ENTRY", rotation: 6 } },
    { label: "Japan", props: { country: "JAPAN", countryNative: "\u65E5\u672C\u56FD", portNative: "\u6210\u7530\u56FD\u969B\u7A7A\u6E2F", port: "NARITA AIRPORT", color: "#8B0000", date: "03 APR 2024", type: "\u4E0A\u9678\u8A31\u53EF", rotation: -5 } },
    { label: "Hong Kong", props: { country: "HONG KONG", countryNative: "\u9999 \u6E2F", portNative: "\u8D64\u9C72\u89D2\u6A5F\u5834", port: "CHEK LAP KOK", color: "#4a0080", date: "26 AUG 2024", type: "DEPARTURE", rotation: 3 } },
  ],
  oval: [
    { label: "Netherlands", props: { code: "NL", country: "NETHERLANDS", city: "AMSTERDAM", airport: "SCHIPHOL", color: "#d35400", date: "20.05.2024", gate: "G 107", rotation: -3 } },
    { label: "Germany", props: { code: "DE", country: "GERMANY", city: "M\u00DCNCHEN", airport: "FLUGHAFEN", color: "#003399", date: "14.08.2024", gate: "F 140", rotation: 2 } },
    { label: "France", props: { code: "FR", country: "FRANCE", city: "PARIS", airport: "ROISSY CDG", color: "#002395", date: "07.03.2024", gate: "B 315", rotation: -1 } },
  ],
  departure: [
    { label: "Malaysia", props: { country: "MALAYSIA", countryNative: "\u30DE\u30EC\u30FC\u30B7\u30A2", airport: "KL INTERNATIONAL", color: "#b5000a", date: "09 SEP 2024", code: "KELUAR", officerBadge: "B6 555", rotation: 5 } },
    { label: "Indonesia", props: { country: "INDONESIA", countryNative: "\u30A4\u30F3\u30C9\u30CD\u30B7\u30A2", airport: "NGURAH RAI INTL", color: "#b50000", date: "22 JUL 2024", code: "KELUAR", officerBadge: "C3 118", rotation: -3 } },
    { label: "Philippines", props: { country: "PHILIPPINES", countryNative: "\u30D5\u30A3\u30EA\u30D4\u30F3", airport: "NINOY AQUINO INTL", color: "#003087", date: "15 FEB 2024", code: "DEPARTURE", officerBadge: "P1 077", rotation: 4 } },
  ],
  visitPass: [
    { label: "Singapore", props: { country: "SINGAPORE", color: "#006831", refNo: "A099", date: "09 SEP 2024", until: "09 OCT 2024", rotation: -6 } },
    { label: "Brunei", props: { country: "BRUNEI", color: "#007a3d", refNo: "B271", date: "15 NOV 2024", until: "14 DEC 2024", rotation: 4 } },
  ],
  vietnam: [
    { label: "Vietnam In", props: { port: "N\u1ED8I B\u00C0I", portCode: "141A", date: "30 AUG 2024", type: "NH\u1EACP C\u1EA2NH / ENTRY", color: "#003580", rotation: 3 } },
    { label: "Vietnam Out", props: { port: "T\u00C2N S\u01A0N NH\u1EA4T", portCode: "234A", date: "12 OCT 2024", type: "XU\u1EA4T C\u1EA2NH / DEPARTURE", color: "#003580", rotation: -4 } },
  ],
};

export const INK_OPTIONS = ["none", "light", "medium", "heavy"] as const;
export const FADE_OPTIONS = ["none", "center", "topleft", "corner"] as const;

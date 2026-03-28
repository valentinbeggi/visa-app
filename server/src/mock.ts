// ─── Mock visa data (used when RAPIDAPI_KEY is not set) ───

const PASSPORT_NAMES: Record<string, string> = {
  FR: "France", US: "United States", GB: "United Kingdom", DE: "Germany",
  JP: "Japan", CN: "China", IN: "India", BR: "Brazil", AU: "Australia",
  CA: "Canada", IT: "Italy", ES: "Spain", NL: "Netherlands", KR: "South Korea",
};

const COUNTRY_META: Record<string, { name: string; continent: string; capital: string; currency_code: string; currency: string }> = {
  JP: { name: "Japan", continent: "Asia", capital: "Tokyo", currency_code: "JPY", currency: "Japanese Yen" },
  TH: { name: "Thailand", continent: "Asia", capital: "Bangkok", currency_code: "THB", currency: "Thai Baht" },
  IN: { name: "India", continent: "Asia", capital: "New Delhi", currency_code: "INR", currency: "Indian Rupee" },
  ID: { name: "Indonesia", continent: "Asia", capital: "Jakarta", currency_code: "IDR", currency: "Indonesian Rupiah" },
  US: { name: "United States", continent: "Americas", capital: "Washington D.C.", currency_code: "USD", currency: "US Dollar" },
  FR: { name: "France", continent: "Europe", capital: "Paris", currency_code: "EUR", currency: "Euro" },
  DE: { name: "Germany", continent: "Europe", capital: "Berlin", currency_code: "EUR", currency: "Euro" },
  GB: { name: "United Kingdom", continent: "Europe", capital: "London", currency_code: "GBP", currency: "British Pound" },
  AU: { name: "Australia", continent: "Oceania", capital: "Canberra", currency_code: "AUD", currency: "Australian Dollar" },
  CN: { name: "China", continent: "Asia", capital: "Beijing", currency_code: "CNY", currency: "Chinese Yuan" },
  BR: { name: "Brazil", continent: "Americas", capital: "Brasília", currency_code: "BRL", currency: "Brazilian Real" },
  MX: { name: "Mexico", continent: "Americas", capital: "Mexico City", currency_code: "MXN", currency: "Mexican Peso" },
  ZA: { name: "South Africa", continent: "Africa", capital: "Pretoria", currency_code: "ZAR", currency: "South African Rand" },
  EG: { name: "Egypt", continent: "Africa", capital: "Cairo", currency_code: "EGP", currency: "Egyptian Pound" },
  KE: { name: "Kenya", continent: "Africa", capital: "Nairobi", currency_code: "KES", currency: "Kenyan Shilling" },
};

// [primaryRuleName, duration, hasEvisaSecondary, mandatoryRegistrationName]
const MOCK_RULES: Record<string, [string, string, boolean, string | null]> = {
  "FR-JP": ["Visa not required", "90 days", false, null],
  "FR-TH": ["Visa not required", "60 days", false, "Arrival Card"],
  "FR-IN": ["eVisa", "30 days", false, "e-Arrival"],
  "FR-ID": ["Visa on arrival", "30 days", true, "e-Arrival"],
  "FR-US": ["ESTA", "90 days", false, null],
  "FR-AU": ["eTA", "90 days", false, null],
  "FR-CN": ["Visa required", "30 days", false, null],
  "FR-BR": ["Visa not required", "90 days", false, null],
  "US-JP": ["Visa not required", "90 days", false, null],
  "US-TH": ["Visa not required", "30 days", false, "Arrival Card"],
  "US-IN": ["eVisa", "60 days", false, "e-Arrival"],
  "US-CN": ["Visa required", "30 days", false, null],
  "US-AU": ["eTA", "90 days", false, null],
  "GB-JP": ["Visa not required", "90 days", false, null],
  "GB-IN": ["eVisa", "30 days", false, "e-Arrival"],
  "IN-JP": ["Visa required", "90 days", false, null],
  "IN-TH": ["Visa on arrival", "15 days", true, null],
  "IN-ID": ["Visa on arrival", "30 days", true, "e-Arrival"],
  "CN-JP": ["Visa required", "15 days", false, null],
  "CN-ID": ["Visa on arrival", "30 days", true, "e-Arrival"],
};

export function getMockVisaData(passportCode: string, destinationCode: string) {
  const key = `${passportCode.toUpperCase()}-${destinationCode.toUpperCase()}`;
  const [primaryName, duration, hasEvisa, mandatoryName] =
    MOCK_RULES[key] ?? ["Visa not required", "90 days", false, null];

  const destMeta = COUNTRY_META[destinationCode.toUpperCase()] ?? {
    name: destinationCode.toUpperCase(),
    continent: "Unknown",
    capital: "Unknown",
    currency_code: "USD",
    currency: "US Dollar",
  };

  const passportName = PASSPORT_NAMES[passportCode.toUpperCase()] ?? passportCode.toUpperCase();

  return {
    passport: { code: passportCode.toUpperCase(), name: passportName, currency_code: "EUR" },
    destination: {
      code: destinationCode.toUpperCase(),
      ...destMeta,
      exchange: "1.0",
      passport_validity: "Valid for period of stay",
      phone_code: "+0",
      timezone: "+00:00",
      population: 0,
      area_km2: 0,
      embassy_url: `https://www.embassypages.com/${passportName.toLowerCase().replace(/ /g, "-")}`,
    },
    mandatory_registration: mandatoryName
      ? { name: mandatoryName, color: "yellow", link: "https://example.com" }
      : null,
    visa_rules: {
      primary_rule: { name: primaryName, duration, color: "blue" },
      ...(hasEvisa && { secondary_rule: { name: "eVisa", duration, color: "blue", link: "https://example.com" } }),
    },
  };
}

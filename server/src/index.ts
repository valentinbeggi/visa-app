import { McpServer } from "skybridge/server";
import { z } from "zod";
import { getMockVisaData } from "./mock.js";

import "dotenv/config";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((new Date(dateStr).getTime() - today.getTime()) / 86_400_000);
}

function daysBetween(from: string, to: string): number {
  return Math.floor((new Date(to).getTime() - new Date(from).getTime()) / 86_400_000);
}

function parseMaxStayDays(stayAllowed: string): number | null {
  const days = stayAllowed.match(/(\d+)\s*day/i);
  if (days) return parseInt(days[1]);
  const months = stayAllowed.match(/(\d+)\s*month/i);
  if (months) return parseInt(months[1]) * 30;
  return null;
}

function deriveVisaStatus(primaryRuleName: string): string {
  const name = primaryRuleName.toLowerCase();
  if (name === "not found") return "not_found";
  if (name.includes("free") || name.includes("without visa") || name.includes("not required")) return "visa_free";
  if (name.includes("on arrival")) return "visa_on_arrival";
  if (name.includes("evisa") || name.includes("e-visa")) return "evisa";
  if (name.includes("eta")) return "eta";
  if (name.includes("refused") || name.includes("ban") || name.includes("not allowed"))
    return "refused";
  return "visa_required";
}


async function fetchVisaData(passportCode: string, destinationCode: string) {
  if (!RAPIDAPI_KEY) {
    return getMockVisaData(passportCode, destinationCode);
  }

  const response = await fetch(
    "https://visa-requirement.p.rapidapi.com/v2/visa/check",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-rapidapi-key": RAPIDAPI_KEY,
        "x-rapidapi-host": "visa-requirement.p.rapidapi.com",
      },
      body: JSON.stringify({
        passport: passportCode.toUpperCase(),
        destination: destinationCode.toUpperCase(),
      }),
    }
  );

  const result = await response.json();

  if (!response.ok || result.error) {
    // Unknown country code — return a sentinel so the trip renders as "Not Found"
    return {
      passport: { code: passportCode.toUpperCase(), name: "", currency_code: "" },
      destination: {
        code: destinationCode.toUpperCase(),
        name: "Unknown Destination",
      },
      visa_rules: {
        primary_rule: { name: "Not found", duration: null, color: "gray" },
      },
      mandatory_registration: null,
    };
  }

  return result.data;
}

const server = new McpServer(
  {
    name: "visa-checker",
    version: "0.0.1",
  },
  { capabilities: {} }
).registerWidget(
  "check-visa",
  {
    description:
      "Visual passport showing real-time visa requirements for one or more destinations. Use this when the user asks about visa requirements for travel.",
  },
  {
    description: `Fetch and visualize real-time visa requirements for a passport holder travelling to one or more destinations.

Provide the ISO 3166-1 alpha-2 code for the passport country and an array of destination codes.
Examples: "FR" for France, "JP" for Japan, "US" for United States.`,
    inputSchema: {
      passportCode: z
        .string()
        .describe(
          "ISO 3166-1 alpha-2 passport/nationality country code (e.g. 'FR' for France)"
        ),
      destinationCodes: z
        .array(z.string())
        .describe(
          "Array of ISO 3166-1 alpha-2 destination country codes (e.g. ['JP', 'TH', 'ID'])"
        ),
      departureDate: z
        .string()
        .describe("Departure date in YYYY-MM-DD format (e.g. '2026-06-15')"),
      processingDays: z
        .record(z.string(), z.number())
        .describe(
          "Estimated visa processing time in days for each destination code, based on your knowledge of the required visa type. " +
          "Use 0 for visa-free and visa-on-arrival, 1–3 for eVisa/eTA, 14–30 for visa-required. " +
          "Example: { 'JP': 0, 'IN': 3, 'CN': 30 }"
        ),
      arrivalDate: z
        .string()
        .describe("Arrival date at the destination(s) in YYYY-MM-DD format (e.g. '2026-06-15')"),
      leavingDate: z
        .string()
        .describe("Leaving date from the destination(s) in YYYY-MM-DD format (e.g. '2026-06-29')"),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
      destructiveHint: false,
    },
  },
  async ({ passportCode, destinationCodes, departureDate, processingDays, arrivalDate, leavingDate }) => {
    const departsInDays = daysUntil(departureDate);

    // Fan out all API calls in parallel
    const apiResults = await Promise.all(
      destinationCodes.map((code) => fetchVisaData(passportCode, code))
    );

    const trips = apiResults.map((data, idx) => {
      const needed = processingDays[destinationCodes[idx]] ?? 0;
      const hasTime = departsInDays >= needed;

      if (!hasTime) {
        const note =
          departsInDays < 0
            ? "Departure date has already passed."
            : `Not enough time to obtain visa — need ${needed} day${needed !== 1 ? "s" : ""}, only ${departsInDays} available.`;
        return {
          country: data.destination.name,
          countryCode: data.destination.code,
          arrivalDate: "",
          departureDate,
          visaStatus: "refused",
          approved: false,
          stayAllowed: "",
          notes: note,
          primaryRuleName: departsInDays < 0 ? "Too late" : "Insufficient time",
          mandatoryRegistration: null,
        };
      }

      const primary = data.visa_rules.primary_rule;
      const secondary = data.visa_rules?.secondary_rule ?? null;

      const visaStatus = deriveVisaStatus(primary.name);
      const duration = primary.duration ?? secondary?.duration ?? "";

      // Stay-duration check: planned stay must not exceed what the visa allows
      if (arrivalDate && leavingDate && duration) {
        const plannedDays = daysBetween(arrivalDate, leavingDate);
        const maxDays = parseMaxStayDays(duration);
        if (maxDays !== null && plannedDays > maxDays) {
          return {
            country: data.destination.name,
            countryCode: data.destination.code,
            arrivalDate,
            departureDate: leavingDate,
            visaStatus: "refused",
            approved: false,
            stayAllowed: duration,
            notes: `Planned stay (${plannedDays} days) exceeds visa allowance (${maxDays} days).`,
            primaryRuleName: primary.name,
            mandatoryRegistration: data.mandatory_registration?.name ?? null,
          };
        }
      }

      const approved = !["visa_required", "refused", "not_found"].includes(visaStatus);

      // Notes: secondary rule + mandatory registration, shown on the stamp
      const noteParts: string[] = [];
      if (secondary) {
        noteParts.push(
          `Alternative: ${secondary.name}${secondary.duration ? ` (${secondary.duration})` : ""}`
        );
      }
      if (data.mandatory_registration) {
        noteParts.push(`Required: ${data.mandatory_registration.name}`);
      }

      return {
        country: data.destination.name,
        countryCode: data.destination.code,
        arrivalDate,
        departureDate: leavingDate,
        visaStatus,
        approved,
        stayAllowed: duration,
        notes: noteParts.join(" · "),
        primaryRuleName: primary.name,
        mandatoryRegistration: data.mandatory_registration?.name ?? null,
      };
    });

    const approvedCount = trips.filter((t) => t.approved).length;
    const rejectedCount = trips.length - approvedCount;
    const passport = apiResults[0].passport;

    const summaryLines = trips.map((t) => {
      const mark = t.approved ? "✓" : "✗";
      return `${mark} ${t.country}: ${t.primaryRuleName}${t.stayAllowed ? ` (${t.stayAllowed})` : ""}`;
    });

    return {
      structuredContent: {
        nationality: passport.name,
        nationalityCode: passport.code,
        totalDestinations: trips.length,
        approved: approvedCount,
        rejected: rejectedCount,
        trips,
        // Full raw API payloads, one per destination
        apiDataList: apiResults,
      },
      content: [
        {
          type: "text",
          text: [
            `Visa check for ${passport.name} passport — ${trips.length} destination${trips.length > 1 ? "s" : ""}:`,
            ...summaryLines,
            `\n${approvedCount}/${trips.length} destinations approved.`,
          ].join("\n"),
        },
      ],
    };
  }
);

server.run();

export type AppType = typeof server;

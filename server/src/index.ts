import { McpServer } from "skybridge/server";
import { z } from "zod";

import "dotenv/config";

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY ?? "";

function deriveVisaStatus(primaryRuleName: string): string {
  const name = primaryRuleName.toLowerCase();
  if (name === "not found") return "not_found";
  if (name.includes("free") || name.includes("without visa")) return "visa_free";
  if (name.includes("on arrival")) return "visa_on_arrival";
  if (name.includes("evisa") || name.includes("e-visa")) return "evisa";
  if (name.includes("eta")) return "eta";
  if (name.includes("refused") || name.includes("ban") || name.includes("not allowed"))
    return "refused";
  return "visa_required";
}

async function fetchVisaData(passportCode: string, destinationCode: string) {
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
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: true,
      destructiveHint: false,
    },
  },
  async ({ passportCode, destinationCodes }) => {
    // Fan out all API calls in parallel
    const apiResults = await Promise.all(
      destinationCodes.map((code) => fetchVisaData(passportCode, code))
    );

    const trips = apiResults.map((data) => {
      const primary = data.visa_rules.primary_rule;
      const secondary = data.visa_rules?.secondary_rule ?? null;

      const visaStatus = deriveVisaStatus(primary.name);
      const approved = !["visa_required", "refused", "not_found"].includes(visaStatus);

      // Duration: primary first, fall back to secondary
      const duration = primary.duration ?? secondary?.duration ?? "";

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
        arrivalDate: "",
        departureDate: "",
        visaStatus,
        approved,
        stayAllowed: duration,
        notes: noteParts.join(" · "),
        // Embedded for the frontend info panel (avoids index-matching apiDataList)
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

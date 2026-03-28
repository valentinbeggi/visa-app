import { McpServer } from "skybridge/server";
import { z } from "zod";

interface Trip {
  country: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  visaStatus: string;
  approved: boolean;
  stayAllowed: string;
  notes: string;
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
      "Visual 3D passport showing visa stamps for a multi-destination trip. Use this when the user asks about visa requirements for their travels.",
  },
  {
    description: `Check and visualize visa requirements for a trip. The LLM should determine visa requirements based on its knowledge and provide them as structured input.

The "trips" parameter must be a JSON string encoding an array of objects, each with:
- country (string): destination country name
- countryCode (string): ISO 3166-1 alpha-2 code (e.g. "JP")
- arrivalDate (string): YYYY-MM-DD
- departureDate (string): YYYY-MM-DD
- visaStatus (string): one of "visa_free", "visa_required", "evisa", "visa_on_arrival", "eta", "refused"
- approved (boolean): true if entry is approved
- stayAllowed (string): e.g. "30 days"
- notes (string): reason for rejection, special conditions, etc.

Example trips value: [{"country":"Japan","countryCode":"JP","arrivalDate":"2026-04-15","departureDate":"2026-04-30","visaStatus":"visa_free","approved":true,"stayAllowed":"90 days","notes":"No visa required"}]`,
    inputSchema: {
      nationality: z
        .string()
        .describe("Traveler's nationality / passport country (e.g. 'France')"),
      nationalityCode: z
        .string()
        .describe("ISO 3166-1 alpha-2 code of passport country (e.g. 'FR')"),
      trips: z
        .any()
        .describe(
          "Array of trip objects. Each object: {country, countryCode, arrivalDate, departureDate, visaStatus (visa_free|visa_required|evisa|visa_on_arrival|eta|refused), approved (boolean), stayAllowed, notes}"
        ),
    },
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
      destructiveHint: false,
    },
  },
  async ({ nationality, nationalityCode, trips: tripsRaw }) => {
    const trips: Trip[] = Array.isArray(tripsRaw)
      ? tripsRaw
      : JSON.parse(tripsRaw);

    const approvedCount = trips.filter((trip) => trip.approved).length;
    const rejectedCount = trips.length - approvedCount;

    const tripSummaries = trips.map((trip) => {
      const status = trip.approved ? "APPROVED" : "REJECTED";
      const visaLabel = trip.visaStatus.replace(/_/g, " ").toUpperCase();
      return `${trip.country} (${trip.arrivalDate} to ${trip.departureDate}): ${status} - ${visaLabel}${trip.notes ? ` - ${trip.notes}` : ""}`;
    });

    return {
      structuredContent: {
        nationality,
        nationalityCode,
        totalDestinations: trips.length,
        approved: approvedCount,
        rejected: rejectedCount,
        trips,
      },
      content: [
        {
          type: "text",
          text: `Visa check for ${nationality} passport holder:\n${tripSummaries.join("\n")}\n\nResult: ${approvedCount}/${trips.length} destinations approved.`,
        },
      ],
    };
  }
);

server.run();

export type AppType = typeof server;

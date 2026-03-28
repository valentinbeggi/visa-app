# Visa Checker - 3D Passport Experience

## Value Proposition
Check visa requirements for upcoming trips through conversation, visualized as a beautiful 3D passport with stamps. Target: travelers planning multi-destination trips who want a quick, visual answer to "do I need a visa?"

**Core actions**: Check visa requirements for one or more destinations, see approval/rejection status with validity dates.

## Why LLM?
**Conversational win**: "I'm French, traveling to Japan then Thailand next month for 2 weeks each" — one sentence captures nationality, destinations, dates, and duration.
**LLM adds**: Extracts structured trip data from natural language, reasons about timing (e.g. "you asked too late for an eVisa"), provides travel advice.
**What LLM lacks**: Real-time visa requirement data from authoritative sources.

## UI Overview
**First view**: A 3D passport book (closed) with the user's nationality on the cover, then opens to reveal stamps.
**Key interactions**: Each page spread = one destination in travel order. Shows a visa stamp with status (APPROVED/REJECTED), country name, dates, visa type, and reason for rejection if applicable. Users can flip pages with click/swipe.
**End state**: Full passport with all destinations checked. User can ask follow-up questions.

## Product Context
- **API**: Passport Index dataset (GitHub CSV) or Travel Buddy AI visa API for requirements lookup
- **Auth**: None required (public visa data)
- **Constraints**: Visa data may not be 100% current; display disclaimer

## UX Flows

Check visa requirements:
1. User describes trip (nationality, destinations, dates)
2. LLM extracts structured data, calls widget
3. Widget displays 3D passport with stamps for each destination

## Tools and Widgets

**Widget: check-visa**
- **Input**: `{ nationality: string, trips: Array<{ country: string, arrivalDate: string, departureDate: string, visaStatus: "visa_free" | "visa_required" | "evisa" | "visa_on_arrival" | "eta", approved: boolean, stayAllowed: string, notes: string }> }`
- **Output**: `{ nationality: string, totalDestinations: number, approved: number, rejected: number, trips: Trip[] }`
- **Views**: Fullscreen 3D passport with page turning
- **Display mode**: Fullscreen (Three.js needs space)
- **Behavior**: Renders passport cover with nationality, inside pages with stamps. Page flip animation on click/swipe.

Note: The LLM provides the visa assessment directly as input. The server enriches/validates if needed but the primary intelligence comes from the LLM's knowledge of visa requirements.

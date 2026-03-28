import "@/index.css";

import { mountWidget, useDisplayMode } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePassportScene } from "@/three/index.js";
import type { TripData } from "@/three/index.js";

function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

// ─── Main Widget (layout only) ───
function CheckVisa() {
  const { input, output, isPending } = useToolInfo<"check-visa">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(-1);
  const [isFlipping, setIsFlipping] = useState(false);

  const trips: TripData[] = output?.trips ?? [];
  const totalPages = trips.length;
  const isFullscreen = displayMode === "fullscreen";

  usePassportScene(
    containerRef,
    output?.nationality ?? input?.nationality ?? "Unknown",
    output?.nationalityCode ?? input?.nationalityCode ?? "XX",
    trips,
    currentPage
  );

  const flipPage = useCallback(
    (direction: "next" | "prev") => {
      if (isFlipping) return;
      setIsFlipping(true);
      setTimeout(() => setIsFlipping(false), 600);

      if (direction === "next" && currentPage < totalPages) {
        setCurrentPage((prev) => prev + 1);
      } else if (direction === "prev" && currentPage >= -1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    [currentPage, totalPages, isFlipping]
  );

  // Auto-open cover after mount
  useEffect(() => {
    if (!isPending && trips.length > 0 && currentPage === -1) {
      const timer = setTimeout(() => setCurrentPage(0), 800);
      return () => clearTimeout(timer);
    }
  }, [isPending, trips.length]);

  if (isPending) {
    return (
      <div className="loading-container">
        <span className="loading-text">Checking visas</span>
        <div className="loading-bar" />
      </div>
    );
  }

  const currentTrip =
    currentPage >= 1 && currentPage <= trips.length
      ? trips[currentPage - 1]
      : null;

  const pageLabel =
    currentPage <= 0
      ? "Cover"
      : currentPage <= trips.length
        ? trips[currentPage - 1].country
        : "Back";

  return (
    <div
      className="app-container"
      data-llm={`Viewing passport page: ${pageLabel}. ${output?.approved}/${output?.totalDestinations} destinations approved.`}
    >
      {/* Header */}
      <div className="passport-header">
        <div className="passport-title">
          <h1>Visa Check</h1>
          <span className="subtitle">{output?.nationality} passport</span>
        </div>
        <div className="passport-stats">
          <div className="stat-item">
            <span className="stat-label">Destinations</span>
            <span className="stat-value">{output?.totalDestinations}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item stat-approved">
            <span className="stat-label">Approved</span>
            <span className="stat-value">{output?.approved}</span>
          </div>
          {(output?.rejected ?? 0) > 0 && (
            <>
              <div className="stat-divider" />
              <div className="stat-item stat-rejected">
                <span className="stat-label">Rejected</span>
                <span className="stat-value">{output?.rejected}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mode toggle */}
      <button
        className="mode-btn"
        onClick={() => setDisplayMode(isFullscreen ? "inline" : "fullscreen")}
      >
        {isFullscreen ? "Collapse" : "Expand"}
      </button>

      {/* Three.js canvas */}
      <div className="canvas-container" ref={containerRef} />

      {/* Current trip info */}
      {currentTrip ? (
        <div className="trip-info">
          <div className="trip-country">
            {getFlagEmoji(currentTrip.countryCode)} {currentTrip.country}
          </div>
          <div className="trip-dates">
            {currentTrip.arrivalDate} — {currentTrip.departureDate}
          </div>
          <div className={`trip-status ${currentTrip.approved ? "approved" : "rejected"}`}>
            <span className="trip-status-dot" />
            {currentTrip.approved ? "Approved" : "Rejected"}
          </div>
          <div className="trip-visa-type">
            {currentTrip.visaStatus.replace(/_/g, " ")} · {currentTrip.stayAllowed}
          </div>
        </div>
      ) : currentPage <= 0 ? (
        <div className="cover-label">
          <h2>{output?.nationality}</h2>
          <p>
            {output?.totalDestinations} destinations · {output?.approved} approved
          </p>
        </div>
      ) : null}

      {/* Navigation */}
      <div className="nav-bar">
        <button
          className="nav-btn"
          onClick={() => flipPage("prev")}
          disabled={currentPage <= -1 || isFlipping}
        >
          &#8249;
        </button>
        <div className="nav-pages">
          <div
            className={`nav-dot ${currentPage <= 0 ? "active" : "visited"}`}
            onClick={() => !isFlipping && setCurrentPage(0)}
          />
          {trips.map((_, index) => (
            <div
              key={index}
              className={`nav-dot ${currentPage === index + 1 ? "active" : currentPage > index + 1 ? "visited" : ""}`}
              onClick={() => !isFlipping && setCurrentPage(index + 1)}
            />
          ))}
        </div>
        <button
          className="nav-btn"
          onClick={() => flipPage("next")}
          disabled={currentPage >= totalPages || isFlipping}
        >
          &#8250;
        </button>
      </div>
    </div>
  );
}

export default CheckVisa;

mountWidget(<CheckVisa />);

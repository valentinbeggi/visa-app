import "@/index.css";

import { mountWidget, useDisplayMode } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import { useEffect, useRef, useState, useCallback } from "react";
import { usePassportScene } from "@/three/index.js";
import type { TripData } from "@/three/index.js";

// ─── Main Widget (layout only) ───
function CheckVisa() {
  const { input, output, isPending } = useToolInfo<"check-visa">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(-1);
  const lastFlipRef = useRef(0);

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
      if (Date.now() - lastFlipRef.current < 600) return;
      lastFlipRef.current = Date.now();

      if (direction === "next") {
        if (currentPage < totalPages) {
          setCurrentPage((prev) => prev + 1);
        } else {
          // Close the passport from the last page
          setCurrentPage(-1);
        }
      } else if (direction === "prev" && currentPage >= -1) {
        setCurrentPage((prev) => prev - 1);
      }
    },
    [currentPage, totalPages]
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
      {/* Watermark title */}
      <div className="watermark-title">Visa Check</div>

      {/* Full-viewport passport canvas */}
      <div className="canvas-container" ref={containerRef} />

      {/* Side arrows */}
      <button
        className="side-arrow side-arrow-left"
        onClick={() => flipPage("prev")}
        disabled={currentPage <= -1}
      >
        &#8249;
      </button>
      <button
        className="side-arrow side-arrow-right"
        onClick={() => flipPage("next")}
        disabled={false}
      >
        &#8250;
      </button>

      {/* Page dots */}
      <div className="nav-dots">
        <div
          className={`nav-dot ${currentPage <= 0 ? "active" : "visited"}`}
          onClick={() => setCurrentPage(0)}
        />
        {trips.map((_, tripIndex) => (
          <div
            key={tripIndex}
            className={`nav-dot ${currentPage === tripIndex + 1 ? "active" : currentPage > tripIndex + 1 ? "visited" : ""}`}
            onClick={() => setCurrentPage(tripIndex + 1)}
          />
        ))}
      </div>

      {/* Expand toggle */}
      <button
        className="mode-btn"
        onClick={() => setDisplayMode(isFullscreen ? "inline" : "fullscreen")}
      >
        {isFullscreen ? "Collapse" : "Expand"}
      </button>
    </div>
  );
}

export default CheckVisa;

mountWidget(<CheckVisa />);

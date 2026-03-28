import "@/index.css";

import { mountWidget, useDisplayMode } from "skybridge/web";
import { useToolInfo } from "../helpers.js";
import { useEffect, useRef, useState, useCallback } from "react";
import * as THREE from "three";

// ─── Country flag emoji from code ───
function getFlagEmoji(countryCode: string) {
  return countryCode
    .toUpperCase()
    .split("")
    .map((char) => String.fromCodePoint(0x1f1e6 + char.charCodeAt(0) - 65))
    .join("");
}

// ─── Color palettes for visa stamps ───
const STAMP_COLORS = {
  approved: {
    primary: "#1a6b3c",
    secondary: "#2d9254",
    bg: "rgba(26, 107, 60, 0.12)",
    text: "#15803d",
  },
  rejected: {
    primary: "#991b1b",
    secondary: "#dc2626",
    bg: "rgba(153, 27, 27, 0.12)",
    text: "#dc2626",
  },
};

// ─── Passport cover colors by region ───
const PASSPORT_COLORS: Record<string, string> = {
  FR: "#1e3a5f",
  US: "#1a2744",
  GB: "#6b1028",
  DE: "#1e3a5f",
  JP: "#1a2744",
  CN: "#6b1028",
  IN: "#1a2744",
  BR: "#1a5632",
  RU: "#6b1028",
  AU: "#1a2744",
  DEFAULT: "#1a2744",
};

interface TripData {
  country: string;
  countryCode: string;
  arrivalDate: string;
  departureDate: string;
  visaStatus: string;
  approved: boolean;
  stayAllowed: string;
  notes: string;
}

// ─── Canvas texture generators ───
function createPassportCoverTexture(
  nationality: string,
  nationalityCode: string,
  color: string
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 720);

  // Subtle leather texture
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 720;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Gold embossed border
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 452, 660);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(38, 38, 436, 644);

  // Passport emblem circle
  const centerX = 256;
  const emblemY = 260;
  ctx.beginPath();
  ctx.arc(centerX, emblemY, 80, 0, Math.PI * 2);
  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(centerX, emblemY, 72, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Flag emoji in center
  ctx.font = "60px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(getFlagEmoji(nationalityCode), centerX, emblemY);

  // Title text
  ctx.fillStyle = "#c9a84c";
  ctx.font = "600 14px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.letterSpacing = "6px";
  ctx.fillText("PASSPORT", centerX, 120);

  // Country name
  ctx.font = "700 20px 'Playfair Display', serif";
  ctx.fillText(nationality.toUpperCase(), centerX, 440);

  // Decorative line
  ctx.beginPath();
  ctx.moveTo(156, 470);
  ctx.lineTo(356, 470);
  ctx.strokeStyle = "rgba(201, 168, 76, 0.5)";
  ctx.lineWidth = 1;
  ctx.stroke();

  // Small text
  ctx.font = "300 11px 'Inter', sans-serif";
  ctx.fillStyle = "rgba(201, 168, 76, 0.7)";
  ctx.fillText("TRAVEL DOCUMENT", centerX, 495);

  return canvas;
}

function createPassportBackTexture(color: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 512, 720);

  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 720;
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  ctx.strokeStyle = "#c9a84c";
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, 452, 660);

  return canvas;
}

function createPageTexture(
  trip: TripData,
  pageIndex: number,
  totalPages: number
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  // Page background - slightly off-white with aging effect
  const gradient = ctx.createLinearGradient(0, 0, 512, 720);
  gradient.addColorStop(0, "#faf8f0");
  gradient.addColorStop(0.5, "#f5f0e0");
  gradient.addColorStop(1, "#efe8d4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 720);

  // Subtle paper noise
  for (let i = 0; i < 2000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 720;
    const alpha = Math.random() * 0.05;
    ctx.fillStyle = `rgba(139, 119, 82, ${alpha})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Watermark pattern
  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.font = "80px serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#8b7752";
  ctx.translate(256, 360);
  ctx.rotate(-0.3);
  ctx.fillText(getFlagEmoji(trip.countryCode), 0, 0);
  ctx.restore();

  // Page number
  ctx.fillStyle = "rgba(139, 119, 82, 0.4)";
  ctx.font = "300 10px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`${pageIndex + 1} / ${totalPages}`, 256, 700);

  // ── Stamp ──
  const colors = trip.approved ? STAMP_COLORS.approved : STAMP_COLORS.rejected;
  const stampCenterX = 256;
  const stampCenterY = 300;

  // Stamp rotation for authenticity
  const rotation = (Math.random() - 0.5) * 0.2 - 0.05;
  ctx.save();
  ctx.translate(stampCenterX, stampCenterY);
  ctx.rotate(rotation);

  // Outer stamp border (double circle)
  const stampRadius = 130;
  ctx.beginPath();
  ctx.arc(0, 0, stampRadius, 0, Math.PI * 2);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(0, 0, stampRadius - 8, 0, Math.PI * 2);
  ctx.strokeStyle = colors.primary;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Country name along top arc
  ctx.fillStyle = colors.primary;
  ctx.font = "700 18px 'Inter', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const countryName = trip.country.toUpperCase();
  ctx.save();
  const arcRadius = stampRadius - 28;
  const arcLen = countryName.length * 0.09;
  const startAngle = -Math.PI / 2 - arcLen;
  for (let i = 0; i < countryName.length; i++) {
    const angle = startAngle + i * 0.18;
    const charX = arcRadius * Math.cos(angle);
    const charY = arcRadius * Math.sin(angle);
    ctx.save();
    ctx.translate(charX, charY);
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(countryName[i], 0, 0);
    ctx.restore();
  }
  ctx.restore();

  // Flag emoji
  ctx.font = "40px serif";
  ctx.fillText(getFlagEmoji(trip.countryCode), 0, -40);

  // Status label
  const statusText = trip.approved ? "APPROVED" : "REJECTED";
  ctx.fillStyle = colors.secondary;
  ctx.font = "700 28px 'Special Elite', monospace";
  ctx.fillText(statusText, 0, 15);

  // Visa type
  const visaLabel = trip.visaStatus.replace(/_/g, " ").toUpperCase();
  ctx.fillStyle = colors.primary;
  ctx.font = "500 12px 'Inter', sans-serif";
  ctx.fillText(visaLabel, 0, 48);

  // Divider
  ctx.beginPath();
  ctx.moveTo(-80, 65);
  ctx.lineTo(80, 65);
  ctx.strokeStyle = `${colors.primary}66`;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Dates
  ctx.fillStyle = colors.primary;
  ctx.font = "400 13px 'Inter', sans-serif";
  ctx.fillText(`${trip.arrivalDate} - ${trip.departureDate}`, 0, 85);

  // Stay allowed
  ctx.font = "300 11px 'Inter', sans-serif";
  ctx.fillStyle = `${colors.primary}cc`;
  ctx.fillText(`Stay: ${trip.stayAllowed}`, 0, 108);

  ctx.restore();

  // Notes at bottom
  if (trip.notes) {
    ctx.fillStyle = "rgba(100, 80, 50, 0.6)";
    ctx.font = "italic 300 12px 'Inter', sans-serif";
    ctx.textAlign = "center";

    // Word wrap notes
    const words = trip.notes.split(" ");
    let line = "";
    let lineY = 520;
    const maxWidth = 400;
    for (const word of words) {
      const testLine = line + (line ? " " : "") + word;
      if (ctx.measureText(testLine).width > maxWidth && line) {
        ctx.fillText(line, 256, lineY);
        line = word;
        lineY += 18;
      } else {
        line = testLine;
      }
    }
    if (line) ctx.fillText(line, 256, lineY);
  }

  // Entry/Exit labels at top
  ctx.fillStyle = "rgba(100, 80, 50, 0.5)";
  ctx.font = "600 10px 'Inter', sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("IMMIGRATION", 30, 50);
  ctx.textAlign = "right";
  ctx.fillText(`DESTINATION ${pageIndex + 1}`, 482, 50);

  // Decorative top border
  ctx.beginPath();
  ctx.moveTo(30, 60);
  ctx.lineTo(482, 60);
  ctx.strokeStyle = "rgba(100, 80, 50, 0.15)";
  ctx.lineWidth = 1;
  ctx.stroke();

  return canvas;
}

function createBlankPageTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 720;
  const ctx = canvas.getContext("2d")!;

  const gradient = ctx.createLinearGradient(0, 0, 512, 720);
  gradient.addColorStop(0, "#faf8f0");
  gradient.addColorStop(0.5, "#f5f0e0");
  gradient.addColorStop(1, "#efe8d4");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 720);

  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 720;
    ctx.fillStyle = `rgba(139, 119, 82, ${Math.random() * 0.03})`;
    ctx.fillRect(x, y, 1, 1);
  }

  // Faint grid lines
  ctx.strokeStyle = "rgba(139, 119, 82, 0.06)";
  ctx.lineWidth = 0.5;
  for (let y = 80; y < 680; y += 30) {
    ctx.beginPath();
    ctx.moveTo(40, y);
    ctx.lineTo(472, y);
    ctx.stroke();
  }

  return canvas;
}

// ─── Three.js Passport Scene ───
function usePassportScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  nationality: string,
  nationalityCode: string,
  trips: TripData[],
  currentPage: number
) {
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    pages: THREE.Group[];
    cover: THREE.Group;
    backCover: THREE.Mesh;
    animationId: number;
  } | null>(null);

  const pageTargets = useRef<number[]>([]);
  const pageCurrentAngles = useRef<number[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.2, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Lighting — warm, soft, matching cream palette
    const ambientLight = new THREE.AmbientLight(0xfff5e6, 0.7);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xfff0d4, 1.4);
    mainLight.position.set(3, 6, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xf0e8d8, 0.4);
    fillLight.position.set(-3, 3, -1);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xdaa520, 0.3, 10);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // Passport dimensions
    const pageWidth = 1.4;
    const pageHeight = 2.0;
    const pageThickness = 0.008;
    const passportColor =
      PASSPORT_COLORS[nationalityCode] || PASSPORT_COLORS.DEFAULT;

    // Book group - centered
    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = -0.4;
    scene.add(bookGroup);

    // Spine
    const spineGeo = new THREE.BoxGeometry(0.06, pageHeight, 0.15);
    const spineMat = new THREE.MeshStandardMaterial({
      color: passportColor,
      roughness: 0.7,
      metalness: 0.1,
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0, 0);
    bookGroup.add(spine);

    // Back cover (static, lies flat right)
    const backCoverGeo = new THREE.BoxGeometry(
      pageWidth,
      pageHeight,
      pageThickness * 3
    );
    const backTexture = new THREE.CanvasTexture(
      createPassportBackTexture(passportColor)
    );
    const backCoverMat = new THREE.MeshStandardMaterial({
      map: backTexture,
      roughness: 0.7,
      metalness: 0.1,
    });
    const backCover = new THREE.Mesh(backCoverGeo, backCoverMat);
    backCover.position.set(pageWidth / 2 + 0.03, 0, 0);
    bookGroup.add(backCover);

    // Create pages (each is a group with pivot at left edge)
    const totalPages = trips.length + 1; // +1 for a blank page at end
    const pages: THREE.Group[] = [];

    for (let i = 0; i < totalPages; i++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0.03, 0, 0); // pivot at spine edge

      const pageGeo = new THREE.BoxGeometry(
        pageWidth,
        pageHeight,
        pageThickness
      );

      let frontCanvas: HTMLCanvasElement;
      let backCanvas: HTMLCanvasElement;

      if (i < trips.length) {
        frontCanvas = createPageTexture(trips[i], i, trips.length);
        backCanvas =
          i + 1 < trips.length
            ? createBlankPageTexture()
            : createBlankPageTexture();
      } else {
        frontCanvas = createBlankPageTexture();
        backCanvas = createBlankPageTexture();
      }

      const frontTex = new THREE.CanvasTexture(frontCanvas);
      const backTex = new THREE.CanvasTexture(backCanvas);

      const materials = [
        new THREE.MeshStandardMaterial({
          color: 0xf5f0e0,
          roughness: 0.9,
        }), // right
        new THREE.MeshStandardMaterial({
          color: 0xf5f0e0,
          roughness: 0.9,
        }), // left
        new THREE.MeshStandardMaterial({
          color: 0xf5f0e0,
          roughness: 0.9,
        }), // top
        new THREE.MeshStandardMaterial({
          color: 0xf5f0e0,
          roughness: 0.9,
        }), // bottom
        new THREE.MeshStandardMaterial({
          map: frontTex,
          roughness: 0.85,
          metalness: 0.0,
        }), // front
        new THREE.MeshStandardMaterial({
          map: backTex,
          roughness: 0.85,
          metalness: 0.0,
        }), // back
      ];

      const pageMesh = new THREE.Mesh(pageGeo, materials);
      pageMesh.position.set(pageWidth / 2, 0, 0); // offset so left edge is at pivot
      pageMesh.castShadow = true;
      pageMesh.receiveShadow = true;

      pageGroup.add(pageMesh);
      bookGroup.add(pageGroup);
      pages.push(pageGroup);
    }

    // Front cover (same as a page group with pivot)
    const coverGroup = new THREE.Group();
    coverGroup.position.set(0.03, 0, 0);

    const coverGeo = new THREE.BoxGeometry(
      pageWidth,
      pageHeight,
      pageThickness * 3
    );
    const coverTexture = new THREE.CanvasTexture(
      createPassportCoverTexture(nationality, nationalityCode, passportColor)
    );
    const coverBackTex = new THREE.CanvasTexture(
      createBlankPageTexture()
    );
    const coverMaterials = [
      new THREE.MeshStandardMaterial({
        color: passportColor,
        roughness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        color: passportColor,
        roughness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        color: passportColor,
        roughness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        color: passportColor,
        roughness: 0.7,
      }),
      new THREE.MeshStandardMaterial({
        map: coverTexture,
        roughness: 0.65,
        metalness: 0.15,
      }),
      new THREE.MeshStandardMaterial({
        map: coverBackTex,
        roughness: 0.85,
      }),
    ];

    const coverMesh = new THREE.Mesh(coverGeo, coverMaterials);
    coverMesh.position.set(pageWidth / 2, 0, 0);
    coverMesh.castShadow = true;
    coverGroup.add(coverMesh);
    bookGroup.add(coverGroup);

    // Initialize page angles
    // Page 0 = cover, pages 1..N = content pages
    const allFlippable = [coverGroup, ...pages];
    pageCurrentAngles.current = allFlippable.map(() => 0);
    pageTargets.current = allFlippable.map(() => 0);

    sceneRef.current = {
      scene,
      camera,
      renderer,
      pages,
      cover: coverGroup,
      backCover,
      animationId: 0,
    };

    // Animation loop
    let time = 0;
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      time += 0.01;

      // Smooth page flipping
      allFlippable.forEach((group, index) => {
        const target = pageTargets.current[index];
        const current = pageCurrentAngles.current[index];
        const diff = target - current;
        pageCurrentAngles.current[index] += diff * 0.08;
        group.rotation.y = -pageCurrentAngles.current[index];

        // Slight z-offset to prevent z-fighting
        group.position.z = index * 0.003 - pageCurrentAngles.current[index] * 0.002;
      });

      // Gentle floating
      bookGroup.position.y = Math.sin(time * 0.5) * 0.03;
      bookGroup.rotation.z = Math.sin(time * 0.3) * 0.008;

      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(sceneRef.current!.animationId);
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nationality, nationalityCode, trips]);

  // Update page targets when currentPage changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const totalFlippable = 1 + sceneRef.current.pages.length; // cover + pages

    for (let i = 0; i < totalFlippable; i++) {
      // Pages 0..currentPage should be flipped (rotated to left)
      if (i <= currentPage) {
        pageTargets.current[i] = Math.PI * 0.95;
      } else {
        pageTargets.current[i] = 0;
      }
    }
  }, [currentPage]);
}

// ─── Main Widget ───
function CheckVisa() {
  const { input, output, isPending } = useToolInfo<"check-visa">();
  const [displayMode, setDisplayMode] = useDisplayMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(-1); // -1 = cover closed
  const [isFlipping, setIsFlipping] = useState(false);

  const trips = output?.trips ?? [];
  const totalPages = trips.length; // cover + trip pages
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
      const timer = setTimeout(() => {
        setCurrentPage(0);
      }, 800);
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
          <span className="subtitle">
            {output?.nationality} passport
          </span>
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
        onClick={() =>
          setDisplayMode(isFullscreen ? "inline" : "fullscreen")
        }
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
          <div
            className={`trip-status ${currentTrip.approved ? "approved" : "rejected"}`}
          >
            <span className="trip-status-dot" />
            {currentTrip.approved ? "Approved" : "Rejected"}
          </div>
          <div className="trip-visa-type">
            {currentTrip.visaStatus.replace(/_/g, " ")} ·{" "}
            {currentTrip.stayAllowed}
          </div>
        </div>
      ) : currentPage <= 0 ? (
        <div className="cover-label">
          <h2>{output?.nationality}</h2>
          <p>
            {output?.totalDestinations} destinations ·{" "}
            {output?.approved} approved
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
          {/* Cover dot */}
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

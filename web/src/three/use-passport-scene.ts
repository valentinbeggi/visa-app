// ─── Three.js passport scene hook ───
// Owns the full 3D lifecycle: scene, camera, renderer, geometry, animation.
// Layout code should only pass a container ref, data, and current page index.

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PASSPORT_COLORS, PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS } from "./constants.js";
import {
  createPassportCoverTexture,
  createPassportBackTexture,
  createPageTexture,
  createBlankPageTexture,
} from "./textures.js";
import type { TripData } from "./textures.js";

interface SceneState {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  pages: THREE.Group[];
  cover: THREE.Group;
  backCover: THREE.Mesh;
  animationId: number;
}

// ─── Procedural bump map generators ───

function createPaperBumpCanvas() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Mid-gray base
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  // Tiny random height variations for paper grain
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let pixIdx = 0; pixIdx < pixels.length; pixIdx += 4) {
    const noise = 128 + (Math.random() - 0.5) * 20;
    pixels[pixIdx] = noise;
    pixels[pixIdx + 1] = noise;
    pixels[pixIdx + 2] = noise;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function createLeatherBumpCanvas() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  // Larger, more directional noise for leather
  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let pixIdx = 0; pixIdx < pixels.length; pixIdx += 4) {
    const rowIdx = Math.floor((pixIdx / 4) / size);
    const colIdx = (pixIdx / 4) % size;
    // Directional banding + random noise
    const band = Math.sin(rowIdx * 0.3 + colIdx * 0.05) * 10;
    const noise = (Math.random() - 0.5) * 30;
    const value = 128 + band + noise;
    pixels[pixIdx] = value;
    pixels[pixIdx + 1] = value;
    pixels[pixIdx + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

// ─── Procedural environment map ───

function createProceduralEnvMap(renderer: THREE.WebGLRenderer) {
  // Create a simple gradient for PMREMGenerator
  const gradientCanvas = document.createElement("canvas");
  gradientCanvas.width = 256;
  gradientCanvas.height = 256;
  const gradCtx = gradientCanvas.getContext("2d")!;
  const envGradient = gradCtx.createLinearGradient(0, 0, 0, 256);
  envGradient.addColorStop(0, "#d4cbb8");   // warm muted top
  envGradient.addColorStop(0.4, "#b8ae9a"); // mid warm
  envGradient.addColorStop(1, "#8a8070");   // darker bottom
  gradCtx.fillStyle = envGradient;
  gradCtx.fillRect(0, 0, 256, 256);

  const envTexture = new THREE.CanvasTexture(gradientCanvas);
  envTexture.mapping = THREE.EquirectangularReflectionMapping;

  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
  const envMap = pmremGenerator.fromEquirectangular(envTexture).texture;

  envTexture.dispose();
  pmremGenerator.dispose();

  return envMap;
}

// ─── Main hook ───

export function usePassportScene(
  containerRef: React.RefObject<HTMLDivElement | null>,
  nationality: string,
  nationalityCode: string,
  trips: TripData[],
  currentPage: number
) {
  const sceneRef = useRef<SceneState | null>(null);
  const pageTargets = useRef<number[]>([]);
  const pageCurrentAngles = useRef<number[]>([]);

  // ── Build scene on data change ──
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      container.clientWidth / container.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 2.2, 4.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // ── Environment map ──
    const envMap = createProceduralEnvMap(renderer);
    scene.environment = envMap;

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xfff5e6, 0.6));

    const mainLight = new THREE.DirectionalLight(0xfff0d4, 1.6);
    mainLight.position.set(3, 6, 4);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.5;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xf0e8d8, 0.25);
    fillLight.position.set(-3, 3, -1);
    scene.add(fillLight);

    const rimLight = new THREE.PointLight(0xdaa520, 0.3, 10);
    rimLight.position.set(0, 2, -3);
    scene.add(rimLight);

    // ── Shared bump maps ──
    const paperBumpTexture = new THREE.CanvasTexture(createPaperBumpCanvas());
    paperBumpTexture.wrapS = THREE.RepeatWrapping;
    paperBumpTexture.wrapT = THREE.RepeatWrapping;
    paperBumpTexture.repeat.set(2, 2);

    const leatherBumpTexture = new THREE.CanvasTexture(createLeatherBumpCanvas());
    leatherBumpTexture.wrapS = THREE.RepeatWrapping;
    leatherBumpTexture.wrapT = THREE.RepeatWrapping;

    // ── Book group ──
    const passportColor = PASSPORT_COLORS[nationalityCode] || PASSPORT_COLORS.DEFAULT;
    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = -0.4;
    scene.add(bookGroup);

    // Spine
    const spineMat = new THREE.MeshPhysicalMaterial({
      color: passportColor,
      roughness: 0.75,
      metalness: 0.05,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.006,
      clearcoat: 0.2,
      clearcoatRoughness: 0.7,
    });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, PAGE_HEIGHT, 0.15), spineMat);
    bookGroup.add(spine);

    // Back cover — leather outside, paper inside
    const backCoverOuterTex = new THREE.CanvasTexture(createPassportBackTexture(passportColor));
    backCoverOuterTex.colorSpace = THREE.SRGBColorSpace;
    const backCoverInnerTex = new THREE.CanvasTexture(createBlankPageTexture());
    backCoverInnerTex.colorSpace = THREE.SRGBColorSpace;
    const backCoverLeatherMat = new THREE.MeshPhysicalMaterial({
      map: backCoverOuterTex,
      roughness: 0.7,
      metalness: 0.05,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.008,
      clearcoat: 0.3,
      clearcoatRoughness: 0.6,
    });
    const backCoverInnerMat = new THREE.MeshPhysicalMaterial({
      map: backCoverInnerTex,
      roughness: 0.92,
      metalness: 0.0,
      bumpMap: paperBumpTexture,
      bumpScale: 0.003,
      sheen: 0.1,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0xf5f0e0),
    });
    const backCoverSideMat = new THREE.MeshPhysicalMaterial({
      color: passportColor,
      roughness: 0.7,
      clearcoat: 0.3,
      clearcoatRoughness: 0.6,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.008,
    });
    const backCover = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3),
      [
        backCoverSideMat, backCoverSideMat, backCoverSideMat, backCoverSideMat,
        backCoverInnerMat,   // +Z face (inner, faces camera)
        backCoverLeatherMat, // -Z face (outer, faces away)
      ]
    );
    backCover.position.set(PAGE_WIDTH / 2 + 0.03, 0, 0);
    bookGroup.add(backCover);

    // ── Pages ──
    const totalPages = trips.length + 1;
    const pages: THREE.Group[] = [];
    const pageSideMat = new THREE.MeshPhysicalMaterial({
      color: 0xf5f0e0,
      roughness: 0.92,
      sheen: 0.1,
      sheenRoughness: 0.8,
      sheenColor: new THREE.Color(0xf5f0e0),
    });

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0.03, 0, 0);

      let frontColorCanvas: HTMLCanvasElement;
      let frontClearcoatCanvas: HTMLCanvasElement | null = null;
      let backCanvas: HTMLCanvasElement;

      if (pageIdx < trips.length) {
        const pageResult = createPageTexture(trips[pageIdx], pageIdx, trips.length);
        frontColorCanvas = pageResult.color;
        frontClearcoatCanvas = pageResult.clearcoatMap;
      } else {
        frontColorCanvas = createBlankPageTexture();
      }
      backCanvas = createBlankPageTexture();

      const frontTexture = new THREE.CanvasTexture(frontColorCanvas);
      frontTexture.colorSpace = THREE.SRGBColorSpace;
      const backTexture = new THREE.CanvasTexture(backCanvas);
      backTexture.colorSpace = THREE.SRGBColorSpace;

      // Front page material with clearcoat map for stamp glossiness
      const frontPageMat = new THREE.MeshPhysicalMaterial({
        map: frontTexture,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: paperBumpTexture,
        bumpScale: 0.003,
        sheen: 0.1,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color(0xf5f0e0),
        clearcoat: 0.15,
        clearcoatRoughness: 0.5,
      });

      if (frontClearcoatCanvas) {
        const clearcoatMapTexture = new THREE.CanvasTexture(frontClearcoatCanvas);
        frontPageMat.clearcoatMap = clearcoatMapTexture;
      }

      const backPageMat = new THREE.MeshPhysicalMaterial({
        map: backTexture,
        roughness: 0.92,
        metalness: 0.0,
        bumpMap: paperBumpTexture,
        bumpScale: 0.003,
        sheen: 0.1,
        sheenRoughness: 0.8,
        sheenColor: new THREE.Color(0xf5f0e0),
      });

      const materials = [
        pageSideMat, pageSideMat, pageSideMat, pageSideMat,
        frontPageMat,
        backPageMat,
      ];

      const pageMesh = new THREE.Mesh(
        new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS),
        materials
      );
      pageMesh.position.set(PAGE_WIDTH / 2, 0, 0);
      pageMesh.castShadow = true;
      pageMesh.receiveShadow = true;

      pageGroup.add(pageMesh);
      bookGroup.add(pageGroup);
      pages.push(pageGroup);
    }

    // ── Front cover ──
    const coverGroup = new THREE.Group();
    coverGroup.position.set(0.03, 0, 0);

    const coverTexture = new THREE.CanvasTexture(
      createPassportCoverTexture(nationality, nationalityCode, passportColor)
    );
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    const coverBackTex = new THREE.CanvasTexture(createBlankPageTexture());
    coverBackTex.colorSpace = THREE.SRGBColorSpace;

    const coverSideMat = new THREE.MeshPhysicalMaterial({
      color: passportColor,
      roughness: 0.7,
      clearcoat: 0.3,
      clearcoatRoughness: 0.6,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.008,
    });

    const coverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3),
      [
        coverSideMat, coverSideMat, coverSideMat, coverSideMat,
        new THREE.MeshPhysicalMaterial({
          map: coverTexture,
          roughness: 0.65,
          metalness: 0.1,
          clearcoat: 0.3,
          clearcoatRoughness: 0.6,
          bumpMap: leatherBumpTexture,
          bumpScale: 0.008,
        }),
        new THREE.MeshPhysicalMaterial({
          map: coverBackTex,
          roughness: 0.85,
          bumpMap: paperBumpTexture,
          bumpScale: 0.003,
        }),
      ]
    );
    coverMesh.position.set(PAGE_WIDTH / 2, 0, 0);
    coverMesh.castShadow = true;
    coverGroup.add(coverMesh);
    bookGroup.add(coverGroup);

    // ── Init angles ──
    const allFlippable = [coverGroup, ...pages];
    const flippableCount = allFlippable.length;
    pageCurrentAngles.current = allFlippable.map(() => 0);
    pageTargets.current = allFlippable.map(() => 0);

    sceneRef.current = { scene, camera, renderer, pages, cover: coverGroup, backCover, animationId: 0 };

    // ── Animation loop ──
    let time = 0;
    const zStep = 0.01;
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      time += 0.01;

      allFlippable.forEach((group, index) => {
        const target = pageTargets.current[index];
        const current = pageCurrentAngles.current[index];
        pageCurrentAngles.current[index] += (target - current) * 0.08;
        group.rotation.y = -pageCurrentAngles.current[index];
        // Cover on top (highest z), last page at bottom.
        // Flipped pages swing behind the stack (negative z shift).
        const stackZ = (flippableCount - 1 - index) * zStep;
        const flipZ = pageCurrentAngles.current[index] * 0.015;
        group.position.z = stackZ - flipZ;
      });

      bookGroup.position.y = Math.sin(time * 0.5) * 0.03;
      bookGroup.rotation.z = Math.sin(time * 0.3) * 0.008;

      renderer.render(scene, camera);
    };
    animate();

    // ── Resize ──
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
      envMap.dispose();
      paperBumpTexture.dispose();
      leatherBumpTexture.dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nationality, nationalityCode, trips]);

  // ── Flip pages when currentPage changes ──
  useEffect(() => {
    if (!sceneRef.current) return;
    const totalFlippable = 1 + sceneRef.current.pages.length;
    // When on the last trip page, also flip the trailing blank page
    // so the passport closes and shows the back cover.
    const isLastTripPage = currentPage >= totalFlippable - 2;

    for (let flipIdx = 0; flipIdx < totalFlippable; flipIdx++) {
      const shouldFlip = flipIdx <= currentPage || (isLastTripPage && flipIdx === totalFlippable - 1);
      pageTargets.current[flipIdx] = shouldFlip ? Math.PI * 0.95 : 0;
    }
  }, [currentPage]);
}

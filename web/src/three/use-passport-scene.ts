import { useEffect, useRef } from "react";
import * as THREE from "three";
import { PASSPORT_COLORS, PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS } from "./constants.js";
import {
  createPassportCoverTexture,
  createPassportBackTexture,
  createPageTexture,
  createBlankPageTexture,
  createVisaInfoTexture,
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
  disposables: (() => void)[];
}

function createBumpCanvas(noiseFn: (pixIdx: number, rowIdx: number, colIdx: number) => number) {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, size, size);

  const imageData = ctx.getImageData(0, 0, size, size);
  const pixels = imageData.data;
  for (let pixIdx = 0; pixIdx < pixels.length; pixIdx += 4) {
    const rowIdx = Math.floor((pixIdx / 4) / size);
    const colIdx = (pixIdx / 4) % size;
    const value = noiseFn(pixIdx, rowIdx, colIdx);
    pixels[pixIdx] = value;
    pixels[pixIdx + 1] = value;
    pixels[pixIdx + 2] = value;
  }
  ctx.putImageData(imageData, 0, 0);

  return canvas;
}

function createPaperBumpCanvas() {
  return createBumpCanvas(() => 128 + (Math.random() - 0.5) * 20);
}

function createLeatherBumpCanvas() {
  return createBumpCanvas((_pixIdx, rowIdx, colIdx) => {
    const band = Math.sin(rowIdx * 0.3 + colIdx * 0.05) * 10;
    const noise = (Math.random() - 0.5) * 30;
    return 128 + band + noise;
  });
}

function createProceduralEnvMap(renderer: THREE.WebGLRenderer) {
  const gradientCanvas = document.createElement("canvas");
  gradientCanvas.width = 256;
  gradientCanvas.height = 256;
  const gradCtx = gradientCanvas.getContext("2d")!;
  const envGradient = gradCtx.createLinearGradient(0, 0, 0, 256);
  envGradient.addColorStop(0, "#d4cbb8");
  envGradient.addColorStop(0.4, "#b8ae9a");
  envGradient.addColorStop(1, "#8a8070");
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
    camera.position.set(0, 1.8, 3.2);
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

    // Track all GPU resources for disposal
    const disposables: (() => void)[] = [];
    const trackTexture = (tex: THREE.Texture) => { disposables.push(() => tex.dispose()); return tex; };
    const trackMaterial = <T extends THREE.Material>(mat: T) => { disposables.push(() => mat.dispose()); return mat; };
    const trackGeometry = (geo: THREE.BufferGeometry) => { disposables.push(() => geo.dispose()); return geo; };

    // ── Shared geometries ──
    const pageGeo = trackGeometry(new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS));
    const coverGeo = trackGeometry(new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3));
    const spineGeo = trackGeometry(new THREE.BoxGeometry(0.06, PAGE_HEIGHT, 0.15));

    // ── Shared material defaults ──
    const passportColor = PASSPORT_COLORS[nationalityCode] || PASSPORT_COLORS.DEFAULT;
    const PAPER_SHEEN = new THREE.Color(0xf5f0e0);

    const paperDefaults = {
      roughness: 0.92,
      metalness: 0.0,
      bumpMap: paperBumpTexture,
      bumpScale: 0.003,
      sheen: 0.1,
      sheenRoughness: 0.8,
      sheenColor: PAPER_SHEEN,
    } as const;

    const leatherSideDefaults = {
      color: passportColor,
      roughness: 0.7,
      clearcoat: 0.3,
      clearcoatRoughness: 0.6,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.008,
    } as const;

    const leatherSideMat = trackMaterial(new THREE.MeshPhysicalMaterial(leatherSideDefaults));
    const pageSideMat = trackMaterial(new THREE.MeshPhysicalMaterial({
      color: 0xf5f0e0,
      roughness: 0.92,
      sheen: 0.1,
      sheenRoughness: 0.8,
      sheenColor: PAPER_SHEEN,
    }));

    // ── Cached blank page texture (identical every call — create once) ──
    const blankPageCanvas = createBlankPageTexture();

    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = -0.4;
    scene.add(bookGroup);

    // Spine
    const spineMat = trackMaterial(new THREE.MeshPhysicalMaterial({
      color: passportColor,
      roughness: 0.75,
      metalness: 0.05,
      bumpMap: leatherBumpTexture,
      bumpScale: 0.006,
      clearcoat: 0.2,
      clearcoatRoughness: 0.7,
    }));
    bookGroup.add(new THREE.Mesh(spineGeo, spineMat));

    // Back cover
    const backCoverOuterTex = trackTexture(new THREE.CanvasTexture(createPassportBackTexture(passportColor)));
    backCoverOuterTex.colorSpace = THREE.SRGBColorSpace;
    const backCoverInnerTex = trackTexture(new THREE.CanvasTexture(blankPageCanvas));
    backCoverInnerTex.colorSpace = THREE.SRGBColorSpace;

    const backCover = new THREE.Mesh(coverGeo, [
      leatherSideMat, leatherSideMat, leatherSideMat, leatherSideMat,
      trackMaterial(new THREE.MeshPhysicalMaterial({
        map: backCoverOuterTex,
        roughness: 0.7,
        metalness: 0.05,
        bumpMap: leatherBumpTexture,
        bumpScale: 0.008,
        clearcoat: 0.3,
        clearcoatRoughness: 0.6,
      })),
      trackMaterial(new THREE.MeshPhysicalMaterial({ ...paperDefaults, map: backCoverInnerTex })),
    ]);
    backCover.position.set(PAGE_WIDTH / 2 + 0.03, 0, -0.02);
    bookGroup.add(backCover);

    // ── Pages ──
    const pages: THREE.Group[] = [];

    for (let pageIdx = 0; pageIdx < trips.length; pageIdx++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0.03, 0, 0);

      const pageResult = createPageTexture(trips[pageIdx], pageIdx, trips.length);
      // Back face of page N = left page when viewing trip N+1
      const pageNumber = 16 + pageIdx * 2 + 1;
      const backCanvas = pageIdx < trips.length - 1
        ? createVisaInfoTexture(trips[pageIdx + 1], pageNumber)
        : blankPageCanvas;

      const frontTexture = trackTexture(new THREE.CanvasTexture(pageResult.color));
      frontTexture.colorSpace = THREE.SRGBColorSpace;
      const backTexture = trackTexture(new THREE.CanvasTexture(backCanvas));
      backTexture.colorSpace = THREE.SRGBColorSpace;

      const frontPageMat = trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: frontTexture,
        clearcoat: 0.15,
        clearcoatRoughness: 0.5,
      }));

      if (pageResult.clearcoatMap) {
        const clearcoatMapTexture = trackTexture(new THREE.CanvasTexture(pageResult.clearcoatMap));
        frontPageMat.clearcoatMap = clearcoatMapTexture;
      }

      const backPageMat = trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: backTexture,
      }));

      const pageMesh = new THREE.Mesh(pageGeo, [
        pageSideMat, pageSideMat, pageSideMat, pageSideMat,
        frontPageMat,
        backPageMat,
      ]);
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

    const coverTexture = trackTexture(new THREE.CanvasTexture(
      createPassportCoverTexture(nationality, nationalityCode, passportColor)
    ));
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    const coverInnerCanvas = trips.length > 0
      ? createVisaInfoTexture(trips[0], 16)
      : blankPageCanvas;
    const coverBackTex = trackTexture(new THREE.CanvasTexture(coverInnerCanvas));
    coverBackTex.colorSpace = THREE.SRGBColorSpace;

    const coverMesh = new THREE.Mesh(coverGeo, [
      leatherSideMat, leatherSideMat, leatherSideMat, leatherSideMat,
      trackMaterial(new THREE.MeshPhysicalMaterial({
        map: coverTexture,
        roughness: 0.65,
        metalness: 0.1,
        clearcoat: 0.3,
        clearcoatRoughness: 0.6,
        bumpMap: leatherBumpTexture,
        bumpScale: 0.008,
      })),
      trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: coverBackTex,
        roughness: 0.85,
      })),
    ]);
    coverMesh.position.set(PAGE_WIDTH / 2, 0, 0);
    coverMesh.castShadow = true;
    coverGroup.add(coverMesh);
    bookGroup.add(coverGroup);

    // ── Init angles ──
    const allFlippable = [coverGroup, ...pages];
    const flippableCount = allFlippable.length;
    pageCurrentAngles.current = allFlippable.map(() => 0);
    pageTargets.current = allFlippable.map(() => 0);

    sceneRef.current = { scene, camera, renderer, pages, cover: coverGroup, backCover, animationId: 0, disposables };

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
        // Z-ordering reverses when pages flip to the left side
        const flipT = Math.min(pageCurrentAngles.current[index] / (Math.PI * 0.95), 1);
        const closedZ = (flippableCount - 1 - index) * zStep;
        const openZ = index * zStep - flippableCount * zStep;
        group.position.z = closedZ * (1 - flipT) + openZ * flipT;
      });

      bookGroup.position.y = Math.sin(time * 0.5) * 0.03;
      bookGroup.rotation.z = Math.sin(time * 0.3) * 0.008;

      renderer.render(scene, camera);
    };
    animate();

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
      for (const dispose of sceneRef.current!.disposables) dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nationality, nationalityCode, trips]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const totalFlippable = 1 + sceneRef.current.pages.length;

    for (let flipIdx = 0; flipIdx < totalFlippable; flipIdx++) {
      pageTargets.current[flipIdx] = flipIdx <= currentPage ? Math.PI * 0.95 : 0;
    }
  }, [currentPage]);
}

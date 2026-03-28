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
  backCover: THREE.Group;
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
  const mousePos = useRef({ x: 0, y: 0 });
  const smoothMouse = useRef({ x: 0, y: 0 });

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
    const pageGeo = trackGeometry(new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS, 1, 1, 1));
    const coverGeo = trackGeometry(new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3));

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

    // ── Cached blank page textures (identical every call — create once) ──
    const blankPageCanvas = createBlankPageTexture("right");   // right side (back cover inner)
    const blankPageCanvasLeft = createBlankPageTexture("left"); // left side (last page back, cover inner fallback)

    // ── Dust particles ──
    const DUST_COUNT = 80;
    const dustPositions = new Float32Array(DUST_COUNT * 3);
    const dustVelocities = new Float32Array(DUST_COUNT * 3);
    const dustSizes = new Float32Array(DUST_COUNT);
    for (let dustIdx = 0; dustIdx < DUST_COUNT; dustIdx++) {
      dustPositions[dustIdx * 3] = (Math.random() - 0.5) * 6;
      dustPositions[dustIdx * 3 + 1] = (Math.random() - 0.5) * 4;
      dustPositions[dustIdx * 3 + 2] = (Math.random() - 0.5) * 4;
      dustVelocities[dustIdx * 3] = (Math.random() - 0.5) * 0.002;
      dustVelocities[dustIdx * 3 + 1] = 0.001 + Math.random() * 0.003;
      dustVelocities[dustIdx * 3 + 2] = (Math.random() - 0.5) * 0.001;
      dustSizes[dustIdx] = 1.5 + Math.random() * 2.5;
    }
    const dustGeo = trackGeometry(new THREE.BufferGeometry());
    dustGeo.setAttribute("position", new THREE.BufferAttribute(dustPositions, 3));
    dustGeo.setAttribute("size", new THREE.BufferAttribute(dustSizes, 1));
    const dustMat = trackMaterial(new THREE.PointsMaterial({
      color: 0xdaa520,
      size: 0.02,
      transparent: true,
      opacity: 0.35,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    }));
    const dustPoints = new THREE.Points(dustGeo, dustMat);
    scene.add(dustPoints);

    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    // (Spine mesh removed — it protruded past page surfaces in z causing a visible strip;
    //  the binding gutter effect is now handled by the gradient shadow in page textures.)

    // Back cover (flippable group — same pivot convention as coverGroup)
    // Exterior shows on the left when folded → "left" rounding
    const backCoverOuterTex = trackTexture(new THREE.CanvasTexture(createPassportBackTexture(passportColor, "left")));
    backCoverOuterTex.colorSpace = THREE.SRGBColorSpace;
    const backCoverInnerTex = trackTexture(new THREE.CanvasTexture(blankPageCanvas));
    backCoverInnerTex.colorSpace = THREE.SRGBColorSpace;

    const backCoverMesh = new THREE.Mesh(coverGeo, [
      leatherSideMat, leatherSideMat, leatherSideMat, leatherSideMat,
      // +Z face: visible when unflipped (right side) = interior/blank page
      trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: backCoverInnerTex,
        transparent: true,
        alphaTest: 0.1,
      })),
      // -Z face: visible when folded to left = exterior texture
      trackMaterial(new THREE.MeshPhysicalMaterial({
        map: backCoverOuterTex,
        roughness: 0.7,
        metalness: 0.05,
        bumpMap: leatherBumpTexture,
        bumpScale: 0.008,
        clearcoat: 0.3,
        clearcoatRoughness: 0.6,
        transparent: true,
        alphaTest: 0.1,
      })),
    ]);
    backCoverMesh.position.set(PAGE_WIDTH / 2, 0, 0);

    const backCoverGroup = new THREE.Group();
    backCoverGroup.position.set(0, 0, 0);
    backCoverGroup.add(backCoverMesh);
    bookGroup.add(backCoverGroup);

    // ── Pages ──
    const pages: THREE.Group[] = [];

    for (let pageIdx = 0; pageIdx < trips.length; pageIdx++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0, 0, 0);

      const pageResult = createPageTexture(trips[pageIdx], pageIdx, trips.length);
      // Back face of page N = left page when viewing trip N+1
      const pageNumber = 16 + pageIdx * 2 + 1;
      const backCanvas = pageIdx < trips.length - 1
        ? createVisaInfoTexture(trips[pageIdx + 1], pageNumber, "left")
        : blankPageCanvasLeft;

      const frontTexture = trackTexture(new THREE.CanvasTexture(pageResult.color));
      frontTexture.colorSpace = THREE.SRGBColorSpace;
      const backTexture = trackTexture(new THREE.CanvasTexture(backCanvas));
      backTexture.colorSpace = THREE.SRGBColorSpace;

      const frontPageMat = trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: frontTexture,
        clearcoat: 0.3,
        clearcoatRoughness: 0.35,
        transparent: true,
        alphaTest: 0.1,
      }));

      if (pageResult.clearcoatMap) {
        const clearcoatMapTexture = trackTexture(new THREE.CanvasTexture(pageResult.clearcoatMap));
        frontPageMat.clearcoatMap = clearcoatMapTexture;
      }

      const backPageMat = trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: backTexture,
        transparent: true,
        alphaTest: 0.1,
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
    coverGroup.position.set(0, 0, 0);

    const coverTexture = trackTexture(new THREE.CanvasTexture(
      createPassportCoverTexture(nationality, nationalityCode, passportColor)
    ));
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    const coverInnerCanvas = trips.length > 0
      ? createVisaInfoTexture(trips[0], 16, "left")
      : blankPageCanvasLeft;
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
        transparent: true,
        alphaTest: 0.1,
      })),
      trackMaterial(new THREE.MeshPhysicalMaterial({
        ...paperDefaults,
        map: coverBackTex,
        roughness: 0.85,
        transparent: true,
        alphaTest: 0.1,
      })),
    ]);
    coverMesh.position.set(PAGE_WIDTH / 2, 0, 0);
    coverMesh.castShadow = true;
    coverGroup.add(coverMesh);
    bookGroup.add(coverGroup);

    // ── Store original page vertex positions for curl deformation ──
    const pageOriginalPositions: Float32Array[] = [];
    const pageCurled: boolean[] = [];
    for (const pageGroup of pages) {
      const mesh = pageGroup.children[0] as THREE.Mesh;
      const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
      pageOriginalPositions.push(new Float32Array(posAttr.array));
      pageCurled.push(false);
      mesh.frustumCulled = false; // deformed vertices may escape bounding sphere
    }

    // ── Init angles ──
    const allFlippable = [coverGroup, ...pages, backCoverGroup];
    const flippableCount = allFlippable.length;
    pageCurrentAngles.current = allFlippable.map(() => 0);
    pageTargets.current = allFlippable.map(() => 0);

    sceneRef.current = { scene, camera, renderer, pages, cover: coverGroup, backCover: backCoverGroup, animationId: 0, disposables };


    // ── Animation loop ──
    let time = 0;
    const zStep = 0.01;
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      time += 0.01;

      allFlippable.forEach((group, index) => {
        const target = pageTargets.current[index];
        const current = pageCurrentAngles.current[index];
        const diff = target - current;
        // Ease-out: fast start, gentle landing
        const speed = Math.abs(diff) > 0.5 ? 0.18 : 0.12;
        pageCurrentAngles.current[index] += diff * speed;
        group.rotation.y = -pageCurrentAngles.current[index];
        // Z-ordering reverses when pages flip to the left side
        const flipT = Math.min(pageCurrentAngles.current[index] / (Math.PI * 0.95), 1);
        const closedZ = (flippableCount - 1 - index) * zStep;
        const openZ = index * zStep - flippableCount * zStep;
        group.position.z = closedZ * (1 - flipT) + openZ * flipT;
      });

      // ── Page curl deformation ──
      for (let pageIdx = 0; pageIdx < pages.length; pageIdx++) {
        const flipIdx = pageIdx + 1; // cover is index 0 in allFlippable
        const flipProgress = Math.min(pageCurrentAngles.current[flipIdx] / (Math.PI * 0.95), 1);
        const curlStrength = Math.sin(flipProgress * Math.PI); // peaks at mid-flip

        const mesh = pages[pageIdx].children[0] as THREE.Mesh;
        const posAttr = mesh.geometry.attributes.position as THREE.BufferAttribute;
        const original = pageOriginalPositions[pageIdx];
        const positions = posAttr.array as Float32Array;

        if (curlStrength < 0.01) {
          // Reset to flat if previously curled
          if (pageCurled[pageIdx]) {
            positions.set(original);
            posAttr.needsUpdate = true;
            pageCurled[pageIdx] = false;
          }
          continue;
        }

        for (let vertIdx = 0; vertIdx < positions.length; vertIdx += 3) {
          const origX = original[vertIdx];
          const origZ = original[vertIdx + 2];
          // normalizedX: 0 at spine, 1 at outer edge
          const normalizedX = (origX + PAGE_WIDTH / 2) / PAGE_WIDTH;
          // Smooth arc peaking at page center, scaled by curl strength
          const curlZ = curlStrength * Math.sin(normalizedX * Math.PI) * 0.18;
          positions[vertIdx + 2] = origZ + curlZ;
        }
        posAttr.needsUpdate = true;
        pageCurled[pageIdx] = true;
      }

      // ── Dust particle motion ──
      const dustPos = dustGeo.attributes.position as THREE.BufferAttribute;
      for (let dustIdx = 0; dustIdx < DUST_COUNT; dustIdx++) {
        const baseIdx = dustIdx * 3;
        dustPositions[baseIdx] += dustVelocities[baseIdx] + Math.sin(time * 0.3 + dustIdx) * 0.0005;
        dustPositions[baseIdx + 1] += dustVelocities[baseIdx + 1];
        dustPositions[baseIdx + 2] += dustVelocities[baseIdx + 2];
        // Wrap particles that drift out of bounds
        if (dustPositions[baseIdx + 1] > 2.5) {
          dustPositions[baseIdx + 1] = -2.5;
          dustPositions[baseIdx] = (Math.random() - 0.5) * 6;
        }
      }
      dustPos.needsUpdate = true;

      // ── Mouse parallax tilt ──
      smoothMouse.current.x += (mousePos.current.x - smoothMouse.current.x) * 0.05;
      smoothMouse.current.y += (mousePos.current.y - smoothMouse.current.y) * 0.05;
      const parallaxTiltY = smoothMouse.current.x * 0.25;
      const parallaxTiltX = smoothMouse.current.y * 0.12;

      bookGroup.position.y = Math.sin(time * 0.5) * 0.03;
      bookGroup.rotation.x = -0.4 + parallaxTiltX;
      bookGroup.rotation.y = parallaxTiltY;
      bookGroup.rotation.z = Math.sin(time * 0.3) * 0.008;

      // ── Dynamic light follows mouse for page glow ──
      mainLight.position.set(
        3 + smoothMouse.current.x * 2.5,
        6,
        4 + smoothMouse.current.y * 1.5
      );
      // Boost intensity when tilted (pages catch light at an angle)
      const tiltMagnitude = Math.sqrt(
        smoothMouse.current.x * smoothMouse.current.x +
        smoothMouse.current.y * smoothMouse.current.y
      );
      mainLight.intensity = 1.6 + tiltMagnitude * 0.8;
      rimLight.intensity = 0.3 + tiltMagnitude * 0.4;

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

    const handleMouseMove = (event: MouseEvent) => {
      // Normalize to -1..1 range
      mousePos.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      mousePos.current.y = (event.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(sceneRef.current!.animationId);
      for (const dispose of sceneRef.current!.disposables) dispose();
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nationality, nationalityCode, trips]);

  useEffect(() => {
    if (!sceneRef.current) return;
    const totalFlippable = pageTargets.current.length; // cover + pages + backCover

    for (let flipIdx = 0; flipIdx < totalFlippable; flipIdx++) {
      pageTargets.current[flipIdx] = flipIdx <= currentPage ? Math.PI * 0.95 : 0;
    }
  }, [currentPage]);
}

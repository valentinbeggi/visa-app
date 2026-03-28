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

    // ── Lighting ──
    scene.add(new THREE.AmbientLight(0xfff5e6, 0.7));

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

    // ── Book group ──
    const passportColor = PASSPORT_COLORS[nationalityCode] || PASSPORT_COLORS.DEFAULT;
    const bookGroup = new THREE.Group();
    bookGroup.rotation.x = -0.4;
    scene.add(bookGroup);

    // Spine
    const spineMat = new THREE.MeshStandardMaterial({ color: passportColor, roughness: 0.7, metalness: 0.1 });
    const spine = new THREE.Mesh(new THREE.BoxGeometry(0.06, PAGE_HEIGHT, 0.15), spineMat);
    bookGroup.add(spine);

    // Back cover
    const backTexture = new THREE.CanvasTexture(createPassportBackTexture(passportColor));
    const backCover = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3),
      new THREE.MeshStandardMaterial({ map: backTexture, roughness: 0.7, metalness: 0.1 })
    );
    backCover.position.set(PAGE_WIDTH / 2 + 0.03, 0, 0);
    bookGroup.add(backCover);

    // ── Pages ──
    const totalPages = trips.length + 1;
    const pages: THREE.Group[] = [];
    const pageSideMat = new THREE.MeshStandardMaterial({ color: 0xf5f0e0, roughness: 0.9 });

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      const pageGroup = new THREE.Group();
      pageGroup.position.set(0.03, 0, 0);

      const frontCanvas = pageIdx < trips.length
        ? createPageTexture(trips[pageIdx], pageIdx, trips.length)
        : createBlankPageTexture();
      const backCanvas = createBlankPageTexture();

      const materials = [
        pageSideMat, pageSideMat, pageSideMat, pageSideMat,
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(frontCanvas), roughness: 0.85, metalness: 0.0 }),
        new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(backCanvas), roughness: 0.85, metalness: 0.0 }),
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
    const coverBackTex = new THREE.CanvasTexture(createBlankPageTexture());
    const coverSideMat = new THREE.MeshStandardMaterial({ color: passportColor, roughness: 0.7 });

    const coverMesh = new THREE.Mesh(
      new THREE.BoxGeometry(PAGE_WIDTH, PAGE_HEIGHT, PAGE_THICKNESS * 3),
      [
        coverSideMat, coverSideMat, coverSideMat, coverSideMat,
        new THREE.MeshStandardMaterial({ map: coverTexture, roughness: 0.65, metalness: 0.15 }),
        new THREE.MeshStandardMaterial({ map: coverBackTex, roughness: 0.85 }),
      ]
    );
    coverMesh.position.set(PAGE_WIDTH / 2, 0, 0);
    coverMesh.castShadow = true;
    coverGroup.add(coverMesh);
    bookGroup.add(coverGroup);

    // ── Init angles ──
    const allFlippable = [coverGroup, ...pages];
    pageCurrentAngles.current = allFlippable.map(() => 0);
    pageTargets.current = allFlippable.map(() => 0);

    sceneRef.current = { scene, camera, renderer, pages, cover: coverGroup, backCover, animationId: 0 };

    // ── Animation loop ──
    let time = 0;
    const animate = () => {
      sceneRef.current!.animationId = requestAnimationFrame(animate);
      time += 0.01;

      allFlippable.forEach((group, index) => {
        const target = pageTargets.current[index];
        const current = pageCurrentAngles.current[index];
        pageCurrentAngles.current[index] += (target - current) * 0.08;
        group.rotation.y = -pageCurrentAngles.current[index];
        group.position.z = index * 0.003 - pageCurrentAngles.current[index] * 0.002;
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
      renderer.dispose();
      container.removeChild(renderer.domElement);
    };
  }, [nationality, nationalityCode, trips]);

  // ── Flip pages when currentPage changes ──
  useEffect(() => {
    if (!sceneRef.current) return;
    const totalFlippable = 1 + sceneRef.current.pages.length;

    for (let flipIdx = 0; flipIdx < totalFlippable; flipIdx++) {
      pageTargets.current[flipIdx] = flipIdx <= currentPage ? Math.PI * 0.95 : 0;
    }
  }, [currentPage]);
}

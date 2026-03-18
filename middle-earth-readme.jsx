import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import * as THREE from "three";

// ═══════════════════════════════════════════════════════
// MIDDLE-EARTH README — React Three Fiber Experience
// ═══════════════════════════════════════════════════════

// Since we can't import @react-three/fiber directly, we'll build
// an immersive 3D experience using raw Three.js + React for the UI

// ── Color Palette: Ancient Middle-earth ──
const COLORS = {
  bg: "#080a0f",
  bgDeep: "#050710",
  stone: "#12151c",
  stoneLight: "#1a1e28",
  mithril: "#8ba4c7",
  mithrilBright: "#b8cce4",
  mithrilDim: "#5a7090",
  gold: "#c9952c",
  goldBright: "#f5d058",
  goldDim: "#8b7340",
  fire: "#c44100",
  fireBright: "#ff6a00",
  mordor: "#8b2500",
  gondor: "#FF2D20",
  shire: "#3178C6",
  rivendell: "#61DAFB",
  rohan: "#777BB4",
  lorien: "#c9a84c",
  moria: "#339933",
  textPrimary: "#c0caf5",
  textSecondary: "#6b88aa",
  textDim: "#3a4560",
};

// ── Three.js Scene Components ──

function ThreeCanvas({ scene: sceneType, height = 400 }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const frameRef = useRef(null);
  const objectsRef = useRef([]);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth;
    const h = height;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    sceneRef.current = scene;
    rendererRef.current = renderer;
    cameraRef.current = camera;

    // Build scene based on type
    if (sceneType === "ring") buildRingScene(scene, camera, objectsRef);
    else if (sceneType === "eye") buildEyeScene(scene, camera, objectsRef);
    else if (sceneType === "stars") buildStarsScene(scene, camera, objectsRef);
    else if (sceneType === "map") buildMapScene(scene, camera, objectsRef);

    const clock = new THREE.Clock();
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      objectsRef.current.forEach((obj) => {
        if (obj.update) obj.update(elapsed);
      });

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      camera.aspect = nw / h;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, h);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(frameRef.current);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      objectsRef.current = [];
    };
  }, [sceneType, height]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height, position: "relative", overflow: "hidden" }}
    />
  );
}

// ── SCENE: The One Ring ──
function buildRingScene(scene, camera, objectsRef) {
  camera.position.set(0, 1.5, 5);
  camera.lookAt(0, 0, 0);

  // Ambient
  scene.add(new THREE.AmbientLight(0x8ba4c7, 0.15));

  // Gold point light
  const goldLight = new THREE.PointLight(0xf5d058, 1.5, 15);
  goldLight.position.set(2, 3, 3);
  scene.add(goldLight);

  // Mithril rim light
  const rimLight = new THREE.PointLight(0x8ba4c7, 0.8, 12);
  rimLight.position.set(-3, 1, -2);
  scene.add(rimLight);

  // Fire from below
  const fireLight = new THREE.PointLight(0xc44100, 0.4, 10);
  fireLight.position.set(0, -3, 0);
  scene.add(fireLight);

  // The One Ring
  const ringGeo = new THREE.TorusGeometry(1.2, 0.18, 32, 100);
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0xc9952c,
    metalness: 0.95,
    roughness: 0.15,
    emissive: 0x4a3510,
    emissiveIntensity: 0.3,
  });
  const ring = new THREE.Mesh(ringGeo, ringMat);
  ring.rotation.x = Math.PI * 0.35;
  scene.add(ring);

  // Inner inscription glow ring
  const innerGeo = new THREE.TorusGeometry(1.2, 0.05, 16, 100);
  const innerMat = new THREE.MeshBasicMaterial({
    color: 0xf5d058,
    transparent: true,
    opacity: 0.3,
  });
  const innerRing = new THREE.Mesh(innerGeo, innerMat);
  innerRing.rotation.x = Math.PI * 0.35;
  scene.add(innerRing);

  // Star particles
  const starCount = 300;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * 20;
    starPos[i * 3 + 1] = (Math.random() - 0.5) * 15;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * 15 - 5;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x8ba4c7,
    size: 0.03,
    transparent: true,
    opacity: 0.6,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

  // Floating rune particles around ring
  const runeCount = 60;
  const runeGeo = new THREE.BufferGeometry();
  const runePos = new Float32Array(runeCount * 3);
  for (let i = 0; i < runeCount; i++) {
    const angle = (i / runeCount) * Math.PI * 2;
    const r = 1.8 + Math.random() * 0.8;
    runePos[i * 3] = Math.cos(angle) * r;
    runePos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    runePos[i * 3 + 2] = Math.sin(angle) * r;
  }
  runeGeo.setAttribute("position", new THREE.BufferAttribute(runePos, 3));
  const runeMat = new THREE.PointsMaterial({
    color: 0xf5d058,
    size: 0.04,
    transparent: true,
    opacity: 0.4,
  });
  const runes = new THREE.Points(runeGeo, runeMat);
  scene.add(runes);

  objectsRef.current.push({
    update: (t) => {
      ring.rotation.y = t * 0.3;
      ring.rotation.x = Math.PI * 0.35 + Math.sin(t * 0.5) * 0.08;
      ring.position.y = Math.sin(t * 0.7) * 0.15;
      innerRing.rotation.y = t * 0.3;
      innerRing.rotation.x = Math.PI * 0.35 + Math.sin(t * 0.5) * 0.08;
      innerRing.position.y = ring.position.y;
      innerMat.opacity = 0.2 + Math.sin(t * 2) * 0.15;
      runes.rotation.y = t * 0.15;
      runes.rotation.x = Math.sin(t * 0.3) * 0.1;
      stars.rotation.y = t * 0.01;
      fireLight.intensity = 0.3 + Math.sin(t * 3) * 0.15;
      goldLight.intensity = 1.2 + Math.sin(t * 1.5) * 0.3;
    },
  });
}

// ── SCENE: Eye of Sauron ──
function buildEyeScene(scene, camera, objectsRef) {
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x331100, 0.3));

  const fireLight1 = new THREE.PointLight(0xff6a00, 2, 10);
  fireLight1.position.set(0, 0, 2);
  scene.add(fireLight1);

  const fireLight2 = new THREE.PointLight(0xc44100, 1, 8);
  fireLight2.position.set(0, 2, 1);
  scene.add(fireLight2);

  // Outer eye shape (ellipsoid wireframe)
  const outerGeo = new THREE.SphereGeometry(2, 32, 16);
  outerGeo.scale(1, 0.4, 0.5);
  const outerMat = new THREE.MeshBasicMaterial({
    color: 0xc44100,
    wireframe: true,
    transparent: true,
    opacity: 0.15,
  });
  const outer = new THREE.Mesh(outerGeo, outerMat);
  scene.add(outer);

  // Mid eye
  const midGeo = new THREE.SphereGeometry(1.5, 24, 12);
  midGeo.scale(1, 0.35, 0.4);
  const midMat = new THREE.MeshBasicMaterial({
    color: 0xff6a00,
    wireframe: true,
    transparent: true,
    opacity: 0.2,
  });
  const mid = new THREE.Mesh(midGeo, midMat);
  scene.add(mid);

  // Pupil slit
  const pupilGeo = new THREE.CylinderGeometry(0.06, 0.06, 1.6, 8);
  const pupilMat = new THREE.MeshBasicMaterial({
    color: 0xff6a00,
    transparent: true,
    opacity: 0.7,
  });
  const pupil = new THREE.Mesh(pupilGeo, pupilMat);
  scene.add(pupil);

  // Core glow sphere
  const coreGeo = new THREE.SphereGeometry(0.15, 16, 16);
  const coreMat = new THREE.MeshBasicMaterial({
    color: 0xffaa00,
    transparent: true,
    opacity: 0.8,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  scene.add(core);

  // Fire particles
  const particleCount = 200;
  const pGeo = new THREE.BufferGeometry();
  const pPos = new Float32Array(particleCount * 3);
  const pVelocities = [];
  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = 0.5 + Math.random() * 2;
    pPos[i * 3] = Math.cos(angle) * r;
    pPos[i * 3 + 1] = (Math.random() - 0.5) * 1.5;
    pPos[i * 3 + 2] = (Math.random() - 0.5) * 1;
    pVelocities.push({
      angle,
      r,
      speed: 0.2 + Math.random() * 0.5,
      ySpeed: (Math.random() - 0.5) * 0.3,
    });
  }
  pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
  const pMat = new THREE.PointsMaterial({
    color: 0xff6a00,
    size: 0.04,
    transparent: true,
    opacity: 0.5,
  });
  const particles = new THREE.Points(pGeo, pMat);
  scene.add(particles);

  objectsRef.current.push({
    update: (t) => {
      outer.scale.y = 0.4 + Math.sin(t * 1.5) * 0.06;
      mid.scale.y = 0.35 + Math.sin(t * 1.5) * 0.05;
      pupil.scale.y = 1 + Math.sin(t * 1.5) * 0.15;
      pupil.scale.x = 1 + Math.sin(t * 0.7) * 0.3;
      coreMat.opacity = 0.6 + Math.sin(t * 3) * 0.3;
      outerMat.opacity = 0.1 + Math.sin(t * 2) * 0.08;
      fireLight1.intensity = 1.5 + Math.sin(t * 4) * 0.5;
      fireLight2.intensity = 0.8 + Math.sin(t * 3) * 0.4;

      const positions = particles.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        const v = pVelocities[i];
        const a = v.angle + t * v.speed;
        positions[i * 3] = Math.cos(a) * v.r;
        positions[i * 3 + 1] =
          Math.sin(t * v.ySpeed + i) * 0.6 * (v.r / 2);
        positions[i * 3 + 2] = Math.sin(a) * v.r * 0.3;
      }
      particles.geometry.attributes.position.needsUpdate = true;
    },
  });
}

// ── SCENE: Star field with Eärendil ──
function buildStarsScene(scene, camera, objectsRef) {
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  const starCount = 600;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(starCount * 3);
  const sizes = new Float32Array(starCount);
  for (let i = 0; i < starCount; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 25;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 12;
    pos[i * 3 + 2] = -Math.random() * 15;
    sizes[i] = Math.random() * 0.06 + 0.01;
  }
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const mat = new THREE.PointsMaterial({
    color: 0x8ba4c7,
    size: 0.04,
    transparent: true,
    opacity: 0.7,
  });
  const stars = new THREE.Points(geo, mat);
  scene.add(stars);

  // Eärendil — the brightest star
  const earendilGeo = new THREE.SphereGeometry(0.08, 16, 16);
  const earendilMat = new THREE.MeshBasicMaterial({
    color: 0xd4e4f7,
    transparent: true,
    opacity: 0.9,
  });
  const earendil = new THREE.Mesh(earendilGeo, earendilMat);
  earendil.position.set(0, 2, -3);
  scene.add(earendil);

  // Earendil glow
  const glowGeo = new THREE.SphereGeometry(0.3, 16, 16);
  const glowMat = new THREE.MeshBasicMaterial({
    color: 0x8ba4c7,
    transparent: true,
    opacity: 0.1,
  });
  const glow = new THREE.Mesh(glowGeo, glowMat);
  glow.position.copy(earendil.position);
  scene.add(glow);

  objectsRef.current.push({
    update: (t) => {
      stars.rotation.y = t * 0.005;
      stars.rotation.x = Math.sin(t * 0.1) * 0.01;
      earendilMat.opacity = 0.7 + Math.sin(t * 1.5) * 0.3;
      glowMat.opacity = 0.05 + Math.sin(t * 1.5) * 0.08;
      glow.scale.setScalar(1 + Math.sin(t * 1.5) * 0.3);
    },
  });
}

// ── SCENE: Map nodes (tech stack) ──
function buildMapScene(scene, camera, objectsRef) {
  camera.position.set(0, 0, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0x8ba4c7, 0.2));
  const mainLight = new THREE.PointLight(0xc9a84c, 0.8, 20);
  mainLight.position.set(0, 3, 5);
  scene.add(mainLight);

  const realms = [
    { name: "TS", color: 0x3178c6, x: -3, y: 1.5, z: 0, size: 0.35 },
    { name: "JS", color: 0xf7df1e, x: -2, y: -0.5, z: 0.5, size: 0.28 },
    { name: "React", color: 0x61dafb, x: -0.5, y: 1, z: -0.5, size: 0.38 },
    { name: "Node", color: 0x339933, x: 0.5, y: -1, z: 0, size: 0.3 },
    { name: "Laravel", color: 0xff2d20, x: 2, y: 0.5, z: -0.3, size: 0.32 },
    { name: "PHP", color: 0x777bb4, x: 1, y: -1.8, z: 0.2, size: 0.25 },
    { name: "Python", color: 0x3776ab, x: -1.5, y: -1.5, z: 0.3, size: 0.3 },
    { name: "HDL", color: 0xee3333, x: 3, y: -0.5, z: 0.5, size: 0.35 },
    { name: "CUDA", color: 0x76b900, x: 3.5, y: -1.8, z: 0, size: 0.28 },
    { name: "Java", color: 0xed8b00, x: -3.5, y: -1.5, z: 0, size: 0.25 },
    { name: "Git", color: 0xf05032, x: 0, y: -2.3, z: 0, size: 0.22 },
  ];

  const nodes = [];
  realms.forEach((r) => {
    const geo = new THREE.SphereGeometry(r.size, 16, 16);
    const mat = new THREE.MeshStandardMaterial({
      color: r.color,
      emissive: r.color,
      emissiveIntensity: 0.3,
      metalness: 0.5,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(r.x, r.y, r.z);
    scene.add(mesh);

    // Glow ring
    const ringGeo = new THREE.RingGeometry(r.size + 0.05, r.size + 0.1, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: r.color,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.position.copy(mesh.position);
    scene.add(ringMesh);

    nodes.push({ mesh, ringMesh, ringMat, origY: r.y, speed: 0.3 + Math.random() * 0.5 });
  });

  // Connection lines (roads between realms)
  const connections = [
    [0, 2], [0, 1], [1, 6], [2, 3], [3, 4], [4, 5], [4, 7], [7, 8],
    [6, 9], [3, 10], [1, 10], [5, 10],
  ];
  connections.forEach(([a, b]) => {
    const ra = realms[a], rb = realms[b];
    const points = [
      new THREE.Vector3(ra.x, ra.y, ra.z),
      new THREE.Vector3(rb.x, rb.y, rb.z),
    ];
    const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x3a4560,
      transparent: true,
      opacity: 0.2,
    });
    scene.add(new THREE.Line(lineGeo, lineMat));
  });

  // Traveling fellowship dot
  const travelerGeo = new THREE.SphereGeometry(0.06, 8, 8);
  const travelerMat = new THREE.MeshBasicMaterial({
    color: 0xc9a84c,
    transparent: true,
    opacity: 0.8,
  });
  const traveler = new THREE.Mesh(travelerGeo, travelerMat);
  scene.add(traveler);

  const path = [0, 2, 3, 4, 7, 8].map((i) => realms[i]);

  objectsRef.current.push({
    update: (t) => {
      nodes.forEach((n, i) => {
        n.mesh.position.y = n.origY + Math.sin(t * n.speed + i) * 0.08;
        n.mesh.rotation.y = t * 0.2;
        n.ringMesh.position.y = n.mesh.position.y;
        n.ringMat.opacity = 0.1 + Math.sin(t * 2 + i) * 0.08;
      });

      // Move traveler
      const totalT = (t * 0.3) % path.length;
      const idx = Math.floor(totalT);
      const frac = totalT - idx;
      const from = path[idx];
      const to = path[(idx + 1) % path.length];
      traveler.position.set(
        from.x + (to.x - from.x) * frac,
        from.y + (to.y - from.y) * frac + Math.sin(t * 3) * 0.05,
        from.z + (to.z - from.z) * frac
      );
    },
  });
}

// ═══════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════

function RuneText({ children, delay = 0 }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  return (
    <span
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(12px)",
        transition: "all 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        display: "inline-block",
      }}
    >
      {children}
    </span>
  );
}

function ElvishDivider() {
  return (
    <div style={{ textAlign: "center", padding: "32px 0", opacity: 0.4 }}>
      <span style={{ color: COLORS.mithrilDim, fontFamily: "serif", fontSize: 10, letterSpacing: 4 }}>
        ᚦ · ᚨ · ᚱ {"  "}
      </span>
      <span style={{
        display: "inline-block", width: 8, height: 8,
        border: `1px solid ${COLORS.mithril}`, transform: "rotate(45deg)",
        opacity: 0.5, position: "relative", top: -1,
      }} />
      <span style={{ color: COLORS.mithrilDim, fontFamily: "serif", fontSize: 10, letterSpacing: 4 }}>
        {"  "} ᛗ · ᚠ · ᛟ
      </span>
    </div>
  );
}

function SectionTitle({ children, rune = "§" }) {
  return (
    <h2
      style={{
        fontFamily: "'Cinzel', 'Palatino Linotype', Palatino, Georgia, serif",
        color: COLORS.gold,
        fontSize: 22,
        fontWeight: 700,
        letterSpacing: 3,
        textAlign: "center",
        margin: "0 0 8px 0",
        textTransform: "uppercase",
      }}
    >
      {children}
    </h2>
  );
}

function SectionSubtitle({ children }) {
  return (
    <p
      style={{
        fontFamily: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
        color: COLORS.textSecondary,
        fontSize: 14,
        fontStyle: "italic",
        textAlign: "center",
        margin: "0 0 28px 0",
        opacity: 0.7,
        letterSpacing: 1,
      }}
    >
      {children}
    </p>
  );
}

function TechBadge({ name, realm, color }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 14px",
        margin: 4,
        border: `1px solid ${hovered ? color : COLORS.textDim}`,
        borderRadius: 4,
        background: hovered ? `${color}10` : "transparent",
        cursor: "default",
        transition: "all 0.3s ease",
        transform: hovered ? "translateY(-2px)" : "none",
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: color,
          boxShadow: hovered ? `0 0 8px ${color}` : "none",
          transition: "box-shadow 0.3s",
        }}
      />
      <span style={{ color: COLORS.textPrimary, fontSize: 12, fontFamily: "monospace", fontWeight: 600 }}>
        {name}
      </span>
      <span style={{ color: COLORS.textSecondary, fontSize: 10, fontFamily: "'Cormorant Garamond', Georgia, serif", fontStyle: "italic" }}>
        {realm}
      </span>
    </div>
  );
}

function ProjectCard({ title, subtitle, repo, description, techs, rarity, rarityColor }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        flex: "1 1 280px",
        maxWidth: 340,
        border: `1px solid ${hovered ? COLORS.gold + "60" : COLORS.textDim + "40"}`,
        borderRadius: 8,
        padding: "24px 20px",
        background: hovered
          ? `linear-gradient(135deg, ${COLORS.stoneLight}, ${COLORS.stone})`
          : COLORS.stone,
        transition: "all 0.4s ease",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 8px 24px ${COLORS.bgDeep}` : "none",
        cursor: "default",
      }}
    >
      <div style={{ fontSize: 10, fontFamily: "monospace", color: rarityColor, letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" }}>
        ⚔ {rarity} Artefact
      </div>
      <h3 style={{ fontFamily: "'Cinzel', Georgia, serif", color: COLORS.textPrimary, fontSize: 16, margin: "0 0 4px 0", fontWeight: 700 }}>
        <a href={`https://github.com/abuel3ees/${repo}`} style={{ color: "inherit", textDecoration: "none" }}>{title}</a>
      </h3>
      <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: COLORS.goldDim, fontSize: 12, fontStyle: "italic", marginBottom: 12 }}>
        {subtitle}
      </div>
      <p style={{ color: COLORS.textSecondary, fontSize: 12, lineHeight: 1.6, margin: "0 0 14px 0", fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
        {description}
      </p>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        {techs.map((t) => (
          <span
            key={t}
            style={{
              fontSize: 10,
              fontFamily: "monospace",
              color: COLORS.mithril,
              border: `1px solid ${COLORS.textDim}40`,
              padding: "2px 8px",
              borderRadius: 3,
            }}
          >
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: `1px solid ${COLORS.textDim}20` }}>
      <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", color: COLORS.textSecondary, fontSize: 13 }}>{label}</span>
      <span style={{ fontFamily: "monospace", color: COLORS.textPrimary, fontSize: 12 }}>{value}</span>
    </div>
  );
}

// Animated beacon fire
function Beacon({ delay, label }) {
  const [lit, setLit] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setLit(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return (
    <div style={{ textAlign: "center", flex: 1 }}>
      <div
        style={{
          width: 12,
          height: 12,
          borderRadius: "50%",
          margin: "0 auto 6px",
          background: lit ? COLORS.fireBright : COLORS.textDim + "30",
          boxShadow: lit ? `0 0 12px ${COLORS.fireBright}, 0 0 24px ${COLORS.fire}` : "none",
          transition: "all 0.6s ease",
        }}
      />
      <div style={{ fontSize: 8, fontFamily: "'Cormorant Garamond', Georgia, serif", color: COLORS.textDim, letterSpacing: 1 }}>
        {label}
      </div>
    </div>
  );
}

function BeaconsOfGondor() {
  const beacons = [
    "Amon Dîn", "Eilenach", "Nardol", "Erelas", "Min-Rimmon", "Calenhad", "Halifirien"
  ];
  return (
    <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "20px 0" }}>
      {beacons.map((b, i) => (
        <Beacon key={b} label={b} delay={800 + i * 500} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════

export default function MiddleEarthReadme() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    // Load Cinzel + Cormorant Garamond
    const link = document.createElement("link");
    link.href = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400;1,600&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    const t = setTimeout(() => setLoaded(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${COLORS.bg} 0%, ${COLORS.bgDeep} 50%, ${COLORS.bg} 100%)`,
        color: COLORS.textPrimary,
        minHeight: "100vh",
        fontFamily: "'Cormorant Garamond', 'Palatino Linotype', Georgia, serif",
        opacity: loaded ? 1 : 0,
        transition: "opacity 1s ease",
      }}
    >
      {/* ═══ HERO: THE ONE RING ═══ */}
      <section style={{ position: "relative" }}>
        <ThreeCanvas scene="stars" height={120} />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
          }}
        >
          <div style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 11,
            color: COLORS.mithrilDim,
            letterSpacing: 8,
            textTransform: "uppercase",
            marginBottom: 4,
          }}>
            <RuneText delay={300}>✦ A Chronicle of Middle-Earth ✦</RuneText>
          </div>
        </div>
      </section>

      <section>
        <ThreeCanvas scene="ring" height={380} />
        <div style={{ textAlign: "center", marginTop: -40, position: "relative", zIndex: 2 }}>
          <h1 style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 42,
            fontWeight: 900,
            letterSpacing: 6,
            color: COLORS.textPrimary,
            margin: 0,
            textShadow: `0 0 40px ${COLORS.gold}20`,
          }}>
            <RuneText delay={200}>abuel3ees</RuneText>
          </h1>
          <p style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 14,
            color: COLORS.goldDim,
            letterSpacing: 6,
            textTransform: "uppercase",
            margin: "8px 0 0 0",
          }}>
            <RuneText delay={600}>Mithrandir of the Machine</RuneText>
          </p>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 15,
            fontStyle: "italic",
            color: COLORS.textSecondary,
            margin: "16px auto 0",
            maxWidth: 500,
            opacity: 0.6,
          }}>
            <RuneText delay={1000}>
              "One Repo to rule them all, One Repo to find them, One Repo to bring them all, and in the code bind them."
            </RuneText>
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>

        <ElvishDivider />

        {/* ═══ THE RED BOOK — About ═══ */}
        <section>
          <SectionTitle>📜 The Red Book of Westmarch</SectionTitle>
          <SectionSubtitle>"From the fires of the CPU and the ancient halls of Hardware, I emerged."</SectionSubtitle>

          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px" }}>
              {[
                ["🔭 The Quest", "Forging full-stack applications and computer architecture in the fires of Mount Compile."],
                ["🌱 The Ancient Arts", "Delving into GPU sorcery (CUDA) and silicon rune-craft (Verilog)."],
                ["👯 The Fellowship", "Seeking companions for open-source expeditions across web, algorithms, and systems."],
              ].map(([title, desc]) => (
                <div key={title} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontFamily: "'Cinzel', Georgia, serif", color: COLORS.mithril, fontSize: 14, margin: "0 0 4px 0", fontWeight: 700 }}>{title}</h4>
                  <p style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
            <div style={{ flex: "1 1 300px" }}>
              {[
                ["💬 Speak, Friend, and Enter", "Ask me of TypeScript, React, Laravel, or the sacred RISC-V scrolls."],
                ["⚡ A Tale of Legend", "I forged a 5-stage pipelined RISC-V processor from nothing but pure Verilog runes."],
                ["🎯 Current Campaign", "Mastering parallel computing and hardware-software co-design."],
              ].map(([title, desc]) => (
                <div key={title} style={{ marginBottom: 20 }}>
                  <h4 style={{ fontFamily: "'Cinzel', Georgia, serif", color: COLORS.mithril, fontSize: 14, margin: "0 0 4px 0", fontWeight: 700 }}>{title}</h4>
                  <p style={{ color: COLORS.textSecondary, fontSize: 13, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <ElvishDivider />

        {/* ═══ MAP — Tech Stack ═══ */}
        <section>
          <SectionTitle>🗡️ A Map of the Realms</SectionTitle>
          <SectionSubtitle>"Even the smallest person can change the course of the future."</SectionSubtitle>
        </section>
      </div>

      <ThreeCanvas scene="map" height={350} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <div style={{ marginBottom: 8, fontSize: 11, fontFamily: "'Cinzel', Georgia, serif", color: COLORS.goldDim, letterSpacing: 3, textTransform: "uppercase" }}>
            Tongues of the Elves &amp; Men
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
            <TechBadge name="TypeScript" realm="The Shire" color={COLORS.shire} />
            <TechBadge name="JavaScript" realm="Bree" color="#F7DF1E" />
            <TechBadge name="PHP" realm="Rohan" color={COLORS.rohan} />
            <TechBadge name="Java" realm="Isengard" color="#ED8B00" />
            <TechBadge name="Python" realm="Lothlórien" color="#3776AB" />
            <TechBadge name="Verilog" realm="Mordor" color="#EE3333" />
            <TechBadge name="CUDA" realm="Barad-dûr" color="#76B900" />
          </div>
          <div style={{ marginTop: 16, marginBottom: 8, fontSize: 11, fontFamily: "'Cinzel', Georgia, serif", color: COLORS.goldDim, letterSpacing: 3, textTransform: "uppercase" }}>
            Weapons Forged in Fire
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 4 }}>
            <TechBadge name="React" realm="Rivendell" color={COLORS.rivendell} />
            <TechBadge name="Laravel" realm="Gondor" color={COLORS.gondor} />
            <TechBadge name="Node.js" realm="Moria" color={COLORS.moria} />
            <TechBadge name="Git" realm="Palantíri" color="#F05032" />
          </div>
        </div>

        <ElvishDivider />

        {/* ═══ EYE OF SAURON — Stats ═══ */}
        <section>
          <SectionTitle>🔮 The Palantír</SectionTitle>
          <SectionSubtitle>Gaze into the seeing-stone and behold the chronicle of deeds...</SectionSubtitle>
        </section>
      </div>

      <ThreeCanvas scene="eye" height={280} />

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px" }}>
        <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginTop: 20 }}>
          <img
            src="https://github-readme-stats.vercel.app/api?username=abuel3ees&show_icons=true&hide_border=true&bg_color=0d0f14&title_color=c9a84c&icon_color=8ba4c7&text_color=6b88aa&ring_color=c9952c"
            alt="GitHub Stats"
            style={{ height: 170, borderRadius: 8 }}
          />
          <img
            src="https://github-readme-stats.vercel.app/api/top-langs/?username=abuel3ees&layout=compact&hide_border=true&bg_color=0d0f14&title_color=c9a84c&text_color=6b88aa"
            alt="Top Languages"
            style={{ height: 170, borderRadius: 8 }}
          />
        </div>

        <ElvishDivider />

        {/* ═══ GREAT WORKS — Projects ═══ */}
        <section>
          <SectionTitle>🏰 The Great Works of the Age</SectionTitle>
          <SectionSubtitle>"It's a dangerous business, going out your door..."</SectionSubtitle>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <ProjectCard
              title="The Iron Forge"
              subtitle="cpu"
              repo="cpu"
              description="A RISC-V 5-stage pipelined processor wrought in the fires of Mount Doom. As Glamdring was to Gandalf, so is this processor to me."
              techs={["Verilog", "RISC-V", "Hardware"]}
              rarity="Legendary"
              rarityColor={COLORS.mordor}
            />
            <ProjectCard
              title="The White Council's Tome"
              subtitle="GRC-APP-REACT"
              repo="GRC-APP-REACT"
              description="Governance, Risk & Compliance — the wisdom of the Wise, codified into a web application. Elrond would approve."
              techs={["TypeScript", "React"]}
              rarity="Epic"
              rarityColor={COLORS.shire}
            />
            <ProjectCard
              title="The Library of Minas Tirith"
              subtitle="laravel-cms"
              repo="laravel-cms"
              description="A content management system worthy of the great libraries where Gandalf uncovered the truth of the One Ring."
              techs={["PHP", "Laravel"]}
              rarity="Epic"
              rarityColor={COLORS.gondor}
            />
            <ProjectCard
              title="The Paths of the Dead"
              subtitle="vrp-app"
              repo="vrp-app"
              description="A Vehicle Routing Problem solver. Like Aragorn leading the Dead, this finds the path when all hope seems lost."
              techs={["Python", "Algorithms"]}
              rarity="Rare"
              rarityColor="#3776AB"
            />
            <ProjectCard
              title="The Music of the Ainur"
              subtitle="smoodify"
              repo="smoodify"
              description="A mood-based music experience. Before the world was made, there was the Music — this channels that primal creative force."
              techs={["TypeScript", "Web"]}
              rarity="Rare"
              rarityColor={COLORS.lorien}
            />
            <ProjectCard
              title="The Next Age"
              subtitle="???"
              repo=""
              description="Something stirs in the deep. A new artefact is being forged in secret..."
              techs={["Coming Soon"]}
              rarity="Mythic"
              rarityColor={COLORS.mithril}
            />
          </div>
        </section>

        <ElvishDivider />

        {/* ═══ CHARACTER SHEET ═══ */}
        <section>
          <SectionTitle>📖 The Appendices</SectionTitle>
          <SectionSubtitle>Character sheet of the Fellowship member</SectionSubtitle>

          <div style={{
            maxWidth: 480,
            margin: "0 auto",
            border: `1px solid ${COLORS.textDim}40`,
            borderRadius: 8,
            padding: 24,
            background: COLORS.stone,
          }}>
            <StatRow label="Class" value="Software-Wright, Istari Order" />
            <StatRow label="Alignment" value="Chaotic Good" />
            <StatRow label="Primary Weapon" value="TypeScript + React" />
            <StatRow label="Secondary Weapon" value="Verilog + CUDA" />
            <StatRow label="Mount" value="Git (swift & reliable)" />
            <StatRow label="Special Ability" value="Forge pipelined processors" />
            <StatRow label="Weakness" value="Off-by-one errors in Moria" />
            <StatRow label="Quest Status" value="⚔️ Active" />
          </div>
        </section>

        <ElvishDivider />

        {/* ═══ BEACONS — Contact ═══ */}
        <section>
          <SectionTitle>🔥 The Beacons of Gondor</SectionTitle>
          <SectionSubtitle>The beacons are lit! Will you answer the call?</SectionSubtitle>

          <BeaconsOfGondor />

          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {[
              { label: "LinkedIn", icon: "🏰", href: "https://linkedin.com/in/abuel3ees", color: "#0A66C2" },
              { label: "𝕏", icon: "🔮", href: "https://x.com/abuel3ees", color: COLORS.textPrimary },
              { label: "Email", icon: "🦅", href: "mailto:your@email.com", color: COLORS.mordor },
              { label: "Portfolio", icon: "📜", href: "https://abuel3ees.dev", color: COLORS.gold },
            ].map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "8px 18px",
                  border: `1px solid ${COLORS.textDim}60`,
                  borderRadius: 6,
                  color: COLORS.textPrimary,
                  textDecoration: "none",
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: 12,
                  letterSpacing: 1,
                  transition: "all 0.3s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = link.color;
                  e.currentTarget.style.background = `${link.color}15`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = COLORS.textDim + "60";
                  e.currentTarget.style.background = "transparent";
                }}
              >
                {link.icon} {link.label}
              </a>
            ))}
          </div>
        </section>

        <ElvishDivider />

        {/* ═══ GREY HAVENS — Footer ═══ */}
        <section style={{ textAlign: "center", paddingBottom: 60 }}>
          <p style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontSize: 16,
            fontStyle: "italic",
            color: COLORS.textSecondary,
            opacity: 0.5,
            margin: "0 0 12px 0",
          }}>
            "I will not say: do not weep; for not all tears are an evil."
          </p>
          <div style={{
            width: 200,
            height: 1,
            background: `linear-gradient(90deg, transparent, ${COLORS.goldDim}, transparent)`,
            margin: "16px auto",
            opacity: 0.3,
          }} />
          <p style={{
            fontFamily: "'Cinzel', Georgia, serif",
            fontSize: 12,
            color: COLORS.goldDim,
            letterSpacing: 6,
            textTransform: "uppercase",
            opacity: 0.4,
          }}>
            Namárië
          </p>
          <p style={{
            fontSize: 10,
            color: COLORS.textDim,
            marginTop: 20,
            fontFamily: "monospace",
            opacity: 0.4,
          }}>
            Crafted with the devotion of a Hobbit writing in the Red Book · May your builds never fail
          </p>
        </section>
      </div>
    </div>
  );
}

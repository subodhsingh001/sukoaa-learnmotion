"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Stars, Html } from "@react-three/drei";
import * as THREE from "three";
import { planets } from "@/data/solar-system";

// Educational scene units: intentionally not astronomical scale.
const orbitRadii = [1.8, 2.55, 3.35, 4.15, 5.15, 6.25, 7.3, 8.35];
const planetRadii = [0.11, 0.17, 0.18, 0.14, 0.4, 0.34, 0.27, 0.27];
const initialCamera = new THREE.Vector3(0, 15, 19);

// Deterministic, offline-friendly stylized surface textures. No network images needed.
function makeTexture(index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const colors = ["#aaa29a", "#dfb77b", "#2474bd", "#a9543e", "#bd906f", "#d6b878", "#84cdd2", "#315cbb"];
  ctx.fillStyle = colors[index];
  ctx.fillRect(0, 0, 512, 256);
  let seed = 8123 + index * 241;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  if ([1, 4, 5, 6, 7].includes(index)) {
    for (let y = 0; y < 256; y += 3 + Math.floor(random() * 9)) {
      ctx.fillStyle = `rgba(${index === 7 ? "205,225,255" : "255,240,208"},${0.04 + random() * 0.22})`;
      ctx.fillRect(0, y, 512, 2 + random() * 12);
    }
    if (index === 4) { ctx.fillStyle = "#a85f43"; ctx.beginPath(); ctx.ellipse(375, 170, 34, 14, -0.15, 0, Math.PI * 2); ctx.fill(); }
  } else {
    for (let i = 0; i < 220; i++) {
      ctx.fillStyle = index === 2 ? (random() > 0.38 ? "#4ca66b" : "#f3f6ff") : `rgba(45,35,29,${0.05 + random() * 0.3})`;
      ctx.beginPath(); ctx.ellipse(random() * 512, random() * 256, 2 + random() * 19, 1 + random() * 9, random(), 0, Math.PI * 2); ctx.fill();
    }
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function OrbitPath({ radius }: { radius: number }) {
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(
    Array.from({ length: 129 }, (_, i) => new THREE.Vector3(Math.cos(i / 128 * Math.PI * 2) * radius, 0, Math.sin(i / 128 * Math.PI * 2) * radius))
  ), [radius]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return <lineLoop geometry={geometry}><lineBasicMaterial color="#67749d" transparent opacity={0.36} /></lineLoop>;
}

type SceneProps = { selected: string; onSelect: (id: string) => void; playing: boolean; speed: number; resetVersion: number; focusVersion: number; viewResetVersion: number; moveVersion: number; moveDirection: string };

function PlanetMesh({ index, selected, onSelect, playing, speed, resetVersion, positions }: SceneProps & { index: number; positions: React.MutableRefObject<THREE.Vector3[]> }) {
  const planet = planets[index];
  const pivot = useRef<THREE.Group>(null);
  const angle = useRef(index * 0.8);
  const lastReset = useRef(resetVersion);
  const texture = useMemo(() => makeTexture(index), [index]);
  useEffect(() => () => texture?.dispose(), [texture]);
  useFrame((_, delta) => {
    if (lastReset.current !== resetVersion) { angle.current = index * 0.8; lastReset.current = resetVersion; }
    if (playing) angle.current += Math.min(delta, 0.08) * speed * (4 / planet.period);
    if (pivot.current) {
      pivot.current.rotation.y = angle.current;
      positions.current[index].set(Math.cos(angle.current) * orbitRadii[index], 0, -Math.sin(angle.current) * orbitRadii[index]);
    }
  });
  return <>
    <OrbitPath radius={orbitRadii[index]} />
    <group ref={pivot}><group position={[orbitRadii[index], 0, 0]}>
      <mesh onClick={e => { e.stopPropagation(); onSelect(planet.id); }} onPointerOver={() => { document.body.style.cursor = "pointer"; }} onPointerOut={() => { document.body.style.cursor = "auto"; }}>
        <sphereGeometry args={[planetRadii[index], 32, 24]} />
        <meshStandardMaterial map={texture} color={planet.color} roughness={0.85} emissive={selected === planet.id ? planet.color : "#000000"} emissiveIntensity={selected === planet.id ? 0.17 : 0} />
      </mesh>
      {planet.id === "saturn" && <mesh rotation={[-Math.PI / 2.8, 0, 0]}><ringGeometry args={[0.45, 0.67, 64]} /><meshBasicMaterial color="#d9c69b" side={THREE.DoubleSide} transparent opacity={0.78} /></mesh>}
      {selected === planet.id && <Html position={[0, planetRadii[index] + 0.3, 0]} center distanceFactor={12}><span className="solar3d-label">{planet.name}</span></Html>}
    </group></group>
  </>;
}

function CameraFocus({ selected, focusVersion, positions, controlsRef }: Pick<SceneProps, "selected" | "focusVersion"> & { positions: React.MutableRefObject<THREE.Vector3[]>; controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const focus = useRef(false);

  const desiredTarget = useRef(new THREE.Vector3());
  const desiredCamera = useRef(initialCamera.clone());
  const mounted = useRef(false);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    const index = planets.findIndex(p => p.id === selected);
    if (index < 0) return;
    desiredTarget.current.copy(positions.current[index]);
    const offset = new THREE.Vector3(1.8, 1.35, 2.5).normalize().multiplyScalar(index >= 4 ? 3.8 : 2.4);
    desiredCamera.current.copy(desiredTarget.current).add(offset);
    focus.current = true;
  }, [selected, focusVersion, positions]);
  useFrame((_, delta) => {
    if (!focus.current || !controlsRef.current) return;
    const t = 1 - Math.exp(-3.6 * Math.min(delta, 0.1));
    camera.position.lerp(desiredCamera.current, t);
    controlsRef.current.target.lerp(desiredTarget.current, t);
    controlsRef.current.update();
    if (camera.position.distanceTo(desiredCamera.current) < 0.03 && controlsRef.current.target.distanceTo(desiredTarget.current) < 0.03) focus.current = false;

  });
  return null;
}

function CameraPositionControls({ viewResetVersion, moveVersion, moveDirection, controlsRef }: Pick<SceneProps, "viewResetVersion" | "moveVersion" | "moveDirection"> & { controlsRef: React.RefObject<any> }) {
  const { camera } = useThree();
  const resetMounted = useRef(false);
  const moveMounted = useRef(false);
  useEffect(() => {
    if (!resetMounted.current) { resetMounted.current = true; return; }
    camera.position.copy(initialCamera);
    camera.lookAt(0, 0, 0);
    if (controlsRef.current) {
      controlsRef.current.target.set(0, 0, 0);
      controlsRef.current.update();
    }
  }, [viewResetVersion, camera, controlsRef]);
  useEffect(() => {
    if (!moveMounted.current) { moveMounted.current = true; return; }
    if (!controlsRef.current) return;
    const target = controlsRef.current.target as THREE.Vector3;
    const right = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 0).normalize();
    const up = new THREE.Vector3().setFromMatrixColumn(camera.matrix, 1).normalize();
    const shift = new THREE.Vector3();
    if (moveDirection === "left") shift.copy(right).multiplyScalar(-1.2);
    if (moveDirection === "right") shift.copy(right).multiplyScalar(1.2);
    if (moveDirection === "up") shift.copy(up).multiplyScalar(1.2);
    if (moveDirection === "down") shift.copy(up).multiplyScalar(-1.2);
    camera.position.add(shift);
    target.add(shift);
    controlsRef.current.update();
  }, [moveVersion, moveDirection, camera, controlsRef]);
  return null;
}

function SceneContent(props: SceneProps) {
  const controlsRef = useRef<any>(null);
  const positions = useRef(planets.map((_, i) => new THREE.Vector3(orbitRadii[i] * Math.cos(i * 0.8), 0, -orbitRadii[i] * Math.sin(i * 0.8))));
  return <>
    <color attach="background" args={["#090e20"]} />
    <ambientLight intensity={0.72} />
    <pointLight position={[0, 0, 0]} intensity={90} distance={30} decay={2} />
    <Stars radius={65} depth={40} count={900} factor={3} saturation={0} fade speed={0} />
    <mesh><sphereGeometry args={[0.85, 40, 32]} /><meshBasicMaterial color="#ffbd42" /></mesh>
    {planets.map((planet, index) => <PlanetMesh key={planet.id} index={index} {...props} positions={positions} />)}
    <OrbitControls ref={controlsRef} makeDefault enablePan minDistance={1.2} maxDistance={35} maxPolarAngle={Math.PI * 0.85} />
    <CameraPositionControls viewResetVersion={props.viewResetVersion} moveVersion={props.moveVersion} moveDirection={props.moveDirection} controlsRef={controlsRef} />
    <CameraFocus selected={props.selected} focusVersion={props.focusVersion} positions={positions} controlsRef={controlsRef} />
  </>;
}

export default function SolarSystemScene(props: SceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  useEffect(() => {
    const update = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch { /* Browser may restrict fullscreen; normal view remains available. */ }
  }
  return <div ref={containerRef} className="solar3d-canvas" aria-label="Interactive three-dimensional Solar System illustration, not to scale">
    <Canvas camera={{ position: [0, 15, 19], fov: 48 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: "low-power" }}>
      <SceneContent {...props} />
    </Canvas>
    <div className="solar3d-toolbar"><button type="button" onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}>{isFullscreen ? "Exit full screen" : "⛶ Full screen"}</button></div>
    <div className="solar3d-hint">Drag to rotate · Scroll/pinch to zoom · Select a planet to focus</div>
    <span className="space-disclaimer">Stylized procedural textures · distances, sizes and speeds not to scale</span>
  </div>;
}

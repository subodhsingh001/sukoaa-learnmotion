"use client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import AtomicScene from "@/components/lesson/AtomicScene";
import GeometryScene, { type Shape } from "@/components/lesson/GeometryScene";
import type { Scene } from "@/lib/storyboard";

export default function Scene3D({ scene, playing }: { scene: Scene; playing: boolean }) {
  const p = scene.params as Record<string, number | string | boolean>;
  return (
    <Canvas camera={{ position: [0, 1.2, 7], fov: 48 }} dpr={[1, 1.5]} style={{ position: "absolute", inset: 0 }}>
      <ambientLight intensity={1.25} /><directionalLight position={[5, 8, 6]} intensity={2.2} />
      <group position={[0, 0.2, 0]} scale={0.9}>
        {scene.template === "atom3d"
          ? <AtomicScene protons={Number(p.protons) || 6} neutrons={Number(p.neutrons) || 6} electrons={Number(p.electrons) || 6} playing={playing} />
          : <GeometryScene shape={(p.shape as Shape) || "cube"} rotate={playing} wireframe={!!p.wireframe} />}
      </group>
      <OrbitControls enableZoom={false} enablePan={false} />
    </Canvas>
  );
}

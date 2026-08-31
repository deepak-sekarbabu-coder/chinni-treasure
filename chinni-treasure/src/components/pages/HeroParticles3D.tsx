"use client";

import { useRef, useMemo, useEffect, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

/* ── Particle count — keep low for mobile perf ── */
const PARTICLE_COUNT = 120;

/* ── Gold palette matching the brand ── */
const GOLD_COLORS = [
  new THREE.Color("#d4af37"), // gold
  new THREE.Color("#c5a028"), // darker gold
  new THREE.Color("#e8c84a"), // light gold
  new THREE.Color("#b8941f"), // deep gold
  new THREE.Color("#f0d878"), // pale gold
];

interface ParticleData {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  scale: number;
  color: THREE.Color;
  opacity: number;
  phase: number;
  speed: number;
}

function Particles({ reducedMotion }: { reducedMotion: boolean }) {
  const meshRef = useRef<THREE.InstancedMesh>(null!);
  const mouseRef = useRef({ x: 0, y: 0 });
  const { viewport } = useThree();

  /* ── Generate particle data once ── */
  const particles = useMemo<ParticleData[]>(() => {
    const arr: ParticleData[] = [];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const spread = viewport.width * 0.7;
      arr.push({
        position: new THREE.Vector3(
          (Math.random() - 0.5) * spread * 2,
          (Math.random() - 0.5) * viewport.height * 1.5,
          (Math.random() - 0.5) * 3 - 1,
        ),
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.002,
          0.003 + Math.random() * 0.006,
          0,
        ),
        scale: 0.01 + Math.random() * 0.025,
        color: GOLD_COLORS[Math.floor(Math.random() * GOLD_COLORS.length)],
        opacity: 0.15 + Math.random() * 0.45,
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.7,
      });
    }
    return arr;
  }, [viewport.width, viewport.height]);

  /* ── Track mouse for parallax ── */
  const handlePointerMove = useCallback((e: PointerEvent) => {
    mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouseRef.current.y = -(e.clientY / window.innerHeight) * 2 + 1;
  }, []);

  useEffect(() => {
    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, [handlePointerMove]);

  /* ── Animation loop ── */
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const t = clock.getElapsedTime();
    const dummy = new THREE.Object3D();
    const colorAttr = meshRef.current.instanceColor;
    const halfH = viewport.height * 0.85;
    const halfW = viewport.width * 0.85;

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const p = particles[i];
      const speedMult = reducedMotion ? 0.15 : 1;

      /* Float upward */
      p.position.y += p.velocity.y * speedMult * p.speed;
      p.position.x += Math.sin(t * 0.3 * p.speed + p.phase) * 0.001 * speedMult;

      /* Subtle mouse parallax */
      p.position.x += (mouseRef.current.x * 0.02 - p.position.x * 0.0001) * speedMult;
      p.position.y += (mouseRef.current.y * 0.01 - p.position.y * 0.0001) * speedMult;

      /* Wrap around when out of view */
      if (p.position.y > halfH + 1) {
        p.position.y = -halfH - 1;
        p.position.x = (Math.random() - 0.5) * halfW * 2;
      }
      if (p.position.x > halfW + 2) p.position.x = -halfW - 2;
      if (p.position.x < -halfW - 2) p.position.x = halfW + 2;

      /* Gentle pulse */
      const pulse = 0.7 + Math.sin(t * 0.8 + p.phase) * 0.3;

      dummy.position.copy(p.position);
      dummy.scale.setScalar(p.scale * pulse);
      dummy.updateMatrix();
      meshRef.current.setMatrixAt(i, dummy.matrix);

      if (colorAttr) {
        colorAttr.setXYZ(i, p.color.r, p.color.g, p.color.b);
      }
    }

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (colorAttr) colorAttr.needsUpdate = true;
  });

  /* ── Heart-shaped geometry ── */
  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    const x = 0;
    const y = 0;
    shape.moveTo(x, y + 0.5);
    shape.bezierCurveTo(x, y + 0.5, x - 0.1, y, x - 0.5, y);
    shape.bezierCurveTo(x - 1.0, y, x - 1.0, y + 0.7, x - 1.0, y + 0.7);
    shape.bezierCurveTo(x - 1.0, y + 1.1, x - 0.6, y + 1.54, x, y + 1.9);
    shape.bezierCurveTo(x + 0.6, y + 1.54, x + 1.0, y + 1.1, x + 1.0, y + 0.7);
    shape.bezierCurveTo(x + 1.0, y + 0.7, x + 1.0, y, x + 0.5, y);
    shape.bezierCurveTo(x + 0.25, y, x, y + 0.5, x, y + 0.5);
    const geom = new THREE.ShapeGeometry(shape);
    geom.center();
    geom.scale(0.8, -0.8, 1);
    return geom;
  }, []);
  const material = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    [],
  );

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, PARTICLE_COUNT]}
      frustumCulled={false}
    >
      {/* Instance colors are set in the animation loop */}
    </instancedMesh>
  );
}

/* ── Floating ring accent ── */
function GoldRing({ reducedMotion }: { reducedMotion: boolean }) {
  const ringRef = useRef<THREE.Mesh>(null!);

  useFrame(({ clock }) => {
    if (!ringRef.current) return;
    const t = clock.getElapsedTime();
    const speed = reducedMotion ? 0.1 : 1;
    ringRef.current.rotation.x = Math.sin(t * 0.15 * speed) * 0.3 + 0.5;
    ringRef.current.rotation.y = t * 0.08 * speed;
    ringRef.current.rotation.z = Math.cos(t * 0.1 * speed) * 0.15;
  });

  return (
    <mesh ref={ringRef} position={[2.5, 0.5, -2]}>
      <torusGeometry args={[0.8, 0.015, 16, 64]} />
      <meshBasicMaterial
        color="#d4af37"
        transparent
        opacity={0.12}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Main exported component ── */
export default function HeroParticles3D() {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);

    /* Suppress the THREE.Clock deprecation warning from @react-three/fiber
       internals (R3F issue #3741 — waiting for upstream fix). */
    const origWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (typeof args[0] === "string" && args[0].includes("THREE.Clock")) return;
      origWarn(...args);
    };

    /* Lazy-mount: wait until hero is in viewport */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );

    const hero = document.querySelector(".hero");
    if (hero) observer.observe(hero);
    else setVisible(true); // fallback: mount immediately

    return () => {
      console.warn = origWarn;
      observer.disconnect();
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none",
      }}
      aria-hidden="true"
    >
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
        }}
        style={{ background: "transparent" }}
      >
        <Particles reducedMotion={reducedMotion} />
        <GoldRing reducedMotion={reducedMotion} />
      </Canvas>
    </div>
  );
}

import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Grid, Line, PerspectiveCamera, Points, PointMaterial } from "@react-three/drei";

function FloatingParticles() {
  const ref = useRef(null);
  const positions = useMemo(() => {
    const values = new Float32Array(2200 * 3);

    for (let index = 0; index < values.length; index += 3) {
      values[index] = (Math.random() - 0.5) * 120;
      values[index + 1] = Math.random() * 48;
      values[index + 2] = (Math.random() - 0.5) * 120;
    }

    return values;
  }, []);

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = state.clock.elapsedTime * 0.03;
    ref.current.position.y = Math.sin(state.clock.elapsedTime * 0.14) * 2;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial color="#5eead4" transparent opacity={0.9} size={0.18} sizeAttenuation depthWrite={false} />
    </Points>
  );
}

function ScanLines() {
  const group = useRef(null);

  useFrame((state) => {
    if (!group.current) return;
    group.current.position.z = Math.sin(state.clock.elapsedTime * 0.28) * 8;
    group.current.rotation.z = state.clock.elapsedTime * 0.02;
  });

  return (
    <group ref={group} position={[0, 10, -30]}>
      <Line points={[[-36, 0, 0], [36, 0, 0]]} color="#38bdf8" lineWidth={1} transparent opacity={0.35} />
      <Line points={[[0, -18, 0], [0, 18, 0]]} color="#5eead4" lineWidth={1} transparent opacity={0.35} />
    </group>
  );
}

function Scene() {
  return (
    <>
      <color attach="background" args={["#020712"]} />
      <fog attach="fog" args={["#020712", 22, 85]} />
      <PerspectiveCamera makeDefault position={[0, 9, 24]} fov={54} />
      <ambientLight intensity={0.45} />
      <pointLight position={[0, 16, 8]} intensity={38} color="#38bdf8" distance={100} />
      <pointLight position={[-20, 10, -10]} intensity={28} color="#5eead4" distance={80} />
      <pointLight position={[18, 6, 16]} intensity={20} color="#f97316" distance={70} />
      <Grid
        position={[0, -8, 0]}
        args={[180, 180]}
        cellSize={2}
        cellThickness={0.6}
        cellColor="#0ea5e9"
        sectionSize={12}
        sectionThickness={1.6}
        sectionColor="#5eead4"
        fadeDistance={85}
        fadeStrength={1.5}
        infiniteGrid
      />
      <mesh position={[0, -7.2, -25]} rotation={[-Math.PI / 2.6, 0, 0]}>
        <planeGeometry args={[160, 60]} />
        <meshBasicMaterial color="#0a1020" transparent opacity={0.3} />
      </mesh>
      <mesh position={[0, 10, -35]}>
        <torusGeometry args={[22, 0.08, 20, 120]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.18} />
      </mesh>
      <FloatingParticles />
      <ScanLines />
    </>
  );
}

function ParticleBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 opacity-80">
      <Canvas dpr={[1, 1.8]}>
        <Scene />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_28%),radial-gradient(circle_at_bottom,rgba(94,234,212,0.08),transparent_32%)]" />
    </div>
  );
}

export default ParticleBackground;

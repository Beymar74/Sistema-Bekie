"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { useSpring, animated } from "@react-spring/three";
import * as THREE from "three";

// Coordenadas 3D para una celda (r, c)
const getCellCoords = (row: number, col: number): [number, number, number] => {
  const x = (col - 2) * 1.1;
  const z = (row - 2) * 1.1;
  return [x, 0.05, z];
};

// Puntos de la ruta animada de A(4,0) a B(0,4)
const ROUTE_POINTS: [number, number, number][] = [
  getCellCoords(4, 0), // Inicio A
  getCellCoords(4, 1),
  getCellCoords(4, 2),
  getCellCoords(4, 3),
  getCellCoords(4, 4), // Esquina inferior derecha
  getCellCoords(3, 4),
  getCellCoords(2, 4),
  getCellCoords(1, 4),
  getCellCoords(0, 4), // Meta B
];

// Componente para animar la superficie del Paso 1 (4 hojas uniéndose)
function SurfaceAnimation() {
  const tlRef = useRef<THREE.Group>(null);
  const trRef = useRef<THREE.Group>(null);
  const blRef = useRef<THREE.Group>(null);
  const brRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const cycle = (elapsed % 4.5) / 4.5; // Ciclo de 4.5s

    let mergeFactor = 0;
    if (cycle < 0.35) {
      // Uniendo (0 a 1)
      mergeFactor = cycle / 0.35;
    } else if (cycle < 0.7) {
      // Unidas (1)
      mergeFactor = 1;
    } else if (cycle < 0.9) {
      // Separando (1 a 0)
      mergeFactor = 1 - (cycle - 0.7) / 0.2;
    } else {
      // Separadas (0)
      mergeFactor = 0;
    }

    const startDist = 1.6;
    const endDist = 0.55;
    const currentDist = startDist - (startDist - endDist) * mergeFactor;

    if (tlRef.current) tlRef.current.position.set(-currentDist, 0.02, -currentDist);
    if (trRef.current) trRef.current.position.set(currentDist, 0.02, -currentDist);
    if (blRef.current) blRef.current.position.set(-currentDist, 0.02, currentDist);
    if (brRef.current) brRef.current.position.set(currentDist, 0.02, currentDist);
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Hoja 1: Superior Izquierda */}
      <group ref={tlRef}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.08, 0.04, 1.08]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} />
        </mesh>
      </group>
      {/* Hoja 2: Superior Derecha */}
      <group ref={trRef}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.08, 0.04, 1.08]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
      </group>
      {/* Hoja 3: Inferior Izquierda */}
      <group ref={blRef}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.08, 0.04, 1.08]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.3} />
        </mesh>
      </group>
      {/* Hoja 4: Inferior Derecha */}
      <group ref={brRef}>
        <mesh receiveShadow castShadow>
          <boxGeometry args={[1.08, 0.04, 1.08]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

// Componente para animar la regla midiendo del Paso 2
function MeasureAnimation() {
  const rulerRef = useRef<THREE.Group>(null);
  const [activeLines, setActiveLines] = useState<boolean[]>(new Array(8).fill(false));

  useFrame((state) => {
    const elapsed = state.clock.getElapsedTime();
    const cycle = (elapsed % 5.5) / 5.5; // Ciclo de 5.5s

    let rx = 0;
    let rz = 0;
    let ry = 0;

    // Control de líneas y posición de la regla
    if (cycle < 0.45) {
      // Barrido horizontal (Dibuja líneas verticales de izquierda a derecha)
      const t = cycle / 0.45;
      rx = -2.2 + t * 4.4;
      rz = 0;
      ry = 0; // Regla vertical
    } else if (cycle < 0.5) {
      // Rotación
      const t = (cycle - 0.45) / 0.05;
      rx = 2.2 - t * 2.2;
      rz = -2.2 * t;
      ry = t * (Math.PI / 2);
    } else if (cycle < 0.9) {
      // Barrido vertical (Dibuja líneas horizontales de arriba hacia abajo)
      const t = (cycle - 0.5) / 0.4;
      rx = 0;
      rz = -2.2 + t * 4.4;
      ry = Math.PI / 2; // Regla horizontal
    } else {
      // Regreso / Ocultar
      rx = 0;
      rz = 2.2 + ((cycle - 0.9) / 0.1) * 2;
      ry = Math.PI / 2;
    }

    if (rulerRef.current) {
      rulerRef.current.position.set(rx, 0.08, rz);
      rulerRef.current.rotation.y = ry;
    }

    // Activar líneas en base al progreso del ciclo
    const nextLines = [...activeLines];
    // Verticales (Barrido horizontal de X)
    nextLines[0] = cycle > 0.09; // X = -1.65
    nextLines[1] = cycle > 0.18; // X = -0.55
    nextLines[2] = cycle > 0.27; // X = 0.55
    nextLines[3] = cycle > 0.36; // X = 1.65
    // Horizontales (Barrido vertical de Z)
    nextLines[4] = cycle > 0.58; // Z = -1.65
    nextLines[5] = cycle > 0.66; // Z = -0.55
    nextLines[6] = cycle > 0.74; // Z = 0.55
    nextLines[7] = cycle > 0.82; // Z = 1.65

    // Reiniciar líneas en el final del ciclo
    if (cycle > 0.95) {
      nextLines.fill(false);
    }

    // Evitar renderizado infinito si no hay cambio de estado
    if (JSON.stringify(nextLines) !== JSON.stringify(activeLines)) {
      setActiveLines(nextLines);
    }
  });

  return (
    <group position={[0, -0.2, 0]}>
      {/* Cartulina base */}
      <mesh receiveShadow>
        <boxGeometry args={[2.2, 0.03, 2.2]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>

      {/* Líneas dibujadas verticalmente (X fijas, Z de -1.1 a 1.1) */}
      {activeLines[0] && <Line points={[[-1.65, 0.02, -1.1], [-1.65, 0.02, 1.1]]} color="#64748b" lineWidth={1} />}
      {activeLines[1] && <Line points={[[-0.55, 0.02, -1.1], [-0.55, 0.02, 1.1]]} color="#64748b" lineWidth={1} />}
      {activeLines[2] && <Line points={[[0.55, 0.02, -1.1], [0.55, 0.02, 1.1]]} color="#64748b" lineWidth={1} />}
      {activeLines[3] && <Line points={[[1.65, 0.02, -1.1], [1.65, 0.02, 1.1]]} color="#64748b" lineWidth={1} />}

      {/* Líneas dibujadas horizontalmente (Z fijas, X de -1.1 a 1.1) */}
      {activeLines[4] && <Line points={[[-1.1, 0.02, -1.65], [1.1, 0.02, -1.65]]} color="#64748b" lineWidth={1} />}
      {activeLines[5] && <Line points={[[-1.1, 0.02, -0.55], [1.1, 0.02, -0.55]]} color="#64748b" lineWidth={1} />}
      {activeLines[6] && <Line points={[[-1.1, 0.02, 0.55], [1.1, 0.02, 0.55]]} color="#64748b" lineWidth={1} />}
      {activeLines[7] && <Line points={[[-1.1, 0.02, 1.65], [1.1, 0.02, 1.65]]} color="#64748b" lineWidth={1} />}

      {/* Modelo 3D de la Regla amarilla */}
      <group ref={rulerRef}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.08, 0.05, 2.3]} />
          <meshStandardMaterial color="#eab308" metalness={0.2} roughness={0.3} />
        </mesh>
        {/* Lápiz / Marcador */}
        <mesh position={[0, 0.15, 0]}>
          <cylinderGeometry args={[0.02, 0.01, 0.15, 8]} />
          <meshStandardMaterial color="#0284c7" />
        </mesh>
      </group>
    </group>
  );
}

// Componente para el seguidor de ruta (Trail animado)
function PathFollower({ active }: { active: boolean }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  useFrame((state, delta) => {
    if (!active || !sphereRef.current) return;

    timeRef.current += delta * 0.8;
    const t = (timeRef.current % 1.5) / 1.5; // Normalizado de 0 a 1

    const totalPoints = ROUTE_POINTS.length;
    const scaledT = t * (totalPoints - 1);
    const index = Math.floor(scaledT);
    const nextIndex = Math.min(index + 1, totalPoints - 1);
    const factor = scaledT - index;

    const pA = ROUTE_POINTS[index];
    const pB = ROUTE_POINTS[nextIndex];

    sphereRef.current.position.set(
      pA[0] + (pB[0] - pA[0]) * factor,
      pA[1] + 0.15 + (pB[1] - pA[1]) * factor,
      pA[2] + (pB[2] - pA[2]) * factor
    );
  });

  if (!active) return null;

  return (
    <mesh ref={sphereRef} castShadow>
      <sphereGeometry args={[0.15, 16, 16]} />
      <meshBasicMaterial color="#06b6d4" toneMapped={false} />
    </mesh>
  );
}

// Componente individual para cada celda de la grilla
interface TileProps {
  row: number;
  col: number;
  isStart: boolean;
  isGoal: boolean;
  isObstacle: boolean;
  showStart: boolean;
  showGoal: boolean;
  showObstacles: boolean;
}

function Tile({
  row,
  col,
  isStart,
  isGoal,
  isObstacle,
  showStart,
  showGoal,
  showObstacles,
}: TileProps) {
  const [hovered, setHovered] = useState(false);
  const coords = getCellCoords(row, col);

  // Animación de aparición (stagger por fila/columna)
  const delayTime = (row * 5 + col) * 50;

  // Resorte para la aparición inicial de la celda y elevación por hover
  const tileSpring = useSpring({
    from: { scale: [0, 0, 0], position: [coords[0], -0.5, coords[2]] },
    to: {
      scale: [1, 1, 1],
      position: hovered
        ? [coords[0], 0.15, coords[2]]
        : [coords[0], 0.02, coords[2]],
    },
    delay: delayTime,
    config: { mass: 1, tension: 180, friction: 12 },
  });

  // Resorte específico para obstáculos (shake al aparecer + color)
  const obstacleSpring = useSpring({
    from: { color: "#ef4444", shakeX: 0 },
    to: async (next) => {
      if (showObstacles && isObstacle) {
        // Efecto shake (sacudida lateral en X)
        await next({ shakeX: 0.1, config: { duration: 50 } });
        await next({ shakeX: -0.1, config: { duration: 50 } });
        await next({ shakeX: 0.08, config: { duration: 50 } });
        await next({ shakeX: -0.08, config: { duration: 50 } });
        await next({ shakeX: 0, config: { duration: 50 } });
        // Cambiar color de rojo a gris oscuro
        await next({ color: "#4b5563" });
      }
    },
    config: { tension: 120, friction: 14 },
  });

  // Resorte continuo para la escala del punto de Inicio A (pulso)
  const startPulseSpring = useSpring({
    from: { pulseScale: 1 },
    to: async (next) => {
      while (showStart && isStart) {
        await next({ pulseScale: 1.18, config: { duration: 700 } });
        await next({ pulseScale: 1.0, config: { duration: 700 } });
      }
    },
  });

  // Resorte continuo para el punto de Meta B (pulso verde)
  const goalPulseSpring = useSpring({
    from: { pulseScale: 1, color: "#10b981" },
    to: async (next) => {
      while (showGoal && isGoal) {
        await next({ pulseScale: 1.22, color: "#34d399", config: { duration: 600 } });
        await next({ pulseScale: 1.0, color: "#059669", config: { duration: 600 } });
      }
    },
  });

  // Determinar el color de la celda según su estado
  let color = "#e5e7eb"; // Gris claro por defecto
  const opacity = 0.9;

  if (showStart && isStart) {
    color = "#a5f3fc"; // Cyan claro
  } else if (showGoal && isGoal) {
    color = "#a7f3d0"; // Verde esmeralda claro
  } else if (showObstacles && isObstacle) {
    color = "#4b5563"; // Gris oscuro
  }

  return (
    <animated.group
      position={tileSpring.position as any}
      scale={tileSpring.scale as any}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* IMPORTANTE: Sólo recibe sombras, no las proyecta para evitar el bug de sombras negras en el plano */}
      <mesh receiveShadow>
        <boxGeometry args={[1.0, 0.1, 1.0]} />
        <animated.meshStandardMaterial
          color={
            showObstacles && isObstacle
              ? (obstacleSpring.color as any)
              : color
          }
          roughness={0.4}
          metalness={0.1}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Indicador visual de INICIO (A) */}
      {showStart && isStart && (
        <animated.mesh
          position={[0, 0.08, 0]}
          scale={startPulseSpring.pulseScale.to((s) => [s, 1, s]) as any}
          castShadow
        >
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <meshStandardMaterial color="#0891b2" roughness={0.1} emissive="#0891b2" emissiveIntensity={0.2} />
        </animated.mesh>
      )}

      {/* Indicador visual de META (B) */}
      {showGoal && isGoal && (
        <animated.mesh
          position={[0, 0.08, 0]}
          scale={goalPulseSpring.pulseScale.to((s) => [s, 1, s]) as any}
          castShadow
        >
          <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
          <animated.meshStandardMaterial color={goalPulseSpring.color as any} roughness={0.1} emissive="#10b981" emissiveIntensity={0.2} />
        </animated.mesh>
      )}
    </animated.group>
  );
}

// Contenedor principal de la Grilla 3D
interface GridVisualProps {
  mode?: "surface" | "measure" | "grid" | "start" | "goal" | "obstacles" | null;
}

export default function GridVisual({ mode = "grid" }: GridVisualProps) {
  const [isClient, setIsClient] = useState(false);
  const obstacles = [[1, 2], [2, 3]]; // Obstáculos fijos (fila 1 col 2, fila 2 col 3)

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="w-full h-[220px] bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center text-xs font-mono text-gray-400">
        Cargando simulador 3D...
      </div>
    );
  }

  // Mapear los flags visuales según el modo
  const showStart = mode === "start" || mode === "goal" || mode === "obstacles";
  const showGoal = mode === "goal" || mode === "obstacles";
  const showObstacles = mode === "obstacles";
  const showLine = showStart && showGoal;

  const linePoints = ROUTE_POINTS.map((p) => new THREE.Vector3(p[0], p[1] + 0.08, p[2]));

  return (
    <div className="w-full h-[260px] relative bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-inner">
      <Canvas
        shadows
        camera={{ position: [0, 4.5, 4.5], fov: 50 }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0f172a"]} />

        {/* Luces del escenario */}
        <ambientLight intensity={0.5} />
        <directionalLight
          position={[4, 8, 3]}
          intensity={1.3}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-camera-near={0.5}
          shadow-camera-far={25}
          shadow-camera-left={-3.5}
          shadow-camera-right={3.5}
          shadow-camera-top={3.5}
          shadow-camera-bottom={-3.5}
          shadow-bias={-0.0005}
        />
        <pointLight position={getCellCoords(4, 0)} intensity={showStart ? 2 : 0} color="#06b6d4" distance={2} />
        <pointLight position={getCellCoords(0, 4)} intensity={showGoal ? 2 : 0} color="#10b981" distance={2} />

        {/* Animación del Paso 1: Preparar la superficie */}
        {mode === "surface" && <SurfaceAnimation />}

        {/* Animación del Paso 2: Medir las celdas */}
        {mode === "measure" && <MeasureAnimation />}

        {/* Grilla 3D Completa para los Pasos 3-6 y Checklist */}
        {mode !== "surface" && mode !== "measure" && (
          <group position={[0, -0.2, 0]}>
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 5 }).map((_, col) => {
                const isStart = row === 4 && col === 0;
                const isGoal = row === 0 && col === 4;
                const isObs = obstacles.some(([r, c]) => r === row && c === col);

                return (
                  <Tile
                    key={`${row}-${col}`}
                    row={row}
                    col={col}
                    isStart={isStart}
                    isGoal={isGoal}
                    isObstacle={isObs}
                    showStart={showStart}
                    showGoal={showGoal}
                    showObstacles={showObstacles}
                  />
                );
              })
            )}

            {/* Línea de ruta animada */}
            {showLine && (
              <Line
                points={linePoints}
                color="#06b6d4"
                lineWidth={2}
                opacity={0.6}
                transparent
              />
            )}

            {/* Seguidor de ruta con trail */}
            <PathFollower active={showLine} />
          </group>
        )}

        {/* Controles interactivos de cámara */}
        <OrbitControls
          enableZoom={false}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.4}
          minAzimuthAngle={-Math.PI / 4}
          maxAzimuthAngle={Math.PI / 4}
        />
      </Canvas>

      {/* Etiquetas / Leyenda en pantalla */}
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 rounded-lg p-2.5 flex flex-col gap-1.5 text-[10px] font-mono text-slate-300 pointer-events-none select-none">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-cyan-500 border border-cyan-400" />
          <span>Inicio (A)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 border border-emerald-400" />
          <span>Meta (B)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-sm bg-gray-600 border border-gray-500" />
          <span>Obstáculo</span>
        </div>
      </div>

      <div className="absolute bottom-3 right-3 text-[10px] font-mono text-slate-400 pointer-events-none select-none">
        Usa clic + arrastrar para rotar
      </div>
    </div>
  );
}

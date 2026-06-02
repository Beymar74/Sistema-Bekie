"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import IntermediateLevelEditor from "@/components/IntermediateLevelEditor";
import AdvancedLevelEditor from "@/components/AdvancedLevelEditor";
import {
  ArrowLeft,
  CheckCircle,
  Cpu,
  Play,
  Plus,
  StopCircle,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import {
  LEVEL_EDITORS as BASIC_LEVEL_EDITORS,
  type BlockType,
  type Dir,
  type LevelKey,
  type PaletteBlock,
} from "@/lib/levels";
import {
  LEVEL_2_STAGES,
  LEVEL_EDITORS as INTERMEDIATE_LEVEL_EDITORS,
} from "@/lib/nivel-1";
import {
  LEVEL_3_STAGES,
  LEVEL_EDITORS as ADVANCED_LEVEL_EDITORS,
} from "@/lib/nivel-2";

/* ─ Types ─ */
type SimStatus = "idle" | "running" | "success" | "collision" | "oob" | "incomplete";

interface Block extends PaletteBlock {
  id: string;
  steps?: number;
}

interface SensorState {
  front: number | null;
  left: number | null;
  right: number | null;
  obstacleAhead: boolean;
}

interface SimState {
  pos: [number, number];
  dir: Dir;
  visited: Set<string>;
  status: SimStatus;
  message: string;
  sensors: SensorState;
}

/* ─ Helpers ─ */
const DIR_DELTA: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];
const DIR_ARROW = ["→", "↓", "←", "↑"];
const MAX_STEPS = 220;
const MAX_LOOPS = 10;
const SENSOR_STEP_CM = 20;
let uid = 0;
const genId = () => `b_${++uid}`;
const formatDistance = (value: number | null) => (value === null ? "--" : `${value} cm`);

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelKey = ((params.level as string) || "1") as LevelKey;
  const isIntermediate = levelKey === "2";
  const isAdvanced = levelKey === "3";

  // ── Nivel 3: delegate entirely to AdvancedLevelEditor ──
  if (isAdvanced) {
    const missionIndexRaw = Number(searchParams.get("mission") ?? "1");
    const missionIndex = Math.min(
      LEVEL_3_STAGES.length,
      Math.max(1, Number.isNaN(missionIndexRaw) ? 1 : missionIndexRaw)
    );
    const stage = LEVEL_3_STAGES[missionIndex - 1] ?? LEVEL_3_STAGES[0];
    const config = { ...ADVANCED_LEVEL_EDITORS["3"], grid: stage.grid };
    return (
      <AdvancedLevelEditor
        key={missionIndex}
        config={config}
        stage={stage}
        missionIndex={missionIndex}
      />
    );
  }

  const config = isIntermediate
    ? INTERMEDIATE_LEVEL_EDITORS["2"]
    : BASIC_LEVEL_EDITORS["1"];

  const missionIndexRaw = Number(searchParams.get("mission") ?? "1");
  const missionIndex = Math.min(
    LEVEL_2_STAGES.length,
    Math.max(1, Number.isNaN(missionIndexRaw) ? 1 : missionIndexRaw)
  );
  const stage = LEVEL_2_STAGES[missionIndex - 1] ?? LEVEL_2_STAGES[0];

  const grid = config.grid;
  const gridSize = grid.length;

  const initialProgram = useCallback(
    (): Block[] => [{ ...config.palette[0], id: genId() }],
    [config.palette]
  );
  const initialSim = useCallback(
    (): SimState => ({
      pos: [...config.start] as [number, number],
      dir: config.startDir,
      visited: new Set([`${config.start[0]}-${config.start[1]}`]),
      status: "idle",
      message: "",
      sensors: { front: null, left: null, right: null, obstacleAhead: false },
    }),
    [config.start, config.startDir]
  );

  const [program, setProgram] = useState<Block[]>(() => initialProgram());
  const [sim, setSim] = useState<SimState>(() => initialSim());
  const [canSend, setCanSend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const normalizeStepCount = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.min(9, Math.floor(value)));
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const addBlock = (def: PaletteBlock) => {
    if (program.length >= 25) return;
    setProgram((current) => [
      ...current,
      { ...def, id: genId(), ...(def.type === "FORWARD" ? { steps: 1 } : {}) },
    ]);
  };

  const removeBlock = (id: string) => {
    setProgram((current) =>
      current.filter((block, index) => index === 0 || block.id !== id)
    );
  };

  const syncState = useCallback(
    (
      pos: [number, number],
      dir: Dir,
      visited: Set<string>,
      sensors: SensorState,
      status: SimStatus,
      message = ""
    ) => {
      setSim({ pos, dir, visited: new Set(visited), sensors: { ...sensors }, status, message });
    },
    []
  );

  const measureDistance = useCallback(
    (pos: [number, number], dir: Dir) => {
      const [dr, dc] = DIR_DELTA[dir];
      let row = pos[0];
      let col = pos[1];
      let cells = 0;
      while (true) {
        row += dr;
        col += dc;
        cells += 1;
        if (row < 0 || row >= gridSize || col < 0 || col >= grid[row]?.length)
          return cells * SENSOR_STEP_CM;
        if (grid[row][col] === 1) return cells * SENSOR_STEP_CM;
      }
    },
    [grid, gridSize]
  );

  const readSensors = useCallback(
    (pos: [number, number], dir: Dir): SensorState => {
      const front = measureDistance(pos, dir);
      return {
        front,
        left: measureDistance(pos, ((dir + 3) % 4) as Dir),
        right: measureDistance(pos, ((dir + 1) % 4) as Dir),
        obstacleAhead: front <= SENSOR_STEP_CM,
      };
    },
    [measureDistance]
  );

  const getCell = useCallback(
    (pos: [number, number]) => grid[pos[0]]?.[pos[1]] ?? null,
    [grid]
  );

  const runSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    let pos: [number, number] = [...config.start] as [number, number];
    let dir: Dir = config.startDir;
    const visited = new Set<string>([`${pos[0]}-${pos[1]}`]);
    let sensors = readSensors(pos, dir);
    let stepIdx = 0;
    let stepCount = 0;
    let loopCount = 0;
    let loopStartIndex: number | null = null;
    let skipAfterBranch = 0;
    const blocks = program.filter((block) => block.type !== "INIT");
    const stopIndex = blocks.findIndex((block) => block.type === "STOP");
    const loopExitIndex = stopIndex !== -1 ? stopIndex : blocks.length;

    setCanSend(false);
    syncState(pos, dir, visited, sensors, "running", "Simulacion iniciada.");

    const finish = (
      status: Exclude<SimStatus, "running" | "idle">,
      message: string
    ) => {
      syncState(pos, dir, visited, sensors, status, message);
      if (status === "success") setCanSend(true);
    };

    const moveRobot = (
      movementDir: Dir,
      collisionMessage: string,
      oobMessage: string
    ) => {
      const [dr, dc] = DIR_DELTA[movementDir];
      const next: [number, number] = [pos[0] + dr, pos[1] + dc];
      const cell = getCell(next);
      if (cell === null) {
        pos = next;
        visited.add(`${next[0]}-${next[1]}`);
        sensors = readSensors(pos, dir);
        finish("oob", oobMessage);
        return true;
      }
      if (cell === 1) {
        pos = next;
        visited.add(`${next[0]}-${next[1]}`);
        sensors = readSensors(pos, dir);
        finish("collision", collisionMessage);
        return true;
      }
      pos = next;
      visited.add(`${next[0]}-${next[1]}`);
      sensors = readSensors(pos, dir);
      return false;
    };

    const scheduleNext = () => {
      timerRef.current = setTimeout(tick, 450);
    };

    const tick = () => {
      if (stepCount++ > MAX_STEPS) {
        finish("incomplete", "La simulacion alcanzo el limite de pasos permitidos.");
        return;
      }

      if (stepIdx >= blocks.length) {
        if (getCell(pos) === 3) {
          finish("success", "Simulacion exitosa. El robot llego a la meta.");
        } else {
          finish("incomplete", "El robot no llego a la meta. Revisa tu programa.");
        }
        return;
      }

      const block = blocks[stepIdx++];

      switch (block.type as BlockType) {
        case "FORWARD":
          for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
            if (
              moveRobot(
                dir,
                "El robot choco con un obstaculo.",
                "El robot salio del area permitida."
              )
            )
              return;
          }
          break;
        case "BACKWARD": {
          const backDir = ((dir + 2) % 4) as Dir;
          for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
            if (
              moveRobot(
                backDir,
                "El robot choco retrocediendo.",
                "El robot salio del area al retroceder."
              )
            )
              return;
          }
          break;
        }
        case "TURN_RIGHT":
          dir = ((dir + 1) % 4) as Dir;
          sensors = readSensors(pos, dir);
          break;
        case "TURN_LEFT":
          dir = ((dir + 3) % 4) as Dir;
          sensors = readSensors(pos, dir);
          break;
        case "WAIT":
          break;
        case "STOP":
          if (getCell(pos) === 3) {
            finish("success", "Simulacion exitosa. El robot llego a la meta y se detuvo.");
          } else {
            finish("incomplete", "El robot se detuvo antes de llegar a la meta.");
          }
          return;
        case "IF_OBS_ELSE": {
          if (sensors.obstacleAhead) {
            skipAfterBranch = 1;
            syncState(pos, dir, visited, sensors, "running", "Obstaculo detectado: rama obstaculo.");
          } else {
            stepIdx += 1;
            syncState(pos, dir, visited, sensors, "running", "Sin obstaculo: rama libre.");
          }
          scheduleNext();
          return;
        }
        case "WHILE_GOAL": {
          loopStartIndex = stepIdx;
          syncState(pos, dir, visited, sensors, "running", "Bucle activo: se repetira hasta llegar a la meta.");
          scheduleNext();
          return;
        }
        case "INIT":
          break;
        default:
          break;
      }

      if (getCell(pos) === 3 && (stopIndex === -1 || stepIdx <= stopIndex)) {
        syncState(pos, dir, visited, sensors, "running", "");
      } else if (getCell(pos) === 3) {
        finish("success", "Simulacion exitosa. El robot llego a la meta.");
        return;
      }

      if (skipAfterBranch > 0) {
        stepIdx += skipAfterBranch;
        skipAfterBranch = 0;
      }

      if (
        loopStartIndex !== null &&
        stepIdx === loopExitIndex &&
        getCell(pos) !== 3
      ) {
        loopCount += 1;
        if (loopCount > MAX_LOOPS) {
          finish("incomplete", "El bucle alcanzo el limite sin llegar a la meta.");
          return;
        }
        stepIdx = loopStartIndex;
        syncState(pos, dir, visited, sensors, "running", `Repitiendo bucle (${loopCount}/${MAX_LOOPS}).`);
        scheduleNext();
        return;
      }

      if (stepIdx >= blocks.length) {
        if (getCell(pos) === 3) {
          finish("success", "Simulacion exitosa. El robot llego a la meta.");
          return;
        }
        if (loopStartIndex !== null) {
          loopCount += 1;
          if (loopCount > MAX_LOOPS) {
            finish("incomplete", "El bucle alcanzo el limite sin llegar a la meta.");
            return;
          }
          stepIdx = loopStartIndex;
          syncState(pos, dir, visited, sensors, "running", `Repitiendo bucle (${loopCount}/${MAX_LOOPS}).`);
          scheduleNext();
          return;
        }
        finish("incomplete", "El robot no llego a la meta. Revisa tu programa.");
        return;
      }

      syncState(pos, dir, visited, sensors, "running", "");
      scheduleNext();
    };

    scheduleNext();
  }, [config.start, config.startDir, getCell, normalizeStepCount, program, readSensors, syncState]);

  const stopSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim((current) => ({ ...current, status: "idle", message: "" }));
  };

  const clearProgram = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setProgram(initialProgram());
    setSim(initialSim());
    setCanSend(false);
  };

  // ── Nivel 2: delegate to IntermediateLevelEditor ──
  if (isIntermediate) {
    return (
      <IntermediateLevelEditor
        key={missionIndex}
        config={config}
        stage={stage}
        missionIndex={missionIndex}
      />
    );
  }

  // ── Nivel 0 (basic): inline editor ──
  const statusInfo = {
    idle: { color: "text-gray-500", icon: null, label: "Sin probar" },
    running: {
      color: "text-cyan-600",
      icon: <span className="inline-block w-2 h-2 rounded-full bg-cyan-600 animate-pulse" />,
      label: "Ejecutando...",
    },
    success: {
      color: "text-emerald-600",
      icon: <CheckCircle size={14} weight="fill" className="text-emerald-600" />,
      label: "Exito",
    },
    collision: {
      color: "text-red-600",
      icon: <Warning size={14} weight="fill" className="text-red-600" />,
      label: "Colision",
    },
    oob: {
      color: "text-amber-600",
      icon: <Warning size={14} weight="fill" className="text-amber-600" />,
      label: "Fuera del area",
    },
    incomplete: {
      color: "text-amber-600",
      icon: <Warning size={14} weight="fill" className="text-amber-600" />,
      label: "Incompleto",
    },
  }[sim.status];

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={`/levels/${levelKey}/mission`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Mision
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">
          {config.level} - {config.levelSlug} / Editor
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={clearProgram}
            className="btn-press flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
          >
            <Trash size={13} />
            Limpiar
          </button>
          {sim.status === "running" ? (
            <button
              onClick={stopSim}
              className="btn-press flex items-center gap-1.5 text-xs text-red-600 px-3 py-1.5 rounded-lg border border-red-300 hover:border-red-500 transition-colors"
            >
              <StopCircle size={13} weight="fill" />
              Detener
            </button>
          ) : (
            <button
              onClick={runSimulation}
              disabled={program.length < 2}
              className="btn-press flex items-center gap-1.5 text-xs bg-cyan-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={13} weight="fill" />
              Probar
            </button>
          )}
          <button
            onClick={() => canSend && router.push("/robot")}
            disabled={!canSend}
            className={`btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              canSend
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Cpu size={13} weight="duotone" />
            Enviar al robot
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block palette */}
        <div className="w-[220px] lg:w-[240px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 px-1">
              Bloques
            </p>
            {config.helperText && (
              <div className="mb-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] leading-relaxed text-cyan-700">
                {config.helperText}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {config.palette.map((def, i) => (
                <button
                  key={`${def.type}-${i}`}
                  onClick={() => addBlock(def)}
                  className={`block-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${def.colorClass} hover:brightness-125`}
                >
                  <span className="flex-shrink-0">{def.icon}</span>
                  <span className="text-xs font-mono">{def.label}</span>
                  <Plus size={11} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Program editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Programa ({program.length}/25)
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-1.5">
              {program.map((block, i) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${block.colorClass}`}
                >
                  <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-shrink-0">{block.icon}</span>
                  <span className="text-xs font-mono flex-1">{block.label}</span>
                  {i > 0 && (
                    <button
                      onClick={() => removeBlock(block.id)}
                      className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-auto"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
              {program.length < 2 && (
                <div className="flex items-center gap-2 py-3 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <Plus size={13} />
                  Agrega bloques desde el panel izquierdo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2D Simulator */}
        <div className="w-[280px] lg:w-[320px] flex-shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Simulador 2D
            </p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: gridSize }).map((_, row) =>
                Array.from({ length: gridSize }).map((_, col) => {
                  const cell = grid[row][col];
                  const isRobot = sim.pos[0] === row && sim.pos[1] === col;
                  const isVisited = sim.visited.has(`${row}-${col}`) && !isRobot;
                  const isObstacle = cell === 1;
                  const isGoal = cell === 3;
                  const isStart = cell === 2 && !isRobot;
                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`aspect-square rounded-sm flex items-center justify-center text-[11px] font-mono transition-colors duration-200 ${
                        isRobot
                          ? "bg-cyan-600 text-white font-bold"
                          : isObstacle
                          ? "bg-gray-600 border border-gray-500"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-400"
                          : isStart
                          ? "bg-gray-200 border border-gray-300"
                          : isVisited
                          ? "bg-cyan-100 border border-cyan-300"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {isRobot && <span>{DIR_ARROW[sim.dir]}</span>}
                      {isGoal && !isRobot && (
                        <span className="text-emerald-700 text-[9px] font-bold">META</span>
                      )}
                      {isObstacle && <span className="text-gray-300">■</span>}
                      {isStart && (
                        <span className="text-gray-500 text-sm font-bold">
                          {DIR_ARROW[config.startDir]}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-lg bg-gray-50 border ${
                sim.status === "success"
                  ? "border-emerald-400"
                  : sim.status === "collision" || sim.status === "oob"
                  ? "border-red-400"
                  : sim.status === "incomplete"
                  ? "border-amber-400"
                  : sim.status === "running"
                  ? "border-cyan-400"
                  : "border-gray-200"
              }`}
            >
              {statusInfo.icon}
              <div>
                <p className={`font-medium font-mono ${statusInfo.color}`}>
                  {statusInfo.label}
                </p>
                {sim.message && (
                  <p className="text-gray-600 mt-0.5 text-[11px]">{sim.message}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px] font-mono text-gray-500">
              <p className="text-[10px] uppercase tracking-wider mb-1">Leyenda</p>
              {[
                { cell: "bg-cyan-600", label: "Robot" },
                { cell: "bg-emerald-100 border border-emerald-400", label: "Meta" },
                { cell: "bg-gray-600", label: "Obstaculo" },
                { cell: "bg-cyan-100 border border-cyan-300", label: "Camino recorrido" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-3.5 h-3.5 rounded-sm flex-shrink-0 ${item.cell}`} />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="text-[11px] font-mono text-gray-500">
              <span className="text-[10px] uppercase tracking-wider">Direccion: </span>
              <span className="text-cyan-600">
                {DIR_ARROW[sim.dir]} {["Derecha", "Abajo", "Izquierda", "Arriba"][sim.dir]}
              </span>
            </div>
          </div>

          {canSend && (
            <div className="p-3 border-t border-emerald-300 bg-emerald-50">
              <button
                onClick={() => router.push("/robot")}
                className="btn-press w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-emerald-600 py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Cpu size={14} weight="duotone" />
                Enviar al robot fisico
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
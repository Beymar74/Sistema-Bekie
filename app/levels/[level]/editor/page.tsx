"use client";
import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import {
  Play, Trash, ArrowLeft, X, Plus, ArrowRight, CheckCircle,
  Warning, Robot, Cpu, StopCircle, ArrowUp, ArrowDown,
  ArrowCounterClockwise, ArrowClockwise, Timer, Flag,
} from "@phosphor-icons/react";

/* ─ Types ─ */
type Dir = 0 | 1 | 2 | 3; // right, down, left, up
type SimStatus = "idle" | "running" | "success" | "collision" | "oob" | "incomplete";

interface Block {
  id: string;
  type: string;
  label: string;
  colorClass: string;
  icon: React.ReactNode;
}

interface SimState {
  pos: [number, number];
  dir: Dir;
  visited: Set<string>;
  status: SimStatus;
  message: string;
}

/* ─ Grid definitions ─ */
const GRID_L1 = [
  [2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3],
];

const GRID_L2 = [
  [2, 0, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 1, 0, 0],
  [0, 1, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 1, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3],
];

/* ─ Direction helpers ─ */
const DIR_DELTA: [number, number][] = [[0, 1], [1, 0], [0, -1], [-1, 0]];
const DIR_ARROW = ["→", "↓", "←", "↑"];

/* ─ Available block definitions per level ─ */
const PALETTE_L1: Omit<Block, "id">[] = [
  { type: "INIT", label: "Iniciar mision", colorClass: "border-emerald-300 bg-emerald-50 text-emerald-700", icon: <Flag size={14} weight="fill" /> },
  { type: "FORWARD", label: "Avanzar", colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700", icon: <ArrowUp size={14} weight="bold" /> },
  { type: "BACKWARD", label: "Retroceder", colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700", icon: <ArrowDown size={14} weight="bold" /> },
  { type: "TURN_RIGHT", label: "Girar derecha", colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700", icon: <ArrowClockwise size={14} weight="bold" /> },
  { type: "TURN_LEFT", label: "Girar izquierda", colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700", icon: <ArrowCounterClockwise size={14} weight="bold" /> },
  { type: "WAIT", label: "Esperar", colorClass: "border-amber-300 bg-amber-50 text-amber-700", icon: <Timer size={14} weight="bold" /> },
  { type: "STOP", label: "Detener", colorClass: "border-red-300 bg-red-50 text-red-600", icon: <StopCircle size={14} weight="fill" /> },
];

const PALETTE_SENSORS: Omit<Block, "id">[] = [
  { type: "SENSOR_F", label: "Sensor frontal", colorClass: "border-violet-300 bg-violet-50 text-violet-700", icon: <Cpu size={14} weight="duotone" /> },
  { type: "SENSOR_L", label: "Sensor izquierdo", colorClass: "border-violet-300 bg-violet-50 text-violet-700", icon: <Cpu size={14} weight="duotone" /> },
  { type: "SENSOR_R", label: "Sensor derecho", colorClass: "border-violet-300 bg-violet-50 text-violet-700", icon: <Cpu size={14} weight="duotone" /> },
  { type: "IF_OBS", label: "Si hay obstaculo", colorClass: "border-amber-300 bg-amber-50 text-amber-700", icon: <Warning size={14} weight="fill" /> },
  { type: "WHILE_GOAL", label: "Mientras no llegue", colorClass: "border-amber-300 bg-amber-50 text-amber-700", icon: <ArrowRight size={14} weight="bold" /> },
];

let uid = 0;
const genId = () => `b_${++uid}`;

/* ─ Main page ─ */
export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const levelKey = (params.level as string) || "1";
  const isL2 = levelKey === "2";
  const grid = isL2 ? GRID_L2 : GRID_L1;
  const palette = isL2 ? [...PALETTE_L1, ...PALETTE_SENSORS] : PALETTE_L1;

  const [program, setProgram] = useState<Block[]>([
    { ...PALETTE_L1[0], id: genId() },
  ]);
  const [sim, setSim] = useState<SimState>({
    pos: [0, 0],
    dir: 0,
    visited: new Set(["0-0"]),
    status: "idle",
    message: "",
  });
  const [canSend, setCanSend] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addBlock = (def: Omit<Block, "id">) => {
    if (program.length >= 25) return;
    setProgram((p) => [...p, { ...def, id: genId() }]);
  };

  const removeBlock = (id: string) => {
    setProgram((p) => p.filter((b) => b.id !== id && !(p[0].id === id)));
  };

  const clearProgram = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setProgram([{ ...PALETTE_L1[0], id: genId() }]);
    setSim({ pos: [0, 0], dir: 0, visited: new Set(["0-0"]), status: "idle", message: "" });
    setCanSend(false);
  };

  const stopSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim((s) => ({ ...s, status: "idle", message: "" }));
  };

  const runSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    let pos: [number, number] = [0, 0];
    let dir: Dir = 0;
    const visited = new Set<string>(["0-0"]);
    let stepIdx = 0;
    const blocks = program.filter((b) => b.type !== "INIT");

    setSim({ pos, dir, visited: new Set(visited), status: "running", message: "" });
    setCanSend(false);

    const finish = (status: SimStatus, message: string) => {
      setSim({ pos, dir, visited: new Set(visited), status, message });
      if (status === "success") setCanSend(true);
    };

    const tick = () => {
      if (stepIdx >= blocks.length) {
        const cell = grid[pos[0]]?.[pos[1]];
        if (cell === 3) {
          finish("success", "Simulacion exitosa. El robot llego a la meta.");
        } else {
          finish("incomplete", "El robot no llego a la meta. Revisa tu programa.");
        }
        return;
      }

      const block = blocks[stepIdx++];

      switch (block.type) {
        case "FORWARD": {
          const [dr, dc] = DIR_DELTA[dir];
          const [nr, nc] = [pos[0] + dr, pos[1] + dc];
          if (nr < 0 || nr >= 7 || nc < 0 || nc >= 7) {
            finish("oob", "El robot salio del area permitida.");
            return;
          }
          if (grid[nr][nc] === 1) {
            pos = [nr, nc];
            visited.add(`${nr}-${nc}`);
            finish("collision", "El robot choco con un obstaculo.");
            return;
          }
          pos = [nr, nc];
          visited.add(`${nr}-${nc}`);
          break;
        }
        case "BACKWARD": {
          const backDir = ((dir + 2) % 4) as Dir;
          const [dr, dc] = DIR_DELTA[backDir];
          const [nr, nc] = [pos[0] + dr, pos[1] + dc];
          if (nr < 0 || nr >= 7 || nc < 0 || nc >= 7) {
            finish("oob", "El robot salio del area.");
            return;
          }
          if (grid[nr][nc] === 1) {
            finish("collision", "El robot choco retrocediendo.");
            return;
          }
          pos = [nr, nc];
          visited.add(`${nr}-${nc}`);
          break;
        }
        case "TURN_RIGHT":
          dir = ((dir + 1) % 4) as Dir;
          break;
        case "TURN_LEFT":
          dir = ((dir + 3) % 4) as Dir;
          break;
        case "STOP":
          finish("incomplete", "El programa detuvo el robot antes de llegar a la meta.");
          return;
        case "WAIT":
          break;
        case "SENSOR_F": {
          const [dr, dc] = DIR_DELTA[dir];
          const dist = grid[pos[0] + dr]?.[pos[1] + dc] === 1 ? 15 : 45;
          setSim((s) => ({
            ...s,
            pos,
            dir,
            visited: new Set(visited),
            status: "running",
            message: `Sensor frontal: ${dist} cm`,
          }));
          timerRef.current = setTimeout(tick, 450);
          return;
        }
        default:
          break;
      }

      if (grid[pos[0]][pos[1]] === 3) {
        finish("success", "Simulacion exitosa. El robot llego a la meta.");
        return;
      }

      setSim({ pos, dir, visited: new Set(visited), status: "running", message: "" });
      timerRef.current = setTimeout(tick, 450);
    };

    timerRef.current = setTimeout(tick, 450);
  }, [program, grid]);

  /* ─ Grid cell renderer ─ */
  const renderCell = (row: number, col: number) => {
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
        {isGoal && !isRobot && <span className="text-emerald-700 text-[9px] font-bold">META</span>}
        {isObstacle && <span className="text-gray-300">■</span>}
        {isStart && <span className="text-gray-400 text-[9px]">A</span>}
      </div>
    );
  };

  const statusInfo = {
    idle: { color: "text-gray-500", icon: null, label: "Sin probar" },
    running: { color: "text-cyan-600", icon: <span className="w-2 h-2 rounded-full bg-cyan-600 animate-pulse inline-block" />, label: "Ejecutando..." },
    success: { color: "text-emerald-600", icon: <CheckCircle size={14} weight="fill" className="text-emerald-600" />, label: "Exito" },
    collision: { color: "text-red-600", icon: <Warning size={14} weight="fill" className="text-red-600" />, label: "Colision" },
    oob: { color: "text-amber-600", icon: <Warning size={14} weight="fill" className="text-amber-600" />, label: "Fuera del area" },
    incomplete: { color: "text-amber-600", icon: <Warning size={14} weight="fill" className="text-amber-600" />, label: "Incompleto" },
  }[sim.status];

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      {/* Top bar */}
      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href={`/levels/${levelKey}/mission`} className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors">
          <ArrowLeft size={13} />
          Mision
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">
          Nivel {levelKey} - {isL2 ? "Intermedio" : "Basico"} / Editor
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

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Block palette */}
        <div className="w-[220px] lg:w-[240px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-3 px-1">Bloques</p>
            <div className="flex flex-col gap-1.5">
              {palette.map((def, i) => (
                <button
                  key={i}
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

        {/* Center: Program editor */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
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
                  <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">{i + 1}</span>
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

        {/* Right: 2D Simulator */}
        <div className="w-[280px] lg:w-[320px] flex-shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Simulador 2D</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Grid */}
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: "repeat(7, 1fr)" }}
            >
              {Array.from({ length: 7 }).map((_, row) =>
                Array.from({ length: 7 }).map((_, col) => renderCell(row, col))
              )}
            </div>

            {/* Status */}
            <div className={`flex items-start gap-2 text-xs p-3 rounded-lg bg-gray-50 border ${
              sim.status === "success" ? "border-emerald-400" :
              sim.status === "collision" || sim.status === "oob" ? "border-red-400" :
              sim.status === "incomplete" ? "border-amber-400" :
              sim.status === "running" ? "border-cyan-400" :
              "border-gray-200"
            }`}>
              {statusInfo.icon}
              <div>
                <p className={`font-medium font-mono ${statusInfo.color}`}>{statusInfo.label}</p>
                {sim.message && (
                  <p className="text-gray-600 mt-0.5 text-[11px]">{sim.message}</p>
                )}
              </div>
            </div>

            {/* Legend */}
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

            {/* Direction indicator */}
            <div className="text-[11px] font-mono text-gray-500">
              <span className="text-[10px] uppercase tracking-wider">Direccion: </span>
              <span className="text-cyan-600">{DIR_ARROW[sim.dir]} {["Derecha", "Abajo", "Izquierda", "Arriba"][sim.dir]}</span>
            </div>
          </div>

          {/* Send to robot button (mobile version) */}
          {canSend && (
            <div className="p-3 border-t border-emerald-300 bg-emerald-50">
              <button
                onClick={() => router.push("/robot")}
                className="btn-press w-full flex items-center justify-center gap-2 text-xs font-semibold text-white bg-emerald-600 py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Robot size={14} weight="duotone" />
                Enviar al robot fisico
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

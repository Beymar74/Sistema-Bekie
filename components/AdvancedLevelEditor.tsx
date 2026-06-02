"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft,
  CheckCircle,
  Cpu,
  Play,
  Plus,
  Repeat,
  StopCircle,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  type BlockType,
  type Dir,
  type EditorLevelContent,
  type PaletteBlock,
} from "@/lib/levels";
import { LEVEL_3_STAGES, type MissionStage } from "@/lib/nivel-2";

// ── Types ─────────────────────────────────────────────────────────────────────
type SimStatus = "idle" | "running" | "success" | "collision" | "oob" | "incomplete";
type TutorialTarget = "palette" | "program" | "run";

interface Block extends PaletteBlock {
  id: string;
  steps?: number;
  repeatCount?: number;
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
  stepLabel: string;
}

interface TutorialStep {
  title: string;
  text: string;
  target: TutorialTarget;
  lockText: string;
  blocksToPress: BlockType[];
  check: (program: Block[], simStatus: SimStatus) => boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DIR_DELTA: [number, number][] = [[0, 1],[1, 0],[0, -1],[-1, 0]];
const DIR_ARROW = ["→", "↓", "←", "↑"];
const DIR_LABEL = ["Derecha", "Abajo", "Izquierda", "Arriba"];
const MAX_SIM_TICKS = 400;
const SENSOR_STEP_CM = 20;
const TICK_MS = 380;
const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

let uid = 0;
const genId = () => `b_${++uid}_${Date.now()}`;
const formatDist = (v: number | null) => (v === null ? "--" : `${v} cm`);

// ── Tutorial steps ────────────────────────────────────────────────────────────
const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Paso 1",
    text: "Tu programa ya empieza con Iniciar mision. Ahora pulsa Repetir N veces desde el panel izquierdo. Este bloque repetira el bloque siguiente exactamente N veces, sin que tengas que ponerlo varias veces.",
    target: "palette",
    lockText: "Agrega el bloque Repetir N veces para desbloquear el siguiente paso.",
    blocksToPress: ["FOR_REPEAT"],
    check: (p) => p.some((b) => b.type === "FOR_REPEAT"),
  },
  {
    title: "Paso 2",
    text: "Ahora pulsa Avanzar para que quede dentro del bloque For. Luego agrega Detener al final para cerrar el programa.",
    target: "palette",
    lockText: "Agrega Avanzar dentro del For y Detener al final para continuar.",
    blocksToPress: ["FORWARD", "STOP"],
    check: (p) => {
      const forIdx = p.findIndex((b) => b.type === "FOR_REPEAT");
      return (
        forIdx !== -1 &&
        p[forIdx + 1]?.type === "FORWARD" &&
        p.some((b) => b.type === "STOP")
      );
    },
  },
  {
    title: "Paso 3",
    text: "Ahora mira el bloque For en tu programa. Verás que tiene un campo N = 3. Haz clic en ese número y cámbialo a 4. Así el robot avanzará 4 celdas en lugar de 3.",
    target: "program",
    lockText: "Cambia el valor de N a 4 en el bloque Repetir N veces para continuar.",
    blocksToPress: [],
    check: (p) => {
      const forBlock = p.find((b) => b.type === "FOR_REPEAT");
      return forBlock !== undefined && (forBlock.repeatCount ?? 3) === 4;
    },
  },
  {
    title: "Paso 4",
    text: "Perfecto. Ahora pulsa Probar para simular. El robot deberia avanzar 4 celdas y llegar a la meta. Si todo va bien, el tutorial terminara automaticamente.",
    target: "run",
    lockText: "Presiona Probar para simular el programa y verificar que llega a la meta.",
    blocksToPress: [],
    check: (_p, simStatus) => simStatus === "success",
  },
];

// ── Props ─────────────────────────────────────────────────────────────────────
interface Props {
  config: EditorLevelContent;
  stage: MissionStage;
  missionIndex: number;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function AdvancedLevelEditor({ config, stage, missionIndex }: Props) {
  const router = useRouter();
  const grid = stage.grid;
  const gridSize = grid.length;
  const isTutorial = missionIndex === 1;

  // ── Scenario intro ────────────────────────────────────────────────────────
  const [scenarioIntroVisible, setScenarioIntroVisible] = useState(true);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);

  // ── Focus rect refs ────────────────────────────────────────────────────────
  const [focusRect, setFocusRect] = useState<{
    top: number; left: number; width: number; height: number;
  } | null>(null);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const programRef = useRef<HTMLDivElement | null>(null);
  const runRef = useRef<HTMLButtonElement | null>(null);

  const dismissScenarioIntro = () => {
    setScenarioIntroVisible(false);
    if (isTutorial) setTutorialVisible(true);
  };

  // ── Sim state ─────────────────────────────────────────────────────────────
  const findStart = useCallback((): [number, number] => {
    for (let r = 0; r < grid.length; r++) {
      const c = grid[r].indexOf(2);
      if (c !== -1) return [r, c];
    }
    return [0, 0];
  }, [grid]);

  const makeInitialSim = useCallback((): SimState => {
    const start = findStart();
    return {
      pos: start,
      dir: config.startDir,
      visited: new Set([`${start[0]}-${start[1]}`]),
      status: "idle",
      message: "",
      sensors: { front: null, left: null, right: null, obstacleAhead: false },
      stepLabel: "",
    };
  }, [config.startDir, findStart]);

  const makeInitialProgram = useCallback(
    (): Block[] => [{ ...config.palette[0], id: genId() }],
    [config.palette]
  );

  const [program, setProgram] = useState<Block[]>(() => makeInitialProgram());
  const [sim, setSim] = useState<SimState>(() => makeInitialSim());
  const [canSend, setCanSend] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const startTimeRef = useRef<number>(Date.now());
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  // ── Save progress automatically when simulation succeeds ──────────────────
  useEffect(() => {
    if (!canSend) return;
    const next = Math.min(LEVEL_3_STAGES.length, missionIndex + 1);
    const stored =
      typeof window !== "undefined"
        ? Number(window.localStorage.getItem("bekie-level-3-progress") ?? "1")
        : 1;
    const safeStored = Number.isNaN(stored) ? 1 : stored;
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "bekie-level-3-progress",
        String(Math.max(safeStored, next))
      );
    }
  }, [canSend, missionIndex]);

  // ── Tutorial: auto-advance when condition met ──────────────────────────────
  const currentTutStep = isTutorial && tutorialVisible && tutorialStep < TUTORIAL_STEPS.length
    ? TUTORIAL_STEPS[tutorialStep]
    : null;

  const canAdvanceTutorial = useMemo(() => {
    if (!currentTutStep) return false;
    return currentTutStep.check(program, sim.status);
  }, [currentTutStep, program, sim.status]);

  useEffect(() => {
    if (!isTutorial || !tutorialVisible || !currentTutStep) return;
    if (!canAdvanceTutorial || tutorialStep >= TUTORIAL_STEPS.length - 1) return;
    const t = setTimeout(() => setTutorialStep((s) => s + 1), 400);
    return () => clearTimeout(t);
  }, [canAdvanceTutorial, currentTutStep, isTutorial, tutorialStep, tutorialVisible]);

  // ── Focus rect ─────────────────────────────────────────────────────────────
  const updateFocusRect = useCallback(() => {
    if (!currentTutStep || typeof window === "undefined") return;
    const refs: Record<TutorialTarget, React.RefObject<HTMLElement | null>> = {
      palette: paletteRef as React.RefObject<HTMLElement | null>,
      program: programRef as React.RefObject<HTMLElement | null>,
      run: runRef as React.RefObject<HTMLElement | null>,
    };
    const element = refs[currentTutStep.target].current;
    if (!element) { setFocusRect(null); return; }
    const rect = element.getBoundingClientRect();
    const padding = currentTutStep.target === "run" ? 10 : 12;
    setFocusRect({
      top: Math.max(12, rect.top - padding),
      left: Math.max(12, rect.left - padding),
      width: Math.min(window.innerWidth - 24, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 24, rect.height + padding * 2),
    });
  }, [currentTutStep]);

  useEffect(() => {
    if (!currentTutStep) return;
    const frame = window.requestAnimationFrame(updateFocusRect);
    const h = () => updateFocusRect();
    window.addEventListener("resize", h);
    window.addEventListener("scroll", h, true);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", h);
      window.removeEventListener("scroll", h, true);
    };
  }, [currentTutStep, updateFocusRect]);

  // ── Tutorial highlight classes ─────────────────────────────────────────────
  const tutHighlightBlocks = useMemo(
    () => new Set(currentTutStep?.blocksToPress ?? []),
    [currentTutStep]
  );

  const getPaletteClass = useCallback((def: PaletteBlock) => {
    const base = `block-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${def.colorClass} hover:brightness-125`;
    if (!tutorialVisible || !currentTutStep || currentTutStep.blocksToPress.length === 0) return base;
    if (tutHighlightBlocks.has(def.type)) return `${base} ring-2 ring-indigo-400 shadow-[0_0_0_2px_rgba(99,102,241,0.32)] scale-[1.03] brightness-125 saturate-125`;
    return `${base} opacity-15 saturate-0 brightness-60`;
  }, [currentTutStep, tutHighlightBlocks, tutorialVisible]);

  // ── Sensor helpers ─────────────────────────────────────────────────────────
  const getCell = useCallback((pos: [number, number]) => grid[pos[0]]?.[pos[1]] ?? null, [grid]);

  const measureDist = useCallback((pos: [number, number], dir: Dir): number => {
    const [dr, dc] = DIR_DELTA[dir];
    let r = pos[0], c = pos[1], cells = 0;
    while (true) {
      r += dr; c += dc; cells += 1;
      if (r < 0 || r >= grid.length || c < 0 || c >= (grid[r]?.length ?? 0)) return cells * SENSOR_STEP_CM;
      if (grid[r][c] === 1) return cells * SENSOR_STEP_CM;
    }
  }, [grid]);

  const readSensors = useCallback((pos: [number, number], dir: Dir): SensorState => {
    const front = measureDist(pos, dir);
    return { front, left: measureDist(pos, ((dir + 3) % 4) as Dir), right: measureDist(pos, ((dir + 1) % 4) as Dir), obstacleAhead: front <= SENSOR_STEP_CM };
  }, [measureDist]);

  // ── Program manipulation ───────────────────────────────────────────────────
  const resetSim = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim(makeInitialSim());
    setCanSend(false);
  }, [makeInitialSim]);

  const addBlock = (def: PaletteBlock) => {
    if (program.length >= 30) return;
    setProgram((cur) => [...cur, {
      ...def, id: genId(),
      ...(def.type === "FORWARD" || def.type === "BACKWARD" ? { steps: 1 } : {}),
      ...(def.type === "FOR_REPEAT" ? { repeatCount: 3 } : {}),
    }]);
    resetSim();
  };

  const removeBlock = (id: string) => {
    setProgram((cur) => {
      const idx = cur.findIndex((b) => b.id === id);
      if (idx <= 0) return cur;
      const block = cur[idx];
      if (block.type === "FOR_REPEAT" && cur[idx + 1] && cur[idx + 1].type !== "STOP") {
        return cur.filter((_, i) => i !== idx && i !== idx + 1);
      }
      return cur.filter((b, i) => i === 0 || b.id !== id);
    });
    resetSim();
  };

  const updateRepeatCount = (id: string, value: number) => {
    setProgram((cur) => cur.map((b) => b.id === id ? { ...b, repeatCount: Math.max(1, Math.min(20, value)) } : b));
  };

  const updateSteps = (id: string, value: number) => {
    setProgram((cur) => cur.map((b) => b.id === id ? { ...b, steps: Math.max(1, Math.min(9, value)) } : b));
  };

  const clearProgram = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setProgram(makeInitialProgram());
    setSim(makeInitialSim());
    setCanSend(false);
    if (isTutorial) setTutorialStep(0);
  };

  // ── Flat op builder ────────────────────────────────────────────────────────
  type FlatOp =
    | { type: "FORWARD"; steps: number }
    | { type: "BACKWARD"; steps: number }
    | { type: "TURN_RIGHT" }
    | { type: "TURN_LEFT" }
    | { type: "WAIT" }
    | { type: "STOP" }
    | { type: "IF_OBS_ELSE"; ifOpIdx: number; elseOpIdx: number; afterIdx: number };

  const buildFlatOps = useCallback((blocks: Block[]): FlatOp[] => {
    const ops: FlatOp[] = [];
    const src = blocks.filter((b) => b.type !== "INIT");
    let i = 0;

    while (i < src.length) {
      const b = src[i];

      // ── FOR_REPEAT: inline-expand N copies of the next block ──
      if (b.type === "FOR_REPEAT") {
        const n = b.repeatCount ?? 3;
        const next = src[i + 1];
        if (next && next.type !== "STOP") {
          for (let r = 0; r < n; r++) {
            if (next.type === "FORWARD")      ops.push({ type: "FORWARD",    steps: next.steps ?? 1 });
            else if (next.type === "BACKWARD") ops.push({ type: "BACKWARD",   steps: next.steps ?? 1 });
            else if (next.type === "TURN_RIGHT") ops.push({ type: "TURN_RIGHT" });
            else if (next.type === "TURN_LEFT")  ops.push({ type: "TURN_LEFT" });
            else if (next.type === "WAIT")        ops.push({ type: "WAIT" });
          }
          i += 2;
        } else {
          i += 1;
        }
        continue;
      }

      // ── IF_OBS_ELSE: emit a single op that carries indices to both branches ──
      if (b.type === "IF_OBS_ELSE") {
        const ifBlockSrc  = src[i + 1];
        const elseBlockSrc = src[i + 2];

        // We'll place: [IF_OBS_ELSE header][if-branch op][else-branch op]
        const headerIdx  = ops.length;
        const ifOpIdx    = headerIdx + 1;
        const elseOpIdx  = headerIdx + 2;
        const afterIdx   = headerIdx + 3;   // execution continues here after the branch

        ops.push({ type: "IF_OBS_ELSE", ifOpIdx, elseOpIdx, afterIdx });

        // Push IF branch op (slot always present — WAIT if missing/structural)
        const pushBranchOp = (bl: Block | undefined) => {
          if (!bl || bl.type === "IF_OBS_ELSE" || bl.type === "FOR_REPEAT" || bl.type === "STOP") {
            ops.push({ type: "WAIT" });
          } else if (bl.type === "FORWARD")    ops.push({ type: "FORWARD",  steps: bl.steps ?? 1 });
          else if (bl.type === "BACKWARD")      ops.push({ type: "BACKWARD", steps: bl.steps ?? 1 });
          else if (bl.type === "TURN_RIGHT")    ops.push({ type: "TURN_RIGHT" });
          else if (bl.type === "TURN_LEFT")     ops.push({ type: "TURN_LEFT" });
          else                                   ops.push({ type: "WAIT" });
        };

        pushBranchOp(ifBlockSrc);   // ifOpIdx
        pushBranchOp(elseBlockSrc); // elseOpIdx

        // Advance past IF header + two branch source blocks
        const ifIsStructural   = !ifBlockSrc  || ["IF_OBS_ELSE","FOR_REPEAT","STOP"].includes(ifBlockSrc.type);
        const elseIsStructural = !elseBlockSrc || ["IF_OBS_ELSE","FOR_REPEAT","STOP"].includes(elseBlockSrc.type);
        i += 1 + (ifIsStructural ? 0 : 1) + (elseIsStructural ? 0 : 1);
        continue;
      }

      // ── Simple ops ──
      if (b.type === "FORWARD")     ops.push({ type: "FORWARD",  steps: b.steps ?? 1 });
      else if (b.type === "BACKWARD")    ops.push({ type: "BACKWARD", steps: b.steps ?? 1 });
      else if (b.type === "TURN_RIGHT")  ops.push({ type: "TURN_RIGHT" });
      else if (b.type === "TURN_LEFT")   ops.push({ type: "TURN_LEFT" });
      else if (b.type === "WAIT")        ops.push({ type: "WAIT" });
      else if (b.type === "STOP")        ops.push({ type: "STOP" });
      i += 1;
    }
    return ops;
  }, []);

  // ── Simulation ─────────────────────────────────────────────────────────────
  const runSimulation = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const startPos = findStart();
    let pos: [number, number] = [...startPos] as [number, number];
    let dir: Dir = config.startDir;
    const visited = new Set<string>([`${pos[0]}-${pos[1]}`]);
    let sensors = readSensors(pos, dir);
    let ticks = 0;
    const ops = buildFlatOps(program);
    let idx = 0;

    setCanSend(false);
    setAttempts((a) => a + 1);
    setSim({ pos: [...pos] as [number, number], dir, visited: new Set(visited), status: "running", message: "Simulacion iniciada...", sensors: { ...sensors }, stepLabel: "" });

    const finish = (status: Exclude<SimStatus, "running" | "idle">, message: string) => {
      setSim({ pos: [...pos] as [number, number], dir, visited: new Set(visited), status, message, sensors: { ...sensors }, stepLabel: "" });
      if (status === "success") setCanSend(true);
    };

    const move1 = (d: Dir): "ok" | "collision" | "oob" => {
      const [dr, dc] = DIR_DELTA[d];
      const next: [number, number] = [pos[0] + dr, pos[1] + dc];
      const cell = getCell(next);
      if (cell === null) { pos = next; visited.add(`${next[0]}-${next[1]}`); sensors = readSensors(pos, dir); return "oob"; }
      if (cell === 1)    { pos = next; visited.add(`${next[0]}-${next[1]}`); sensors = readSensors(pos, dir); return "collision"; }
      pos = next; visited.add(`${next[0]}-${next[1]}`); sensors = readSensors(pos, dir); return "ok";
    };

    const tick = () => {
      if (ticks++ > MAX_SIM_TICKS) { finish("incomplete", "Limite de pasos alcanzado."); return; }
      if (idx >= ops.length) {
        if (getCell(pos) === 3) finish("success", "Simulacion exitosa. El robot llego a la meta.");
        else finish("incomplete", "El programa termino pero el robot no llego a la meta.");
        return;
      }
      const op = ops[idx];
      if (!op) { finish("incomplete", "Bloque desconocido."); return; }
      let label = "";

      switch (op.type) {
        case "FORWARD": {
          label = `Avanzando ${op.steps} celda(s)`;
          for (let s = 0; s < op.steps; s++) {
            const r = move1(dir);
            if (r === "collision") { finish("collision", "El robot choco."); return; }
            if (r === "oob")       { finish("oob",       "El robot salio del area."); return; }
          }
          idx += 1; break;
        }
        case "BACKWARD": {
          label = `Retrocediendo ${op.steps} celda(s)`;
          const bd = ((dir + 2) % 4) as Dir;
          for (let s = 0; s < op.steps; s++) {
            const r = move1(bd);
            if (r === "collision") { finish("collision", "El robot choco."); return; }
            if (r === "oob")       { finish("oob",       "El robot salio del area."); return; }
          }
          idx += 1; break;
        }
        case "TURN_RIGHT":
          label = "Girando derecha";
          dir = ((dir + 1) % 4) as Dir;
          sensors = readSensors(pos, dir);
          idx += 1; break;

        case "TURN_LEFT":
          label = "Girando izquierda";
          dir = ((dir + 3) % 4) as Dir;
          sensors = readSensors(pos, dir);
          idx += 1; break;

        case "WAIT":
          label = "Esperando...";
          idx += 1; break;

        case "STOP":
          if (getCell(pos) === 3) finish("success", "Simulacion exitosa. El robot llego a la meta.");
          else finish("incomplete", "El robot se detuvo antes de llegar a la meta.");
          return;

        // ── IF_OBS_ELSE — FIX: jump to the right branch op, execute it, then jump to afterIdx ──
        case "IF_OBS_ELSE": {
          const chosen = sensors.obstacleAhead ? op.ifOpIdx : op.elseOpIdx;
          label = sensors.obstacleAhead ? "If: hay obstaculo" : "If: sin obstaculo";
          const br = ops[chosen];
          if (br) {
            if (br.type === "FORWARD") {
              // ✅ FIX: respect br.steps (was being ignored before)
              for (let s = 0; s < br.steps; s++) {
                const r = move1(dir);
                if (r === "collision") { finish("collision", "El robot choco en rama If."); return; }
                if (r === "oob")       { finish("oob",       "El robot salio del area en rama If."); return; }
              }
            } else if (br.type === "BACKWARD") {
              const bd = ((dir + 2) % 4) as Dir;
              // ✅ FIX: respect br.steps
              for (let s = 0; s < br.steps; s++) {
                const r = move1(bd);
                if (r === "collision") { finish("collision", "El robot choco en rama If."); return; }
                if (r === "oob")       { finish("oob",       "El robot salio del area en rama If."); return; }
              }
            } else if (br.type === "TURN_RIGHT") {
              dir = ((dir + 1) % 4) as Dir;
              sensors = readSensors(pos, dir);
            } else if (br.type === "TURN_LEFT") {
              dir = ((dir + 3) % 4) as Dir;
              sensors = readSensors(pos, dir);
            }
            // WAIT / anything else: no movement
          }
          // ✅ FIX: always jump to afterIdx (skips both branch slots cleanly)
          idx = op.afterIdx;
          break;
        }

        default: idx += 1; break;
      }

      setSim({ pos: [...pos] as [number, number], dir, visited: new Set(visited), status: "running", message: "", sensors: { ...sensors }, stepLabel: label });
      timerRef.current = setTimeout(tick, TICK_MS);
    };

    timerRef.current = setTimeout(tick, TICK_MS);
  }, [buildFlatOps, config.startDir, findStart, getCell, program, readSensors]);

  const stopSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim((c) => ({ ...c, status: "idle", message: "Simulacion detenida.", stepLabel: "" }));
  };

  // ── Status display ─────────────────────────────────────────────────────────
  const statusInfo = {
    idle:       { color: "text-gray-500",   label: "Sin probar",      icon: null },
    running:    { color: "text-indigo-600", label: "Ejecutando...",   icon: <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> },
    success:    { color: "text-emerald-600",label: "Exito",           icon: <CheckCircle size={14} weight="fill" className="text-emerald-600" /> },
    collision:  { color: "text-red-600",    label: "Colision",        icon: <Warning size={14} weight="fill" className="text-red-600" /> },
    oob:        { color: "text-amber-600",  label: "Fuera del area",  icon: <Warning size={14} weight="fill" className="text-amber-600" /> },
    incomplete: { color: "text-amber-600",  label: "Incompleto",      icon: <Warning size={14} weight="fill" className="text-amber-600" /> },
  }[sim.status];

  // ── Tutorial helpers ───────────────────────────────────────────────────────
  const tutorialActionLabel = (() => {
    if (!currentTutStep) return "Siguiente";
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) return "Terminar";
    if (!canAdvanceTutorial) return tutorialStep === 2 ? "Prueba primero" : "Completa el paso";
    return "Siguiente";
  })();

  const closeTutorial   = () => { setTutorialVisible(false); setFocusRect(null); };
  const nextTutorialStep = () => {
    if (!canAdvanceTutorial) return;
    if (tutorialStep >= TUTORIAL_STEPS.length - 1) { closeTutorial(); return; }
    setTutorialStep((s) => s + 1);
  };
  const prevTutorialStep = () => setTutorialStep((s) => Math.max(0, s - 1));

  // ── Block row renderer (simple) ────────────────────────────────────────────
  const renderSimpleBlockRow = (block: Block, index: number) => {
    const isMovement = block.type === "FORWARD" || block.type === "BACKWARD";
    return (
      <div key={block.id} className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${block.colorClass}`}>
        <span className="text-[10px] font-mono text-gray-400 w-5 flex-shrink-0">{index + 1}</span>
        <span className="flex-shrink-0">{block.icon}</span>
        <span className="text-xs font-mono flex-1 leading-tight">{block.label}</span>
        {isMovement && (
          <div className="flex items-center gap-1 ml-auto mr-1">
            <span className="text-[10px] font-mono text-gray-500">pasos</span>
            <input type="number" min={1} max={9} value={block.steps ?? 1}
              onChange={(e) => updateSteps(block.id, Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-10 text-xs font-mono text-center rounded border border-cyan-300 bg-white text-cyan-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
            />
          </div>
        )}
        {index > 0 && (
          <button onClick={() => removeBlock(block.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-1">
            <X size={13} />
          </button>
        )}
      </div>
    );
  };

  // ── FOR_REPEAT card renderer ───────────────────────────────────────────────
  const renderForRepeatCard = (forBlock: Block, forIndex: number, bodyBlock: Block | undefined, bodyIndex: number) => (
    <div key={forBlock.id} className={`rounded-xl border ${forBlock.colorClass} overflow-hidden`}>
      <div className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
        <div className="flex flex-1 items-center gap-2.5">
          <span className="text-[10px] font-mono text-gray-400 w-5 flex-shrink-0">{forIndex + 1}</span>
          <span className="flex-shrink-0">{forBlock.icon}</span>
          <span className="text-xs font-mono flex-1 leading-tight">{forBlock.label}</span>
          <div className="flex items-center gap-1.5 mr-1">
            <span className="text-[10px] font-mono font-bold">N =</span>
            <input
              type="number" min={1} max={20} value={forBlock.repeatCount ?? 3}
              onChange={(e) => updateRepeatCount(forBlock.id, Number(e.target.value))}
              onClick={(e) => e.stopPropagation()}
              className="w-12 text-xs font-mono text-center rounded border border-indigo-300 bg-white text-indigo-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </div>
          <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Repite lo de abajo</span>
        </div>
        <button onClick={() => removeBlock(forBlock.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-1">
          <X size={13} />
        </button>
      </div>
      <div className="px-3 pb-3">
        <div className="rounded-lg border border-white/70 bg-white/75 p-2.5">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-indigo-600">
            <Repeat size={10} className="text-indigo-500 flex-shrink-0" />
            Accion a repetir {forBlock.repeatCount ?? 3} veces
          </div>
          {bodyBlock ? (
            <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${bodyBlock.colorClass} shadow-sm`}>
              <span className="text-[10px] font-mono text-gray-400 w-5 flex-shrink-0">{bodyIndex + 1}</span>
              <span className="flex-shrink-0">{bodyBlock.icon}</span>
              <span className="text-xs font-mono flex-1 leading-tight">{bodyBlock.label}</span>
              {(bodyBlock.type === "FORWARD" || bodyBlock.type === "BACKWARD") && (
                <div className="flex items-center gap-1 ml-auto mr-1">
                  <span className="text-[10px] font-mono text-gray-500">pasos</span>
                  <input
                    type="number" min={1} max={9} value={bodyBlock.steps ?? 1}
                    onChange={(e) => updateSteps(bodyBlock.id, Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="w-10 text-xs font-mono text-center rounded border border-cyan-300 bg-white text-cyan-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                </div>
              )}
              <button onClick={() => removeBlock(bodyBlock.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-1">
                <X size={13} />
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500">
              Agrega aqui el bloque que se repetira N veces
            </div>
          )}
        </div>
      </div>
    </div>
  );

  // ── IF_OBS_ELSE card renderer ──────────────────────────────────────────────
  const renderIfElseCard = (
    ifBlock: Block, ifIndex: number,
    ifBranch: Block | undefined, ifBranchIndex: number,
    elseBranch: Block | undefined, elseBranchIndex: number,
  ) => {
    const branchRow = (branch: Block | undefined, branchIndex: number) =>
      branch ? (
        <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${branch.colorClass} shadow-sm bg-white/90`}>
          <span className="text-[10px] font-mono text-gray-400 w-5 flex-shrink-0">{branchIndex + 1}</span>
          <span className="flex-shrink-0">{branch.icon}</span>
          <span className="text-xs font-mono flex-1 leading-tight">{branch.label}</span>
          {(branch.type === "FORWARD" || branch.type === "BACKWARD") && (
            <div className="flex items-center gap-1 ml-auto mr-1">
              <span className="text-[10px] font-mono text-gray-500">pasos</span>
              <input type="number" min={1} max={9} value={branch.steps ?? 1}
                onChange={(e) => updateSteps(branch.id, Number(e.target.value))}
                onClick={(e) => e.stopPropagation()}
                className="w-10 text-xs font-mono text-center rounded border border-cyan-300 bg-white text-cyan-700 px-1 py-0.5 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
            </div>
          )}
          <button onClick={() => removeBlock(branch.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-1">
            <X size={13} />
          </button>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500">
          Agrega aqui el bloque de respuesta
        </div>
      );

    return (
      <div key={ifBlock.id} className={`rounded-xl border ${ifBlock.colorClass} overflow-hidden`}>
        <div className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
          <div className="flex flex-1 items-center gap-2.5">
            <span className="text-[10px] font-mono text-gray-400 w-5 flex-shrink-0">{ifIndex + 1}</span>
            <span className="flex-shrink-0">{ifBlock.icon}</span>
            <span className="text-xs font-mono flex-1 leading-tight">{ifBlock.label}</span>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">Dos respuestas</span>
          </div>
          <button onClick={() => removeBlock(ifBlock.id)} className="text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 ml-1">
            <X size={13} />
          </button>
        </div>
        <div className="px-3 pb-3">
          <div className="flex flex-col gap-2.5 rounded-lg border border-white/70 bg-white/75 p-2.5">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-600">
              <Warning size={12} weight="fill" />
              Si hay obstaculo
            </div>
            {branchRow(ifBranch, ifBranchIndex)}
            <div className="mx-4 h-4 border-l-2 border-dashed border-gray-300" />
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-600">
              <CheckCircle size={12} weight="fill" />
              Si no hay obstaculo
            </div>
            {branchRow(elseBranch, elseBranchIndex)}
          </div>
        </div>
      </div>
    );
  };

  // ── Program list renderer ──────────────────────────────────────────────────
  const renderProgram = () => {
    const items: React.ReactNode[] = [];
    let i = 0;
    while (i < program.length) {
      const block = program[i];

      if (block.type === "IF_OBS_ELSE") {
        const ifBranch   = program[i + 1];
        const elseBranch = program[i + 2];
        const ifIsStructural   = !ifBranch   || ["IF_OBS_ELSE","FOR_REPEAT","STOP"].includes(ifBranch.type);
        const elseIsStructural = !elseBranch || ["IF_OBS_ELSE","FOR_REPEAT","STOP"].includes(elseBranch.type);
        items.push(renderIfElseCard(
          block, i,
          ifIsStructural   ? undefined : ifBranch,   i + 1,
          elseIsStructural ? undefined : elseBranch, i + 2,
        ));
        i += 1 + (ifIsStructural ? 0 : 1) + (elseIsStructural ? 0 : 1);
        continue;
      }

      if (block.type === "FOR_REPEAT") {
        const nextBlock = program[i + 1];
        const hasBody = nextBlock && !["STOP","FOR_REPEAT","IF_OBS_ELSE"].includes(nextBlock.type);
        items.push(renderForRepeatCard(block, i, hasBody ? nextBlock : undefined, i + 1));
        i += hasBody ? 2 : 1;
        continue;
      }

      items.push(renderSimpleBlockRow(block, i));
      i += 1;
    }
    return items;
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      {/* Top bar */}
      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link href="/levels/3/mission" className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors">
          <ArrowLeft size={13} />
          Mision
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">Nivel 2 — Avanzado / {stage.title}</span>
        <div className="flex items-center gap-2">
          <button onClick={clearProgram} className="btn-press flex items-center gap-1.5 text-xs text-gray-600 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors">
            <Trash size={13} />
            Limpiar
          </button>
          {sim.status === "running" ? (
            <button onClick={stopSim} className="btn-press flex items-center gap-1.5 text-xs text-red-600 px-3 py-1.5 rounded-lg border border-red-300 hover:border-red-500 transition-colors">
              <StopCircle size={13} weight="fill" />
              Detener
            </button>
          ) : (
            <button
              ref={runRef}
              onClick={runSimulation}
              disabled={program.length < 2}
              className="btn-press flex items-center gap-1.5 text-xs bg-indigo-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Play size={13} weight="fill" />
              Compilar
            </button>
          )}
          <button
            onClick={() => {
              if (!canSend) return;
              const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
              const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
              const ss = String(elapsed % 60).padStart(2, "0");
              if (typeof window !== "undefined") {
                window.localStorage.setItem("bekie-result-3", JSON.stringify({
                  mission: missionIndex, success: true, blocks: program.length, attempts,
                  time: `${mm}:${ss}`, stageTitle: stage.title, stageDifficulty: stage.difficulty,
                  stageVictory: stage.victory, stageTip: stage.tips[0] ?? "",
                  isLast: missionIndex >= LEVEL_3_STAGES.length,
                }));
              }
              router.push("/results2");
            }}
            disabled={!canSend}
            className={`btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${canSend ? "bg-emerald-500 text-white hover:bg-emerald-400" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
          >
            <Cpu size={13} weight="duotone" />
            Cargar
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* ── Palette ── */}
        <div ref={paletteRef} className="w-[230px] lg:w-[260px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 px-1">Bloques</p>

            {isTutorial && tutorialVisible && currentTutStep && currentTutStep.target === "palette" && (
              <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2.5">
                <p className="text-[10px] font-mono font-semibold text-indigo-700 uppercase tracking-wider mb-1">{currentTutStep.title}</p>
                <p className="text-[11px] leading-relaxed text-indigo-800">{currentTutStep.text}</p>
              </div>
            )}

            {(!tutorialVisible || !currentTutStep || currentTutStep.target !== "palette") && config.helperText && (
              <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-700">
                {config.helperText}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 px-0.5">Movimiento</p>
                <div className="flex flex-col gap-1.5">
                  {config.palette
                    .filter((d) => ["INIT","FORWARD","BACKWARD","TURN_RIGHT","TURN_LEFT","WAIT","STOP"].includes(d.type))
                    .map((def, i) => (
                      <button key={`${def.type}-${i}`} onClick={() => addBlock(def)} className={getPaletteClass(def)}>
                        <span className="flex-shrink-0">{def.icon}</span>
                        <span className="text-xs font-mono">{def.label}</span>
                        <Plus size={11} className="ml-auto opacity-40" />
                      </button>
                    ))}
                </div>
              </div>
              <div>
                <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-1.5 px-0.5">Estructuras</p>
                <div className="flex flex-col gap-1.5">
                  {config.palette
                    .filter((d) => ["IF_OBS_ELSE","FOR_REPEAT"].includes(d.type))
                    .map((def, i) => (
                      <button key={`${def.type}-${i}`} onClick={() => addBlock(def)} className={getPaletteClass(def)}>
                        <span className="flex-shrink-0">{def.icon}</span>
                        <span className="text-xs font-mono leading-tight">{def.label}</span>
                        <Plus size={11} className="ml-auto opacity-40 flex-shrink-0" />
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Program editor ── */}
        <div ref={programRef} className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Programa ({program.length}/30)</p>
            <span className="text-[10px] font-mono text-indigo-600 uppercase tracking-wider">Mision {missionIndex}/5</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-1.5">
              {renderProgram()}
              {program.length < 2 && (
                <div className="flex items-center gap-2 py-3 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <Plus size={13} />
                  Agrega bloques desde el panel izquierdo
                </div>
              )}
            </div>
            <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3">
              <p className="text-[9px] font-mono uppercase tracking-wider text-gray-400 mb-2">Como usar las estructuras</p>
              <div className="flex flex-col gap-2 text-[10px] text-gray-600 leading-relaxed">
                <div className="flex items-start gap-1.5">
                  <Repeat size={10} className="text-indigo-500 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">Repetir N veces:</span> agrega el For, luego el bloque a repetir. El bloque quedara dentro del For y se ejecutara exactamente N veces.</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <Warning size={10} className="text-amber-500 mt-0.5 flex-shrink-0" />
                  <span><span className="font-semibold">Si hay obstaculo:</span> agrega el bloque If/Else, luego el bloque para cuando hay obstaculo y el bloque para cuando no hay obstaculo.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Simulator ── */}
        <div className="w-[290px] lg:w-[330px] flex-shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">Simulador — {stage.scenarioLabel}</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Grid */}
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {Array.from({ length: gridSize }).map((_, row) =>
                Array.from({ length: gridSize }).map((_, col) => {
                  const cell = grid[row][col];
                  const isRobot   = sim.pos[0] === row && sim.pos[1] === col;
                  const isVisited = sim.visited.has(`${row}-${col}`) && !isRobot;
                  return (
                    <div key={`${row}-${col}`} className={`aspect-square rounded-sm flex items-center justify-center text-[11px] font-mono transition-colors duration-200 ${
                      isRobot
                        ? (sim.status === "collision" ? "bg-red-500 text-white font-bold" : "bg-indigo-600 text-white font-bold")
                        : cell === 1 ? "bg-gray-600 border border-gray-500"
                        : cell === 3 ? "bg-emerald-100 border border-emerald-400"
                        : cell === 2 && !isRobot ? "bg-gray-200 border border-gray-300"
                        : isVisited ? "bg-indigo-100 border border-indigo-300"
                        : "bg-gray-50 border border-gray-200"
                    }`}>
                      {isRobot && <span className="text-base">{DIR_ARROW[sim.dir]}</span>}
                      {cell === 3 && !isRobot && <span className="text-emerald-700 text-[9px] font-bold">META</span>}
                      {cell === 1 && <span className="text-gray-300">■</span>}
                      {cell === 2 && !isRobot && <span className="text-gray-500 text-sm font-bold">{DIR_ARROW[config.startDir]}</span>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Status */}
            <div className={`flex items-start gap-2 text-xs p-3 rounded-lg bg-gray-50 border ${
              sim.status === "success"    ? "border-emerald-400"
              : sim.status === "collision" || sim.status === "oob" ? "border-red-400"
              : sim.status === "incomplete" ? "border-amber-400"
              : sim.status === "running"  ? "border-indigo-400"
              : "border-gray-200"
            }`}>
              {statusInfo.icon && <span className="mt-0.5">{statusInfo.icon}</span>}
              <div className="flex-1 min-w-0">
                <p className={`font-medium font-mono ${statusInfo.color}`}>{statusInfo.label}</p>
                {sim.stepLabel && <p className="text-indigo-600 text-[10px] mt-0.5 font-mono truncate">{sim.stepLabel}</p>}
                {sim.message   && <p className="text-gray-600 mt-0.5 text-[11px]">{sim.message}</p>}
              </div>
            </div>

            {/* Sensors */}
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2.5">Sensores de proximidad</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: "Frontal",    value: formatDist(sim.sensors.front), accent: "text-indigo-600", border: "border-indigo-200" },
                  { label: "Izquierdo",  value: formatDist(sim.sensors.left),  accent: "text-amber-600",  border: "border-amber-200"  },
                  { label: "Derecho",    value: formatDist(sim.sensors.right), accent: "text-cyan-600",   border: "border-cyan-200"   },
                ].map((s) => (
                  <div key={s.label} className={`rounded-lg border ${s.border} bg-gray-50 p-2`}>
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">{s.label}</p>
                    <p className={`text-sm font-bold font-mono ${s.accent}`}>{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                <span>Via frontal</span>
                <span className={sim.sensors.obstacleAhead ? "text-red-600 font-semibold" : "text-emerald-600 font-semibold"}>
                  {sim.sensors.obstacleAhead ? "⚠ Obstaculo" : "✓ Libre"}
                </span>
              </div>
            </div>

            {/* Scenario info */}
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-3">
              <p className="text-[10px] font-mono text-indigo-700 uppercase tracking-wider mb-1">{stage.scenarioLabel}</p>
              <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
              <p className="text-[11px] leading-relaxed text-gray-600 mt-1">{stage.summary}</p>
            </div>

            {/* Instructions */}
            <div className="bg-white border border-gray-200 rounded-xl p-3">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">Instrucciones</p>
              <div className="flex flex-col gap-1.5">
                {stage.instructions.map((inst, i) => (
                  <div key={i} className="flex items-start gap-2 text-[11px] text-gray-600">
                    <span className="flex-shrink-0 w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[9px] font-mono font-bold mt-0.5">{i + 1}</span>
                    {inst}
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-col gap-1.5 text-[11px] font-mono text-gray-500">
              <p className="text-[9px] uppercase tracking-wider mb-0.5">Leyenda</p>
              {[
                { cell: "bg-indigo-600",                        label: "Robot" },
                { cell: "bg-emerald-100 border border-emerald-400", label: "Meta" },
                { cell: "bg-gray-600",                          label: "Obstaculo" },
                { cell: "bg-indigo-100 border border-indigo-300",   label: "Camino recorrido" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm flex-shrink-0 ${item.cell}`} />
                  {item.label}
                </div>
              ))}
            </div>

            <div className="text-[11px] font-mono text-gray-500">
              <span className="text-[9px] uppercase tracking-wider">Direccion: </span>
              <span className="text-indigo-600">{DIR_ARROW[sim.dir]} {DIR_LABEL[sim.dir]}</span>
            </div>
          </div>

          {canSend && (
            <div className="p-3 border-t border-emerald-300 bg-emerald-50">
              <button
                onClick={() => {
                  const elapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
                  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
                  const ss = String(elapsed % 60).padStart(2, "0");
                  if (typeof window !== "undefined") {
                    window.localStorage.setItem("bekie-result-3", JSON.stringify({
                      mission: missionIndex, success: true, blocks: program.length, attempts,
                      time: `${mm}:${ss}`, stageTitle: stage.title, stageDifficulty: stage.difficulty,
                      stageVictory: stage.victory, stageTip: stage.tips[0] ?? "",
                      isLast: missionIndex >= LEVEL_3_STAGES.length,
                    }));
                  }
                  router.push("/results2");
                }}
                className="btn-press w-full flex items-center justify-center gap-2 text-sm font-semibold text-white bg-emerald-600 py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
              >
                <Cpu size={14} weight="duotone" />
                Enviar al robot fisico
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Tutorial overlay ── */}
      {isTutorial && tutorialVisible && currentTutStep && focusRect && (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          <div
            className="absolute rounded-2xl border-2 border-indigo-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] transition-all duration-200"
            style={{ top: focusRect.top, left: focusRect.left, width: focusRect.width, height: focusRect.height }}
          />
          <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:max-w-[390px] pointer-events-auto">
            <div className="rounded-2xl border border-white/20 bg-gray-950 text-white shadow-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-mono uppercase tracking-wider text-indigo-300">{currentTutStep.title}</p>
                <span className="text-[10px] font-mono text-gray-300">{tutorialStep + 1}/{TUTORIAL_STEPS.length}</span>
              </div>
              <p className="text-sm leading-relaxed text-gray-100">{currentTutStep.text}</p>
              {!canAdvanceTutorial && (
                <p className="mt-2 text-[11px] leading-relaxed text-indigo-200">{currentTutStep.lockText}</p>
              )}
              <div className="mt-4 flex items-center justify-between gap-2">
                <button onClick={closeTutorial} className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-900 transition-colors">
                  Omitir
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={prevTutorialStep} disabled={tutorialStep === 0} className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                    Atrás
                  </button>
                  <button onClick={nextTutorialStep} disabled={!canAdvanceTutorial} className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-45 disabled:cursor-not-allowed">
                    {tutorialActionLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Scenario intro modal ── */}
      {scenarioIntroVisible && (
        <motion.div
          className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center bg-black/75 px-4 py-6"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          onClick={dismissScenarioIntro}
        >
          <motion.div
            className="w-full max-w-5xl rounded-[28px] border border-white/20 bg-white shadow-2xl overflow-hidden"
            initial={{ scale: 0.94, y: 18, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
          >
            <div className="bg-indigo-50/85 border-b border-indigo-200 px-5 py-4">
              <p className="text-[10px] font-mono text-indigo-700 uppercase tracking-[0.3em] mb-2">
                Presiona en cualquier lugar para continuar
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stage.scenarioLabel}</p>
                  <p className="text-2xl font-bold tracking-tight text-gray-900 mt-1">{stage.title}</p>
                </div>
                <p className="text-xs font-mono px-2.5 py-1 rounded-full bg-indigo-400/10 text-indigo-700 flex-shrink-0">
                  {stage.difficulty}
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{stage.summary}</p>
            </div>
            <div className="p-5">
              <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
                {Array.from({ length: gridSize }).map((_, row) =>
                  Array.from({ length: gridSize }).map((_, col) => {
                    const cell = grid[row][col];
                    return (
                      <div key={`intro-${row}-${col}`} className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-mono ${
                        cell === 1 ? "bg-gray-600 border border-gray-500"
                        : cell === 3 ? "bg-emerald-100 border border-emerald-400"
                        : cell === 2 ? "bg-gray-200 border border-gray-300"
                        : "bg-gray-50 border border-gray-200"
                      }`}>
                        {cell === 3 && <span className="text-emerald-700 text-[9px] font-bold">META</span>}
                        {cell === 1 && <span className="text-gray-300">■</span>}
                        {cell === 2 && <span className="text-gray-500 text-sm font-bold">{DIR_ARROW[config.startDir]}</span>}
                      </div>
                    );
                  })
                )}
              </div>
              <p className="mt-4 text-sm text-gray-700 leading-relaxed">{stage.objective}</p>
              <p className="mt-2 text-xs text-indigo-700 leading-relaxed">
                {isTutorial ? "Esta es la primera mision: un tutorial guiado paso a paso." : "Programa tu solucion y pruebala en el simulador antes de enviar al robot."}
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
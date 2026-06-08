"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import AppNav from "@/components/AppNav";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Code,
  Play,
  StopCircle,
  Plus,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { LEVEL_0_STAGES } from "@/lib/nivel-0";
import { unlockMissionAfterComplete } from "@/lib/progress";
import {
  type BlockType,
  type Dir,
  type EditorLevelContent,
  type MissionStage,
  type PaletteBlock,
} from "@/lib/levels";

type SimStatus = "idle" | "running" | "success" | "collision" | "oob" | "incomplete";
type TutorialTarget = "palette" | "play" | "none";

interface Block extends PaletteBlock {
  id: string;
}

interface SimState {
  pos: [number, number];
  dir: Dir;
  visited: Set<string>;
  status: SimStatus;
  message: string;
}

interface TutorialStep {
  title: string;
  text: string;
  target: TutorialTarget;
  lockText: string;
  blocksToPress?: BlockType[];
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "PASO 1 / ASISTENTE BEKIE",
    text: "¡Bienvenido al tutorial! Tu programa comienza con Iniciar mision. Arrastra el bloque Avanzar para mover al robot una celda hacia adelante.",
    target: "palette",
    lockText: "Arrastra el bloque Avanzar al área de programa.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 2 / ASISTENTE BEKIE",
    text: "Muy bien. Ahora arrastra un segundo bloque Avanzar para seguir recorriendo el camino.",
    target: "palette",
    lockText: "Arrastra otro bloque Avanzar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 3 / ASISTENTE BEKIE",
    text: "Necesitamos avanzar una celda más para llegar a la meta. Arrastra un tercer bloque Avanzar.",
    target: "palette",
    lockText: "Arrastra el tercer bloque Avanzar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 4 / ASISTENTE BEKIE",
    text: "¡Casi listo! Arrastra el bloque Detener al final de tu programa. Es obligatorio para concluir la secuencia sobre la meta.",
    target: "palette",
    lockText: "Agrega el bloque Detener al final.",
    blocksToPress: ["STOP"],
  },
  {
    title: "PASO 5 / ASISTENTE BEKIE",
    text: "¡El programa está listo! Presiona el botón Probar para iniciar la simulación y ver al robot recorrer el camino en 2D.",
    target: "play",
    lockText: "Presiona Probar para ver la simulación.",
  },
  {
    title: "PASO 6 / ASISTENTE BEKIE",
    text: "¡Excelente! El robot ha llegado a la meta con éxito. Presiona Terminar para completar el tutorial y desbloquear la siguiente misión.",
    target: "none",
    lockText: "Espera a que finalice la simulación.",
  },
];

const DIR_DELTA: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];
const DIR_ARROW = ["→", "↓", "←", "↑"];
const MAX_STEPS = 50;
const BLOCK_DRAG_MIME = "application/x-bekie-block";

interface BasicLevelEditorProps {
  config: EditorLevelContent;
  stage: MissionStage;
  missionIndex: number;
}

export default function BasicLevelEditor({
  config,
  stage,
  missionIndex,
}: BasicLevelEditorProps) {
  const router = useRouter();
  const showTutorial = missionIndex === 1;
  const gridSize = stage.grid.length;

  const [program, setProgram] = useState<Block[]>(() => [
    { ...config.palette[0], id: "b_1" },
  ]);
  const [sim, setSim] = useState<SimState>(() => {
    let startPos: [number, number] = [0, 0];
    for (let r = 0; r < stage.grid.length; r++) {
      const c = stage.grid[r].indexOf(2);
      if (c !== -1) startPos = [r, c];
    }
    return {
      pos: startPos,
      dir: config.startDir,
      visited: new Set([`${startPos[0]}-${startPos[1]}`]),
      status: "idle",
      message: "",
    };
  });

  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [scenarioIntroVisible, setScenarioIntroVisible] = useState(true);
  const [isProgramDropActive, setIsProgramDropActive] = useState(false);
  const [isDraggingBlock, setIsDraggingBlock] = useState(false);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const getPaletteBlock = useCallback(
    (type: BlockType) => config.palette.find((block) => block.type === type) ?? null,
    [config.palette]
  );

  const handlePaletteDragStart = (type: BlockType) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(BLOCK_DRAG_MIME, type);
    setIsDraggingBlock(true);
  };

  const handleProgramDragStart = (index: number) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("application/x-bekie-block-index", String(index));
    setIsDraggingBlock(true);
  };

  const handleProgramDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsProgramDropActive(true);
  };

  const handleProgramDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsProgramDropActive(false);

    const type = event.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType;
    if (!type) return;

    const def = getPaletteBlock(type);
    if (!def) return;
    addBlock(def);
  };

  const addBlock = (def: PaletteBlock) => {
    if (program.length >= 25) return;
    setProgram((current) => [
      ...current,
      {
        ...def,
        id: `b_${current.length + 1}_${Date.now()}`,
      },
    ]);
  };

  const insertBlockAt = (def: PaletteBlock, index: number) => {
    if (program.length >= 25) return;
    setProgram((current) => {
      const next = [...current];
      next.splice(index, 0, {
        ...def,
        id: `b_${next.length + 1}_${Date.now()}`,
      });
      return next;
    });
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    setProgram((current) => {
      const next = [...current];
      const [moved] = next.splice(fromIndex, 1);
      const targetIdx = toIndex > fromIndex ? toIndex - 1 : toIndex;
      next.splice(targetIdx, 0, moved);
      return next;
    });
  };

  const removeBlock = (id: string) => {
    setProgram((current) => current.filter((block, index) => index === 0 || block.id !== id));
  };

  const clearProgram = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setProgram([{ ...config.palette[0], id: "b_1" }]);
    resetSim();
  };

  const resetSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    let startPos: [number, number] = [0, 0];
    for (let r = 0; r < stage.grid.length; r++) {
      const c = stage.grid[r].indexOf(2);
      if (c !== -1) startPos = [r, c];
    }
    setSim({
      pos: startPos,
      dir: config.startDir,
      visited: new Set([`${startPos[0]}-${startPos[1]}`]),
      status: "idle",
      message: "",
    });
  };

  const currentTutorialStep = showTutorial && tutorialVisible ? TUTORIAL_STEPS[tutorialStep] : null;
  const isProgramDropGuideActive =
    showTutorial && tutorialVisible && currentTutorialStep?.target === "palette";

  const canAdvanceTutorial = useMemo(() => {
    if (!currentTutorialStep) return false;

    switch (tutorialStep) {
      case 0:
        return (
          program.length === 2 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "FORWARD"
        );
      case 1:
        return (
          program.length === 3 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "FORWARD" &&
          program[2]?.type === "FORWARD"
        );
      case 2:
        return (
          program.length === 4 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "FORWARD" &&
          program[2]?.type === "FORWARD" &&
          program[3]?.type === "FORWARD"
        );
      case 3:
        return (
          program.length === 5 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "FORWARD" &&
          program[2]?.type === "FORWARD" &&
          program[3]?.type === "FORWARD" &&
          program[4]?.type === "STOP"
        );
      case 4:
        return sim.status === "success";
      case 5:
        return true;
      default:
        return false;
    }
  }, [currentTutorialStep, program, tutorialStep, sim.status]);

  useEffect(() => {
    if (!showTutorial || !tutorialVisible || !currentTutorialStep) return;
    if (!canAdvanceTutorial || tutorialStep >= TUTORIAL_STEPS.length - 1) return;

    const timer = window.setTimeout(() => {
      setTutorialStep((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [canAdvanceTutorial, currentTutorialStep, showTutorial, tutorialStep, tutorialVisible]);

  const updateTargetRect = useCallback(() => {
    if (!showTutorial || !tutorialVisible) {
      setTargetRect(null);
      return;
    }

    let selector = "";
    if (tutorialStep === 0 || tutorialStep === 1 || tutorialStep === 2) {
      selector = "#btn-palette-forward";
    } else if (tutorialStep === 3) {
      selector = "#btn-palette-stop";
    } else if (tutorialStep === 4) {
      selector = "#btn-play-sim";
    }

    if (selector) {
      const el = document.querySelector(selector);
      if (el) {
        const r = el.getBoundingClientRect();
        setTargetRect({
          top: r.top,
          left: r.left,
          width: r.width,
          height: r.height,
        });
        return;
      }
    }

    setTargetRect(null);
  }, [showTutorial, tutorialStep, tutorialVisible]);

  useEffect(() => {
    updateTargetRect();
    const t = window.setTimeout(updateTargetRect, 120);

    let interval: number | undefined;
    if (showTutorial && tutorialVisible) {
      interval = window.setInterval(updateTargetRect, 250);
    }

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.clearTimeout(t);
      if (interval) window.clearInterval(interval);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect, tutorialStep, program, tutorialVisible, showTutorial]);

  const cardPlacementStyle = useMemo(() => {
    if (!targetRect) {
      return { bottom: "32px", left: "32px" };
    }

    const W = typeof window !== "undefined" ? window.innerWidth : 1200;
    const H = typeof window !== "undefined" ? window.innerHeight : 800;

    const isTargetInLeft = targetRect.left < W / 2;

    if (isTargetInLeft) {
      return { bottom: "32px", right: "32px" };
    }
    return { bottom: "32px", left: "32px" };
  }, [targetRect]);

  const runSimulation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    // Flat Compiler Validation
    if (program.length === 0 || program[0].type !== "INIT") {
      setAlertMessage("¡Huy! Tu robot no sabe por dónde empezar. 🚀 Pon el bloque Iniciar misión al principio.");
      return;
    }
    const hasStop = program.some((b) => b.type === "STOP");
    if (!hasStop) {
      setAlertMessage("¡Casi lo tienes! 🏁 Coloca el bloque Detener al final del todo para que el robot sepa que llegó a la meta.");
      return;
    }
    if (program[program.length - 1].type !== "STOP") {
      setAlertMessage("¡Ay! El bloque Detener debe ir al final de toda la secuencia. ¡Nada puede ir después de él!");
      return;
    }

    let startPos: [number, number] = [0, 0];
    for (let r = 0; r < stage.grid.length; r++) {
      const c = stage.grid[r].indexOf(2);
      if (c !== -1) startPos = [r, c];
    }

    let pos = [...startPos] as [number, number];
    let dir = config.startDir;
    const visited = new Set([`${pos[0]}-${pos[1]}`]);
    let stepCount = 0;
    let stepIdx = 0;

    const blocks = program.filter((b) => b.type !== "INIT");

    setSim({
      pos,
      dir,
      visited: new Set(visited),
      status: "running",
      message: "Simulacion iniciada.",
    });

    const getCell = (p: [number, number]) => stage.grid[p[0]]?.[p[1]] ?? null;

    const finish = (status: Exclude<SimStatus, "running" | "idle">, message: string) => {
      setSim({
        pos,
        dir,
        visited: new Set(visited),
        status,
        message,
      });

      if (status === "success" && typeof window !== "undefined") {
        unlockMissionAfterComplete(
          "bekie-level-0-progress",
          missionIndex,
          LEVEL_0_STAGES.length
        );
      }
    };

    const tick = () => {
      if (stepCount++ > MAX_STEPS) {
        finish("incomplete", "Límite de pasos alcanzado sin detenerse.");
        return;
      }

      if (stepIdx >= blocks.length) {
        if (getCell(pos) === 3) {
          finish("success", "¡Llegaste a la meta!");
        } else {
          finish("incomplete", "El robot no llegó a la meta. Revisa el orden.");
        }
        return;
      }

      const block = blocks[stepIdx++];

      switch (block.type) {
        case "FORWARD": {
          const delta = DIR_DELTA[dir];
          const next: [number, number] = [pos[0] + delta[0], pos[1] + delta[1]];
          const cell = getCell(next);

          if (cell === null) {
            pos = next;
            visited.add(`${next[0]}-${next[1]}`);
            finish("oob", "El robot salió del tablero.");
            return;
          }
          if (cell === 1) {
            pos = next;
            visited.add(`${next[0]}-${next[1]}`);
            finish("collision", "El robot chocó con un obstáculo.");
            return;
          }
          pos = next;
          visited.add(`${next[0]}-${next[1]}`);
          break;
        }
        case "BACKWARD": {
          const backDir = ((dir + 2) % 4) as Dir;
          const delta = DIR_DELTA[backDir];
          const next: [number, number] = [pos[0] + delta[0], pos[1] + delta[1]];
          const cell = getCell(next);

          if (cell === null) {
            pos = next;
            visited.add(`${next[0]}-${next[1]}`);
            finish("oob", "El robot salió del tablero.");
            return;
          }
          if (cell === 1) {
            pos = next;
            visited.add(`${next[0]}-${next[1]}`);
            finish("collision", "El robot chocó con un obstáculo.");
            return;
          }
          pos = next;
          visited.add(`${next[0]}-${next[1]}`);
          break;
        }
        case "TURN_RIGHT":
          dir = ((dir + 1) % 4) as Dir;
          break;
        case "TURN_LEFT":
          dir = ((dir + 3) % 4) as Dir;
          break;
        case "WAIT":
          break;
        case "STOP":
          if (getCell(pos) === 3) {
            finish("success", "¡Llegaste a la meta y te detuviste!");
          } else {
            finish("incomplete", "El robot se detuvo antes de la meta.");
          }
          return;
        default:
          break;
      }

      setSim({
        pos,
        dir,
        visited: new Set(visited),
        status: "running",
        message: `Ejecutando: ${block.label}`,
      });

      if (getCell(pos) === 3 && stepIdx < blocks.length && blocks[stepIdx].type === "STOP") {
        // Continue to final STOP block
      } else if (getCell(pos) === 3 && stepIdx >= blocks.length) {
        finish("success", "¡Llegaste a la meta!");
        return;
      }

      timerRef.current = setTimeout(tick, 450);
    };

    timerRef.current = setTimeout(tick, 450);
  };

  const stopSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim((current) => ({ ...current, status: "idle", message: "" }));
  };

  const isPaletteHighlighted = (type: BlockType) => {
    if (!showTutorial || !tutorialVisible) return false;
    return (
      (type === "FORWARD" && (tutorialStep === 0 || tutorialStep === 1 || tutorialStep === 2)) ||
      (type === "STOP" && tutorialStep === 3)
    );
  };

  const isPlayHighlighted = showTutorial && tutorialVisible && tutorialStep === 4;

  const handleNextStage = () => {
    router.push(`/levels/1/editor?mission=${missionIndex + 1}`);
  };
  const handleLevel1Redirect = () => {
    router.push("/levels/2/mission");
  };

  const DropIndicator = ({ index }: { index: number }) => {
    const [isOver, setIsOver] = useState(false);
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Prevent container onDragOver
          setIsOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setIsOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation(); // Crucial! Prevent event bubbling to parent onDrop
          setIsOver(false);

          // Check if reordering an existing block
          const reorderIdxStr = e.dataTransfer.getData("application/x-bekie-block-index");
          if (reorderIdxStr) {
            const fromIndex = Number(reorderIdxStr);
            if (!Number.isNaN(fromIndex)) {
              moveBlock(fromIndex, index);
              return;
            }
          }

          // Otherwise it's a new block drop
          const type = e.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType;
          if (!type) return;
          const def = getPaletteBlock(type);
          if (!def) return;
          insertBlockAt(def, index);
        }}
        className={`w-full h-2 -my-1.5 transition-all duration-150 relative flex items-center justify-center z-30 ${
          isOver || isDraggingBlock ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className={`w-full rounded-full transition-all duration-150 ${
            isOver
              ? "h-[4px] bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
              : "h-[2px] bg-cyan-400/30"
          }`}
        />
      </div>
    );
  };

  return (
    <div className="relative min-h-[100dvh] bg-white flex flex-col overflow-x-hidden select-none">
      <AppNav userName="Beymar" role="student" />

      {/* Intro Modal */}
      {scenarioIntroVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] p-4 animate-fade-in">
          <div className="w-full max-w-[450px] bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-8 text-center transition-all duration-300">
            <p className="text-[11px] font-semibold font-mono text-cyan-600 uppercase tracking-widest mb-1.5">
              NIVEL 0 - BÁSICO / MISIÓN {missionIndex}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{stage.title}</h2>

            <div
              className="aspect-square w-full max-w-[260px] mx-auto border border-gray-100 bg-gray-50/50 rounded-2xl p-4 mb-6 grid gap-2"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((_, c) => {
                  const isStart = stage.grid[r][c] === 2;
                  const isGoal = stage.grid[r][c] === 3;
                  const isObstacle = stage.grid[r][c] === 1;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                        isStart
                          ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/20"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-300 text-emerald-700 font-bold"
                          : isObstacle
                          ? "bg-gray-600 text-white"
                          : "bg-white border border-gray-100 shadow-sm"
                      }`}
                    >
                      {isStart && "→"}
                      {isGoal && "META"}
                    </div>
                  );
                })
              )}
            </div>

            <div className="rounded-2xl border border-cyan-100/65 bg-cyan-50/40 p-5 text-left mb-6">
              <p className="text-[10px] font-bold font-mono text-cyan-600 uppercase tracking-wider mb-2">
                INSTRUCCIONES DEL ESCENARIO
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-mono">
                {stage.summary}
              </p>
            </div>

            <button
              onClick={() => {
                setScenarioIntroVisible(false);
                if (showTutorial) setTutorialVisible(true);
              }}
              className="btn-press bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-cyan-600/20 transition-all duration-200 w-full"
            >
              {showTutorial ? "Comenzar tutorial" : "Comenzar mision"}
            </button>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link
          href="/levels/1/mission"
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Misión
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">
          {config.level} - {config.levelSlug} / {stage.title}
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
              id="btn-play-sim"
              onClick={runSimulation}
              disabled={program.length < 2}
              className={`btn-press flex items-center gap-1.5 text-xs text-white font-semibold px-4 py-1.5 rounded-lg transition-all duration-300 ${
                isPlayHighlighted
                  ? "bg-cyan-700 ring-4 ring-cyan-500 ring-offset-2 animate-pulse scale-105 z-50 relative border-2 border-white shadow-xl"
                  : "bg-cyan-600 hover:bg-cyan-700 disabled:opacity-40 disabled:cursor-not-allowed"
              }`}
            >
              <Play size={13} weight="fill" />
              Probar
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block Palette */}
        <div className="w-[230px] lg:w-[250px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto">
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 px-1">
              Bloques
            </p>
            <div className="mb-3 rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[11px] leading-relaxed text-cyan-700">
              Ruta secuencial: usa bloques simples de movimiento y orientación para alcanzar la meta.
            </div>
            <div className="flex flex-col gap-1.5">
              {config.palette.map((def, i) => {
                const highlighted = isPaletteHighlighted(def.type);
                return (
                  <button
                    id={`btn-palette-${def.type.toLowerCase()}`}
                    key={`${def.type}-${i}`}
                    type="button"
                    draggable
                    onDragStart={handlePaletteDragStart(def.type)}
                    onDragEnd={() => {
                      setIsProgramDropActive(false);
                      setIsDraggingBlock(false);
                    }}
                    className={`block-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      highlighted
                        ? "border-cyan-500 ring-4 ring-cyan-500 ring-offset-1 bg-cyan-50 animate-pulse text-cyan-900 z-50 relative scale-[1.03] shadow-md"
                        : def.colorClass
                    } hover:brightness-105 cursor-grab active:cursor-grabbing`}
                  >
                    <span className="flex-shrink-0">{def.icon}</span>
                    <span className="text-xs font-mono flex-1">{def.label}</span>
                    <span className="text-[10px] font-mono opacity-60 flex-shrink-0">Arrastra</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Program Editor Panel */}
        <div
          className={`flex-1 flex flex-col min-w-0 border-r border-gray-300 bg-gray-50/50 transition-all ${
            isProgramDropGuideActive
              ? "bg-cyan-50/30 ring-4 ring-inset ring-cyan-400/85 shadow-[0_0_0_1px_rgba(6,182,212,0.22),0_0_42px_rgba(6,182,212,0.32)]"
              : ""
          }`}
        >
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Programa ({program.length}/25)
            </p>
            {isProgramDropGuideActive && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-700 bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-full">
                Suelta aquí
              </span>
            )}
          </div>

          <div
            className={`relative flex-1 overflow-y-auto p-4 w-full transition-all ${
              isProgramDropActive ? "bg-cyan-50/70" : ""
            } ${
              isProgramDropGuideActive
                ? "bg-cyan-50/60 ring-4 ring-inset ring-cyan-400/70 shadow-[inset_0_0_0_1px_rgba(6,182,212,0.14)]"
                : ""
            }`}
            onDragOver={handleProgramDragOver}
            onDrop={handleProgramDrop}
          >
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(6,182,212,0.26),transparent_58%)] animate-pulse" />
            )}
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-cyan-300/90 bg-cyan-100/20 shadow-[0_0_0_1px_rgba(6,182,212,0.18),0_0_38px_rgba(6,182,212,0.34)]" />
            )}
            {isProgramDropGuideActive && (
              <div className="relative z-10 mb-2 flex items-center justify-between rounded-lg border border-cyan-200 bg-cyan-50 px-3 py-2 text-[10px] font-mono text-cyan-700 uppercase tracking-wider shadow-[0_0_24px_rgba(6,182,212,0.18)]">
                <span>Arrastra y suelta los bloques aquí</span>
                <span>Zona activa</span>
              </div>
            )}

            <div className="relative z-10 flex flex-col gap-1 min-h-full pb-8">
              {/* Block 0 (Iniciar mision) is always at index 0 */}
              {program.length > 0 && (
                <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border bg-emerald-50/40 border-emerald-200">
                  <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">1</span>
                  <span className="flex-shrink-0">{program[0].icon}</span>
                  <span className="text-xs font-mono flex-1">{program[0].label}</span>
                </div>
              )}

              {/* Loop starting at index 1 */}
              {program.slice(1).map((block, sliceIdx) => {
                const actualIndex = sliceIdx + 1;
                return (
                  <div key={block.id} className="contents">
                    <DropIndicator index={actualIndex} />
                    
                    <div
                      draggable
                      onDragStart={handleProgramDragStart(actualIndex)}
                      onDragEnd={() => setIsDraggingBlock(false)}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${block.colorClass} cursor-grab active:cursor-grabbing hover:shadow-sm transition-all`}
                    >
                      <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0 select-none">
                        {actualIndex + 1}
                      </span>
                      <span className="flex-shrink-0 select-none">{block.icon}</span>
                      <span className="text-xs font-mono flex-1 select-none">{block.label}</span>
                      <button
                        onClick={() => removeBlock(block.id)}
                        className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-auto cursor-pointer"
                      >
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* End drop indicator if program has blocks besides INIT */}
              {program.length > 1 && (
                <DropIndicator index={program.length} />
              )}

              {program.length < 2 && (
                <div className="flex items-center justify-center gap-2 py-8 px-4 text-xs text-gray-400 border border-dashed border-gray-300 bg-white/85 rounded-xl shadow-sm">
                  <Plus size={14} />
                  Arrastra bloques desde el panel izquierdo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2D Simulator Pane */}
        <div className="w-[300px] lg:w-[340px] flex-shrink-0 flex flex-col border-l border-gray-200">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Simulador & Consola
            </p>
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Visual Grid representation */}
            <div
              className="aspect-square w-full max-w-[280px] mx-auto border border-gray-200 bg-gray-50 rounded-xl p-3 grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((_, c) => {
                  const cell = stage.grid[r][c];
                  const isRobot = sim.pos[0] === r && sim.pos[1] === c;
                  const isVisited = sim.visited.has(`${r}-${c}`) && !isRobot;
                  const isObstacle = cell === 1;
                  const isGoal = cell === 3;
                  const isStart = cell === 2 && !isRobot;

                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`rounded flex items-center justify-center font-bold text-[9px] aspect-square transition-all duration-200 ${
                        isRobot
                          ? "bg-cyan-600 text-white shadow-md"
                          : isObstacle
                          ? "bg-gray-600 border border-gray-500 text-white"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-400 text-emerald-700"
                          : isStart
                          ? "bg-gray-200 border border-gray-300 text-gray-500"
                          : isVisited
                          ? "bg-cyan-100 border border-cyan-300"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {isRobot && <span>{DIR_ARROW[sim.dir]}</span>}
                      {isGoal && !isRobot && <span>META</span>}
                      {isObstacle && <span className="text-gray-300">■</span>}
                    </div>
                  );
                })
              )}
            </div>

            {/* Status card */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                sim.status === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : sim.status === "collision" || sim.status === "oob" || sim.status === "incomplete"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {sim.status === "success" ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                ) : sim.status === "collision" || sim.status === "oob" || sim.status === "incomplete" ? (
                  <Warning size={18} weight="fill" className="text-red-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                )}
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {sim.status === "success"
                    ? "Exito"
                    : sim.status === "running"
                    ? "Ejecutando..."
                    : "Esperando simulación"}
                </span>
              </div>
              <p className="text-xs leading-relaxed">
                {sim.message || "Arma tu secuencia y presiona Probar."}
              </p>
            </div>

            {/* Info Cards */}
            {sim.status === "success" && (
              <div className="p-4 rounded-xl border border-emerald-300 bg-emerald-50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-emerald-850">
                  <CheckCircle size={18} weight="fill" className="text-emerald-600" />
                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                    {missionIndex === LEVEL_0_STAGES.length ? "¡Nivel Completado!" : "Misión Completada"}
                  </span>
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed font-mono">
                  {missionIndex === LEVEL_0_STAGES.length
                    ? "¡Felicidades! Has completado el Nivel 0 básico. Ahora estás listo para el Nivel 1, donde programarás al robot real (ESP32) usando sensores y lógica condicional."
                    : `Has superado con éxito la misión ${missionIndex}.`}
                </p>
                {missionIndex < LEVEL_0_STAGES.length ? (
                  <button
                    onClick={handleNextStage}
                    className="btn-press w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    Siguiente misión
                    <ArrowRight size={13} weight="bold" />
                  </button>
                ) : (
                  <button
                    onClick={handleLevel1Redirect}
                    className="btn-press w-full flex items-center justify-center gap-1.5 bg-emerald-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-emerald-500 transition-colors"
                  >
                    Comenzar Nivel 1 (Robot Real)
                    <ArrowRight size={13} weight="bold" />
                  </button>
                )}
              </div>
            )}

            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                {stage.scenarioLabel}
              </p>
              <h4 className="font-bold text-sm text-gray-800">{stage.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{stage.summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Spotlight Backdrop Highlights for Tutorial */}
      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: tutorialStep === 4 ? "9999px" : "12px",
            boxShadow: "0 0 0 9999px rgba(9, 13, 22, 0.55)",
            zIndex: 39,
          }}
        />
      )}

      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200 animate-pulse"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: tutorialStep === 4 ? "9999px" : "12px",
            border: "5px solid #ffffff",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.9)",
            zIndex: 40,
          }}
        />
      )}

      {/* Tutorial Assistant Floating Draggable Card */}
      {showTutorial && tutorialVisible && currentTutorialStep && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          className="fixed w-[380px] bg-[#090d16] border border-slate-800 shadow-2xl shadow-black/85 rounded-3xl p-6 flex flex-col gap-4 select-none cursor-grab active:cursor-grabbing"
          style={{ zIndex: 45, ...cardPlacementStyle }}
        >
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-slate-850 rounded-full mx-auto -mt-2 opacity-60" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11px] font-bold font-mono text-cyan-400 uppercase tracking-widest">
              PASO {tutorialStep + 1}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {tutorialStep + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            {currentTutorialStep.text}
          </p>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400 text-[11px] font-bold font-mono shadow-md">
                0
              </div>
              <button
                onClick={() => setTutorialVisible(false)}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Omitir
              </button>
            </div>

            <div className="flex gap-2">
              {tutorialStep > 0 && (
                <button
                  onClick={() => setTutorialStep((current) => Math.max(0, current - 1))}
                  className="border border-slate-850 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Atrás
                </button>
              )}
              {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                <button
                  onClick={() => setTutorialVisible(false)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition-all"
                >
                  Terminar
                </button>
              ) : (
                <button
                  disabled={!canAdvanceTutorial}
                  onClick={() => setTutorialStep((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1))}
                  className={`font-bold text-xs px-4 py-2 rounded-xl transition-all ${
                    canAdvanceTutorial
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30 cursor-pointer"
                      : "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed"
                  }`}
                >
                  {canAdvanceTutorial ? "Siguiente" : "Completa el paso"}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Custom Warn Dialog Overlay */}
      {alertMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-[4px] p-4 animate-fade-in">
          <div className="w-full max-w-[360px] bg-white rounded-3xl border border-amber-100 shadow-2xl p-7 flex flex-col items-center text-center gap-5 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 text-amber-500 shadow-sm animate-bounce">
              <Warning size={32} weight="fill" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">¡Un pequeño ajuste! 🤖</h3>
              <p className="text-xs text-gray-600 leading-relaxed font-medium mt-2 px-1">
                {alertMessage}
              </p>
            </div>
            <button
              onClick={() => setAlertMessage(null)}
              className="btn-press w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm py-3.5 px-6 rounded-xl shadow-lg shadow-cyan-600/20 transition-all duration-150 cursor-pointer"
            >
              ¡Entendido! Lo arreglo ahora
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

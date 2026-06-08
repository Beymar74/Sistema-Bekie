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
  CheckCircle,
  Code,
  Plus,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { saveRobotLoadPayload } from "@/lib/progress";
import {
  type BlockType,
  type Dir,
  type EditorLevelContent,
  type MissionStage,
  type PaletteBlock,
} from "@/lib/levels";

type CompilerStatus = "idle" | "success" | "error";
type TutorialTarget = "palette" | "program" | "compile" | "load";

interface Block extends PaletteBlock {
  id: string;
  steps?: number;
}

type ProgramViewItem =
  | {
      kind: "block";
      block: Block;
      index: number;
    }
  | {
      kind: "conditional";
      block: Block;
      index: number;
      ifBranch?: Block;
      ifIndex?: number;
      elseBranch?: Block;
      elseIndex?: number;
      ifLoopBody?: ProgramViewItem[];
      elseLoopBody?: ProgramViewItem[];
    }
  | {
      kind: "loop";
      block: Block;
      index: number;
      body: ProgramViewItem[];
      bodyStartIndex: number;
    };

interface CompilerIssue {
  message: string;
  index?: number;
}

interface CompilerResult {
  status: CompilerStatus;
  message: string;
  issues: CompilerIssue[];
  highlightIndexes: number[];
}

interface TutorialStep {
  title: string;
  text: string;
  target: TutorialTarget;
  lockText: string;
  blocksToPress?: BlockType[];
}

const BLOCK_LABELS: Partial<Record<BlockType, string>> = {
  INIT: "Iniciar mision",
  FORWARD: "Avanzar",
  BACKWARD: "Retroceder",
  TURN_RIGHT: "Girar derecha",
  TURN_LEFT: "Girar izquierda",
  WAIT: "Esperar",
  STOP: "Detener",
  IF_OBS: "Si hay obstaculo",
  IF_OBS_ELSE: "Si hay obstaculo / Si no hay obstaculo",
  WHILE_GOAL: "Mientras no llegue",
  REPEAT: "Repetir N veces",
};

const BLOCK_DRAG_MIME = "application/x-bekie-block";

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "PASO 1 / ASISTENTE BEKIE",
    text: "Tu programa ya empieza con Iniciar mision. Ahora arrastra Si hay obstaculo / Si no hay obstaculo para crear la decision con dos ramas.",
    target: "palette",
    lockText: "Agrega el bloque de decision para continuar.",
    blocksToPress: ["IF_OBS_ELSE"],
  },
  {
    title: "PASO 2 / ASISTENTE BEKIE",
    text: "Arrastra Girar derecha. Este bloque va en la rama del obstaculo: indica que el robot debe girar cuando el camino este bloqueado.",
    target: "palette",
    lockText: "Agrega Girar derecha en la rama del obstaculo para continuar.",
    blocksToPress: ["TURN_RIGHT"],
  },
  {
    title: "PASO 3 / ASISTENTE BEKIE",
    text: "Arrastra Avanzar. Este bloque va en la rama libre (Si no hay obstaculo): el robot avanza una casilla cuando el camino esta despejado.",
    target: "palette",
    lockText: "Agrega Avanzar en la rama libre para continuar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 4 / ASISTENTE BEKIE",
    text: "Arrastra Avanzar otra vez. Este avance va fuera de la decision, despues de las dos ramas, para completar el recorrido hasta la meta.",
    target: "palette",
    lockText: "Agrega un Avanzar fuera de la decision para continuar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 5 / ASISTENTE BEKIE",
    text: "Arrastra Detener al final del programa para cerrar la secuencia correctamente.",
    target: "palette",
    lockText: "Agrega Detener al final para continuar.",
    blocksToPress: ["STOP"],
  },
  {
    title: "PASO 6 / ASISTENTE BEKIE",
    text: "Pulsa Compilar para simular el recorrido. Si algo queda mal, los bloques se marcaran en rojo. Si todo esta bien, avanzaremos al siguiente paso.",
    target: "compile",
    lockText: "Compila la secuencia correcta para continuar.",
  },
  {
    title: "PASO 7 / ASISTENTE BEKIE",
    text: "Compilacion exitosa. Pulsa Cargar para abrir la ventana de conexion, ver cada instruccion enviada y el tiempo de recorrido.",
    target: "load",
    lockText: "Primero necesitas una compilacion exitosa para cargar el programa.",
  },
];

interface IntermediateLevelEditorProps {
  config: EditorLevelContent;
  stage: MissionStage;
  missionIndex: number;
}

export default function IntermediateLevelEditor({
  config,
  stage,
  missionIndex,
}: IntermediateLevelEditorProps) {
  const router = useRouter();
  const showTutorial = missionIndex === 1;
  const gridSize = stage.grid.length;
  const [program, setProgram] = useState<Block[]>(() => [{ ...config.palette[0], id: "b_1" }]);
  const [compilerResult, setCompilerResult] = useState<CompilerResult>({
    status: "idle",
    message: "Agrega bloques al programa para habilitar el compilador.",
    issues: [],
    highlightIndexes: [],
  });
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [executionTrace, setExecutionTrace] = useState<string[]>([]);
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
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const programRef = useRef<HTMLDivElement | null>(null);
  const compileRef = useRef<HTMLButtonElement | null>(null);

  const normalizeStepCount = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.min(9, Math.floor(value)));
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

  const handleProgramDragEnd = () => {
    setIsDraggingBlock(false);
    setIsProgramDropActive(false);
  };

  const insertBlockAt = (def: PaletteBlock, index: number) => {
    if (program.length >= 25) return;
    setProgram((current) => {
      const next = [...current];
      next.splice(index, 0, {
        ...def,
        id: `b_${next.length + 1}_${Date.now()}`,
        ...(def.type === "FORWARD" ? { steps: 1 } : {}),
        ...(def.type === "REPEAT" ? { steps: 4 } : {}),
      });
      return next;
    });
    setCompilerResult({
      status: "idle",
      message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
      issues: [],
      highlightIndexes: [],
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
    setCompilerResult({
      status: "idle",
      message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
      issues: [],
      highlightIndexes: [],
    });
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
        ...(def.type === "FORWARD" ? { steps: 1 } : {}),
        ...(def.type === "REPEAT" ? { steps: 4 } : {}),
      },
    ]);
    setCompilerResult({
      status: "idle",
      message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
      issues: [],
      highlightIndexes: [],
    });
  };

  const removeBlock = (id: string) => {
    setProgram((current) => {
      const index = current.findIndex((block) => block.id === id);
      if (index <= 0) return current;

      const block = current[index];
      const removeCount =
        block.type === "IF_OBS_ELSE"
          ? current[index + 1]?.type === "WHILE_GOAL" ||
            current[index + 1]?.type === "REPEAT" ||
            current[index + 2]?.type === "WHILE_GOAL" ||
            current[index + 2]?.type === "REPEAT"
            ? current.length - index
            : 3
          : block.type === "WHILE_GOAL" || block.type === "REPEAT"
          ? current.length - index
          : 1;
      return current.filter((_, currentIndex) => currentIndex < index || currentIndex >= index + removeCount);
    });
    setCompilerResult({
      status: "idle",
      message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
      issues: [],
      highlightIndexes: [],
    });
  };

  const clearProgram = () => {
    setProgram([{ ...config.palette[0], id: "b_1" }]);
    setCompilerResult({
      status: "idle",
      message: "Secuencia reiniciada. Agrega bloques para volver a compilar.",
      issues: [],
      highlightIndexes: [],
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
          program[1]?.type === "IF_OBS_ELSE"
        );
      case 1:
        return (
          program.length === 3 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "IF_OBS_ELSE" &&
          program[2]?.type === "TURN_RIGHT"
        );
      case 2:
        return (
          program.length === 4 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "IF_OBS_ELSE" &&
          program[2]?.type === "TURN_RIGHT" &&
          program[3]?.type === "FORWARD"
        );
      case 3:
        return (
          program.length === 5 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "IF_OBS_ELSE" &&
          program[2]?.type === "TURN_RIGHT" &&
          program[3]?.type === "FORWARD" &&
          program[4]?.type === "FORWARD"
        );
      case 4:
        return (
          program.length === 6 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "IF_OBS_ELSE" &&
          program[2]?.type === "TURN_RIGHT" &&
          program[3]?.type === "FORWARD" &&
          program[4]?.type === "FORWARD" &&
          program[5]?.type === "STOP"
        );
      case 5:
        return compilerResult.status === "success";
      case 6:
        return true;
      default:
        return false;
    }
  }, [compilerResult.status, currentTutorialStep, program, tutorialStep]);

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
    if (tutorialStep === 0) {
      selector = "#btn-palette-if_obs_else";
    } else if (tutorialStep === 1) {
      selector = "#btn-palette-turn_right";
    } else if (tutorialStep === 2 || tutorialStep === 3) {
      selector = "#btn-palette-forward";
    } else if (tutorialStep === 4) {
      selector = "#btn-palette-stop";
    } else if (tutorialStep === 5) {
      selector = "#btn-compile";
    } else if (tutorialStep === 6) {
      selector = "#btn-load";
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
    const isTargetInBottom = targetRect.top > H / 2;

    if (isTargetInLeft && isTargetInBottom) {
      return { bottom: "32px", right: "32px" };
    }

    if (isTargetInLeft && !isTargetInBottom) {
      return { bottom: "32px", right: "32px" };
    }

    if (!isTargetInLeft && !isTargetInBottom) {
      return { bottom: "32px", left: "32px" };
    }

    return { bottom: "32px", right: "32px" };
  }, [targetRect]);

  const canCompile = program.length > 1;
  const programView = useMemo(() => {
    const stopIndex = program.findIndex((block) => block.type === "STOP");

    const buildView = (startIndex: number, endIndex: number = program.length): ProgramViewItem[] => {
      const items: ProgramViewItem[] = [];

      for (let index = startIndex; index < endIndex; index += 1) {
        const block = program[index];
        if (!block) break;

        if (block.type === "STOP") {
          items.push({ kind: "block", block, index });
          break;
        }

        if (block.type === "IF_OBS_ELSE") {
          const ifBranch = program[index + 1];
          const elseBranch = program[index + 2];
          const loopEndIndex = stopIndex !== -1 && stopIndex > index ? stopIndex : endIndex;
          const loopBody = buildView(index + 3, loopEndIndex);

          items.push({
            kind: "conditional",
            block,
            index,
            ifBranch,
            ifIndex: index + 1,
            elseBranch,
            elseIndex: index + 2,
            ifLoopBody: ifBranch?.type === "WHILE_GOAL" || ifBranch?.type === "REPEAT" ? loopBody : undefined,
            elseLoopBody: elseBranch?.type === "WHILE_GOAL" || elseBranch?.type === "REPEAT" ? loopBody : undefined,
          });
          if (
            ifBranch?.type === "WHILE_GOAL" ||
            ifBranch?.type === "REPEAT" ||
            elseBranch?.type === "WHILE_GOAL" ||
            elseBranch?.type === "REPEAT"
          ) {
            if (loopEndIndex > index) {
              index = loopEndIndex - 1;
            }
            continue;
          }

          index += 2;
          continue;
        }

        if (block.type === "WHILE_GOAL" || block.type === "REPEAT") {
          const loopEndIndex = stopIndex !== -1 && stopIndex > index ? stopIndex : endIndex;
          items.push({
            kind: "loop",
            block,
            index,
            body: buildView(index + 1, loopEndIndex),
            bodyStartIndex: index + 1,
          });
          if (loopEndIndex > index) {
            index = loopEndIndex - 1;
          }
          continue;
        }

        items.push({ kind: "block", block, index });
      }

      return items;
    };

    return buildView(0);
  }, [program]);

  const DropIndicator = ({ index }: { index: number }) => {
    const [isOver, setIsOver] = useState(false);
    return (
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOver(true);
        }}
        onDragLeave={(e) => {
          e.stopPropagation();
          setIsOver(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOver(false);

          const reorderIdxStr = e.dataTransfer.getData("application/x-bekie-block-index");
          if (reorderIdxStr) {
            const fromIndex = Number(reorderIdxStr);
            if (!Number.isNaN(fromIndex)) {
              moveBlock(fromIndex, index);
              return;
            }
          }

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

  const renderBlockRow = (
    block: Block,
    index: number,
    options?: { nested?: boolean; className?: string; allowSteps?: boolean }
  ) => {
    const isHighlighted = compilerResult.highlightIndexes.includes(index);
    const nested = options?.nested ?? false;
    const showSteps = block.type === "FORWARD";

    return (
      <div
        key={block.id}
        draggable={index > 0}
        onDragStart={handleProgramDragStart(index)}
        onDragEnd={handleProgramDragEnd}
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${block.colorClass} ${
          isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
        } ${options?.className ?? ""} ${nested ? "shadow-sm" : ""} ${
          index > 0 ? "cursor-grab active:cursor-grabbing" : ""
        }`}
      >
        <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
          {index + 1}
        </span>
        <span className="flex-shrink-0">{block.icon}</span>
        <span className="text-xs font-mono flex-1">{block.label}</span>
        {showSteps && (
          <label
            className="flex items-center gap-1 rounded-md border border-cyan-200 bg-white px-2 py-1 text-[10px] font-mono text-cyan-700"
            onClick={(event) => event.stopPropagation()}
          >
            <span>N</span>
            <input
              type="number"
              min={1}
              max={9}
              step={1}
              value={normalizeStepCount(block.steps ?? 1)}
              onChange={(event) => {
                const nextSteps = normalizeStepCount(Number(event.target.value));
                setProgram((current) =>
                  current.map((currentBlock) =>
                    currentBlock.id === block.id
                      ? { ...currentBlock, steps: nextSteps }
                      : currentBlock
                  )
                );
                setCompilerResult({
                  status: "idle",
                  message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
                  issues: [],
                  highlightIndexes: [],
                });
              }}
              className="w-9 bg-transparent text-center text-[10px] font-mono outline-none"
            />
          </label>
        )}
        {index > 0 && (
          <button
            onClick={(event) => {
              event.stopPropagation();
              removeBlock(block.id);
            }}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0 ml-auto"
          >
            <X size={13} />
          </button>
        )}
      </div>
    );
  };

  const renderLoopCard = (
    block: Block,
    index: number,
    bodyChildren: ReactNode[],
    bodyPlaceholder: string
  ) => {
    const isHighlighted = compilerResult.highlightIndexes.includes(index);

    return (
      <div
        key={block.id}
        draggable={index > 0}
        onDragStart={handleProgramDragStart(index)}
        onDragEnd={handleProgramDragEnd}
        className={`rounded-xl border ${block.colorClass} ${
          isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
        } overflow-hidden ${index > 0 ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        <div className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
          <div className="flex flex-1 items-center gap-2.5 text-left">
            <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
              {index + 1}
            </span>
            <span className="flex-shrink-0">{block.icon}</span>
            <span className="text-xs font-mono flex-1">{block.label}</span>
            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
              Repite lo de abajo
            </span>
          </div>
          {block.type === "REPEAT" && (
            <label
              className="flex items-center gap-1 rounded-md border border-indigo-200 bg-white px-2 py-1 text-[10px] font-mono text-indigo-700 mr-2"
              onClick={(event) => event.stopPropagation()}
            >
              <span>N</span>
              <input
                type="number"
                min={1}
                max={9}
                step={1}
                value={normalizeStepCount(block.steps ?? 4)}
                onChange={(event) => {
                  const nextSteps = normalizeStepCount(Number(event.target.value));
                  setProgram((current) =>
                    current.map((currentBlock) =>
                      currentBlock.id === block.id
                        ? { ...currentBlock, steps: nextSteps }
                        : currentBlock
                    )
                  );
                  setCompilerResult({
                    status: "idle",
                    message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
                    issues: [],
                    highlightIndexes: [],
                  });
                }}
                className="w-9 bg-transparent text-center text-[10px] font-mono outline-none"
              />
            </label>
          )}
          <button
            type="button"
            onClick={() => removeBlock(block.id)}
            className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
          >
            <X size={13} />
          </button>
        </div>

        <div className="px-3 pb-3">
          <div className="rounded-lg border border-white/70 bg-white/75 p-2.5">
            <div className={`mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider ${
              block.type === "REPEAT" ? "text-indigo-600" : "text-violet-600"
            }`}>
              {block.type === "REPEAT" ? "Repetir N veces" : "Mientras no llegue"}
            </div>
            {bodyChildren.length > 0 ? (
              <div className="flex flex-col gap-1.5">
                {bodyChildren}
                <DropIndicator index={index + bodyChildren.length + 1} />
              </div>
            ) : (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const reorderIdxStr = e.dataTransfer.getData("application/x-bekie-block-index");
                  if (reorderIdxStr) {
                    const fromIndex = Number(reorderIdxStr);
                    if (!Number.isNaN(fromIndex)) {
                      moveBlock(fromIndex, index + 1);
                      return;
                    }
                  }
                  const type = e.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType;
                  if (!type) return;
                  const def = getPaletteBlock(type);
                  if (!def) return;
                  insertBlockAt(def, index + 1);
                }}
                className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500"
              >
                {bodyPlaceholder}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderProgramItems = (
    items: ProgramViewItem[],
    nested = false,
    allowSteps = false
  ): ReactNode[] => {
    const nodes: ReactNode[] = [];
    items.forEach((item) => {
      if (item.kind === "block") {
        if (item.index > 0) {
          nodes.push(<DropIndicator key={`drop-${item.block.id}`} index={item.index} />);
        }
        nodes.push(renderBlockRow(item.block, item.index, { nested, allowSteps }));
      } else if (item.kind === "conditional") {
        if (item.index > 0) {
          nodes.push(<DropIndicator key={`drop-${item.block.id}`} index={item.index} />);
        }
        const isHighlighted = [item.index, item.ifIndex, item.elseIndex].some((index) =>
          typeof index === "number" ? compilerResult.highlightIndexes.includes(index) : false
        );

        nodes.push(
          <div
            key={item.block.id}
            draggable={item.index > 0}
            onDragStart={handleProgramDragStart(item.index)}
            onDragEnd={handleProgramDragEnd}
            className={`rounded-xl border ${item.block.colorClass} ${
              isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
            } overflow-hidden ${item.index > 0 ? "cursor-grab active:cursor-grabbing" : ""}`}
          >
            <div className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left">
              <div className="flex flex-1 items-center gap-2.5 text-left">
                <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
                  {item.index + 1}
                </span>
                <span className="flex-shrink-0">{item.block.icon}</span>
                <span className="text-xs font-mono flex-1">{item.block.label}</span>
                <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                  Dos respuestas
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeBlock(item.block.id)}
                className="text-gray-500 hover:text-gray-700 transition-colors flex-shrink-0"
              >
                <X size={13} />
              </button>
            </div>

            <div className="px-3 pb-3">
              <div className="flex flex-col gap-2.5 rounded-lg border border-white/70 bg-white/75 p-2.5">
                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-amber-600">
                  <Warning size={12} weight="fill" />
                  Si hay obstaculo
                </div>
                {item.ifBranch ? (
                  item.ifBranch.type === "WHILE_GOAL" || item.ifBranch.type === "REPEAT" ? (
                    renderLoopCard(
                      item.ifBranch,
                      item.ifIndex ?? item.index + 1,
                      renderProgramItems(item.ifLoopBody ?? [], true, false),
                      "Agrega aqui la ruta que se repetira"
                    )
                  ) : (
                    renderBlockRow(item.ifBranch, item.ifIndex ?? item.index + 1, {
                      nested: true,
                      className: "bg-white/90",
                    })
                  )
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const reorderIdxStr = e.dataTransfer.getData("application/x-bekie-block-index");
                      if (reorderIdxStr) {
                        const fromIndex = Number(reorderIdxStr);
                        if (!Number.isNaN(fromIndex)) {
                          moveBlock(fromIndex, item.index + 1);
                          return;
                        }
                      }
                      const type = e.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType;
                      if (!type) return;
                      const def = getPaletteBlock(type);
                      if (!def) return;
                      insertBlockAt(def, item.index + 1);
                    }}
                    className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500"
                  >
                    Agrega aqui la respuesta del obstaculo
                  </div>
                )}

                <div className="mx-4 h-4 border-l-2 border-dashed border-gray-300" />

                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-600">
                  <CheckCircle size={12} weight="fill" />
                  Si no hay obstaculo
                </div>
                {item.elseBranch ? (
                  item.elseBranch.type === "WHILE_GOAL" || item.elseBranch.type === "REPEAT" ? (
                    renderLoopCard(
                      item.elseBranch,
                      item.elseIndex ?? item.index + 2,
                      renderProgramItems(item.elseLoopBody ?? [], true, false),
                      "Agrega aqui la ruta que se repetira"
                    )
                  ) : (
                    renderBlockRow(item.elseBranch, item.elseIndex ?? item.index + 2, {
                      nested: true,
                      className: "bg-white/90",
                    })
                  )
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const reorderIdxStr = e.dataTransfer.getData("application/x-bekie-block-index");
                      if (reorderIdxStr) {
                        const fromIndex = Number(reorderIdxStr);
                        if (!Number.isNaN(fromIndex)) {
                          moveBlock(fromIndex, item.index + 2);
                          return;
                        }
                      }
                      const type = e.dataTransfer.getData(BLOCK_DRAG_MIME) as BlockType;
                      if (!type) return;
                      const def = getPaletteBlock(type);
                      if (!def) return;
                      insertBlockAt(def, item.index + 2);
                    }}
                    className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500"
                  >
                    Agrega aqui la respuesta libre
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      } else if (item.kind === "loop") {
        if (item.index > 0) {
          nodes.push(<DropIndicator key={`drop-${item.block.id}`} index={item.index} />);
        }
        nodes.push(
          renderLoopCard(
            item.block,
            item.index,
            renderProgramItems(item.body, true, false),
            "Agrega aqui la ruta que se repetira"
          )
        );
      }
    });
    return nodes;
  };

  const compileProgram = useCallback(() => {
    if (!canCompile) {
      setCompilerResult({
        status: "idle",
        message: "Agrega bloques al programa antes de compilar.",
        issues: [],
        highlightIndexes: [],
      });
      return;
    }

    const issues: CompilerIssue[] = [];
    const pushIssue = (message: string, index?: number) => {
      issues.push({ message, index });
    };

    const countBlocks = (type: BlockType) => program.filter((block) => block.type === type).length;
    const stopIndexInProgram = program.findIndex((block) => block.type === "STOP");

    if (program[0]?.type !== "INIT" || countBlocks("INIT") !== 1) {
      pushIssue("El programa debe comenzar con un solo bloque Iniciar mision.", 0);
    }

    if (program.length < 2) {
      pushIssue("Agrega al menos una instruccion de lectura o movimiento.");
    }

    if (countBlocks("IF_OBS") > 0) {
      pushIssue("En este nivel no se usa el bloque Si hay obstaculo sin la rama libre.");
    }

    if (stage.id <= 3) {
      if (countBlocks("IF_OBS_ELSE") !== 1) {
        pushIssue("Cada mision de este nivel necesita exactamente un bloque Si hay obstaculo / Si no hay obstaculo.");
      }
      if (countBlocks("REPEAT") > 0) {
        pushIssue("En estas misiones iniciales no se usa el bloque Repetir N veces.");
      }
    } else {
      if (countBlocks("REPEAT") < 1) {
        pushIssue("Cada mision de este subnivel necesita al menos un bloque Repetir N veces.");
      }
      if (countBlocks("IF_OBS_ELSE") > 0) {
        pushIssue("En estas misiones de bucles no se usa el bloque Si hay obstaculo / Si no hay obstaculo.");
      }
    }

    if (countBlocks("WHILE_GOAL") > 0) {
      pushIssue(
        "En este nivel solo se usa Repetir N veces. Quita Mientras no llegue de la secuencia."
      );
    }

    if (countBlocks("STOP") !== 1) {
      pushIssue("Esta mision necesita exactamente un bloque Detener.");
    } else if (stopIndexInProgram !== program.length - 1) {
      pushIssue(
        `El bloque "${BLOCK_LABELS.STOP}" debe quedar al final para detener el robot en la meta.`,
        stopIndexInProgram
      );
    }

    program.forEach((block, index) => {
      if (block.type === "FORWARD" || block.type === "BACKWARD" || block.type === "REPEAT") {
        const defaultSteps = block.type === "REPEAT" ? 4 : 1;
        if (!Number.isInteger(block.steps ?? defaultSteps) || (block.steps ?? defaultSteps) < 1) {
          pushIssue(`El bloque "${BLOCK_LABELS[block.type]}" necesita un numero mayor que 0.`, index);
        }
      }
    });

    const MAX_STEPS = 220;
    const MAX_LOOPS = 10;
    const DIR_DELTA: [number, number][] = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    const getCell = (pos: [number, number]) => stage.grid[pos[0]]?.[pos[1]] ?? null;
    const readSensors = (pos: [number, number], dir: Dir) => {
      const [dr, dc] = DIR_DELTA[dir];
      const frontCell = getCell([pos[0] + dr, pos[1] + dc]);
      return {
        obstacleAhead: frontCell === null || frontCell === 1,
      };
    };

    const moveRobot = (
      pos: [number, number],
      movementDir: Dir
    ): { nextPos: [number, number]; status: "ok" | "collision" | "oob" } => {
      const delta = DIR_DELTA[movementDir];
      const next: [number, number] = [pos[0] + delta[0], pos[1] + delta[1]];
      const cell = getCell(next);

      if (cell === null) {
        return { nextPos: next, status: "oob" };
      }

      if (cell === 1) {
        return { nextPos: next, status: "collision" };
      }

      return { nextPos: next, status: "ok" };
    };

    const findStartPos = (): [number, number] => {
      for (let r = 0; r < stage.grid.length; r++) {
        const c = stage.grid[r].indexOf(2);
        if (c !== -1) return [r, c];
      }
      return [...config.start] as [number, number];
    };

    let pos: [number, number] = findStartPos();
    let dir: Dir = config.startDir;
    let sensors = readSensors(pos, dir);
    let stepCount = 0;
    let evaluationMessage = "El programa no llega a la meta.";

    const trace: string[] = ["Iniciar mision"];

    // A helper to execute a list of ProgramViewItem
    const executeItems = (items: ProgramViewItem[]): boolean => {
      for (const item of items) {
        if (evaluationMessage !== "El programa no llega a la meta." && evaluationMessage !== "La secuencia llega a la meta correctamente.") {
          return true; // Stop execution
        }

        if (item.kind === "block") {
          const block = item.block;
          if (block.type === "INIT") {
            continue;
          }
          if (block.type === "STOP") {
            trace.push(block.label);
            if (getCell(pos) === 3) {
              evaluationMessage = "La secuencia llega a la meta correctamente.";
            } else {
              evaluationMessage = "El robot se detuvo antes de llegar a la meta.";
            }
            return true; // Stop execution
          }

          const blockLabel = block.label;
          if (block.type === "FORWARD") {
            if ((block.steps ?? 1) > 1) {
              trace.push(`${blockLabel} (N=${block.steps})`);
            } else {
              trace.push(blockLabel);
            }

            let collision = false;
            for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
              stepCount += 1;
              if (stepCount > MAX_STEPS) {
                evaluationMessage = "El programa alcanzo el limite maximo de pasos.";
                collision = true;
                break;
              }
              const moved = moveRobot(pos, dir);
              pos = moved.nextPos;
              sensors = readSensors(pos, dir);
              if (moved.status === "collision") {
                evaluationMessage = "El robot choco con un obstaculo.";
                collision = true;
                break;
              }
              if (moved.status === "oob") {
                evaluationMessage = "El robot salio del area permitida.";
                collision = true;
                break;
              }
            }
            if (collision) return true;
          } else if (block.type === "BACKWARD") {
            if ((block.steps ?? 1) > 1) {
              trace.push(`${blockLabel} (N=${block.steps})`);
            } else {
              trace.push(blockLabel);
            }

            let collision = false;
            const backDir = ((dir + 2) % 4) as Dir;
            for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
              stepCount += 1;
              if (stepCount > MAX_STEPS) {
                evaluationMessage = "El programa alcanzo el limite maximo de pasos.";
                collision = true;
                break;
              }
              const moved = moveRobot(pos, backDir);
              pos = moved.nextPos;
              sensors = readSensors(pos, dir);
              if (moved.status === "collision") {
                evaluationMessage = "El robot choco retrocediendo.";
                collision = true;
                break;
              }
              if (moved.status === "oob") {
                evaluationMessage = "El robot salio del area permitida al retroceder.";
                collision = true;
                break;
              }
            }
            if (collision) return true;
          } else if (block.type === "TURN_RIGHT") {
            trace.push(blockLabel);
            stepCount += 1;
            dir = ((dir + 1) % 4) as Dir;
            sensors = readSensors(pos, dir);
          } else if (block.type === "TURN_LEFT") {
            trace.push(blockLabel);
            stepCount += 1;
            dir = ((dir + 3) % 4) as Dir;
            sensors = readSensors(pos, dir);
          } else if (block.type === "WAIT") {
            trace.push(blockLabel);
            stepCount += 1;
          }
        } else if (item.kind === "conditional") {
          stepCount += 1;
          trace.push(sensors.obstacleAhead ? "Si hay obstaculo" : "Si no hay obstaculo");

          if (sensors.obstacleAhead) {
            if (item.ifBranch) {
              if (item.ifBranch.type === "WHILE_GOAL" || item.ifBranch.type === "REPEAT") {
                const body = item.ifLoopBody ?? [];
                const done = executeLoop(item.ifBranch, body);
                if (done) return true;
              } else {
                const done = executeSingleBlock(item.ifBranch);
                if (done) return true;
              }
            }
          } else {
            if (item.elseBranch) {
              if (item.elseBranch.type === "WHILE_GOAL" || item.elseBranch.type === "REPEAT") {
                const body = item.elseLoopBody ?? [];
                const done = executeLoop(item.elseBranch, body);
                if (done) return true;
              } else {
                const done = executeSingleBlock(item.elseBranch);
                if (done) return true;
              }
            }
          }
        } else if (item.kind === "loop") {
          const done = executeLoop(item.block, item.body);
          if (done) return true;
        }
      }
      return false;
    };

    const executeSingleBlock = (block: Block): boolean => {
      return executeItems([{ kind: "block", block, index: -1 }]);
    };

    const executeLoop = (block: Block, body: ProgramViewItem[]): boolean => {
      if (block.type === "WHILE_GOAL") {
        let loopCount = 0;
        while (getCell(pos) !== 3) {
          loopCount += 1;
          if (loopCount > MAX_LOOPS) {
            evaluationMessage = "El bucle alcanzo el limite permitido sin llegar a la meta.";
            return true;
          }
          const done = executeItems(body);
          if (done) return true;
        }
      } else if (block.type === "REPEAT") {
        const reps = normalizeStepCount(block.steps ?? 4);
        for (let i = 0; i < reps; i++) {
          const done = executeItems(body);
          if (done) return true;
        }
      }
      return false;
    };

    // Run the structured interpreter
    executeItems(programView);

    if (issues.length === 0) {
      if (getCell(pos) === 3) {
        setCompilerResult({
          status: "success",
          message:
            "Compilacion correcta. La secuencia cumple con el escenario de la mision.",
          issues: [
            {
              message:
                missionIndex === 1
                  ? "Pulsa Cargar para abrir la carga al robot y ver el envio del programa."
                  : "Ahora puedes cargar el programa al robot fisico desde el boton de Cargar.",
            },
          ],
          highlightIndexes: [],
        });

        setExecutionTrace(trace);
        setShowSuccessModal(true);

        if (showTutorial && tutorialVisible && tutorialStep === 5) {
          setTutorialStep(6);
        }
        return;
      }

      pushIssue(
        stage.id === 2 && evaluationMessage === "El programa no llega a la meta."
          ? "La ruta no llega a la meta. En esta mision, si la rama de obstaculo solo corrige la orientacion, el avance que completa el recorrido debe quedar en la parte del programa que realmente siga avanzando."
          : evaluationMessage
      );
    }

    const highlightIndexes = Array.from(
      new Set(issues.flatMap((issue) => (typeof issue.index === "number" ? [issue.index] : [])))
    );

    setCompilerResult({
      status: "error",
      message: "La compilacion encontro errores. Los bloques marcados en rojo necesitan revision.",
      issues,
      highlightIndexes,
    });
    setShowErrorModal(true);
  }, [
    canCompile,
    config.start,
    config.startDir,
    missionIndex,
    normalizeStepCount,
    program,
    programView,
    showTutorial,
    stage.id,
    stage.grid,
    tutorialStep,
    tutorialVisible,
  ]);


  const goToRobot = () => {
    if (compilerResult.status !== "success") {
      return;
    }

    if (showTutorial) {
      setTutorialVisible(false);
      setTargetRect(null);
    }

    saveRobotLoadPayload({
      levelKey: "2",
      missionIndex,
      missionTitle: stage.title,
      commands: executionTrace,
    });

    router.push(`/levels/2/load?mission=${missionIndex}`);
  };

  const paletteHint = useMemo(
    () => {
      if (stage.id === 1) {
        return "En esta misión usa Si hay obstaculo / Si no hay obstaculo para aprender la estructura de dos respuestas. La rama del obstaculo gira, la rama libre avanza con N y el Avanzar final va fuera de la decision sin numero.";
      }

      if (stage.id === 2) {
        return "En esta misión usa Si hay obstaculo / Si no hay obstaculo como una sola estructura con dos respuestas distintas. La rama del obstaculo y la libre deben diferir, y después de la decision dos Avanzar sueltos completan la salida.";
      }

      if (stage.id === 3) {
        return "En esta misión usa Si hay obstaculo / Si no hay obstaculo para escoger la salida correcta. La rama libre no tiene por qué ser Esperar: puede ser otro giro util si el escenario lo permite.";
      }

      if (stage.id === 4) {
        return "En esta misión usa Repetir N veces con N=4 para subir la escalera. Coloca dentro del bucle: Avanzar, Girar derecha, Avanzar y Girar izquierda.";
      }

      if (stage.id === 5) {
        return "En esta misión usa Repetir N veces para avanzar 4 celdas, gira a la derecha y usa otro bloque Repetir N veces con N=4 para llegar a la meta.";
      }

      if (stage.id === 6) {
        return "En esta misión usa tres bloques Repetir N veces: uno de N=4 para el primer tramo largo, gira a la derecha, otro de N=4 para el segundo tramo, gira a la derecha, y otro de N=2 para el último tramo.";
      }

      if (stage.id === 7) {
        return "En esta misión combina avances simples con varios bloques Repetir N veces para sortear el doble zigzag y alcanzar la meta.";
      }

      return "La mision requiere una secuencia mas completa y ordenada.";
    },
    [stage.id]
  );

  const dismissScenarioIntro = () => {
    setScenarioIntroVisible(false);
    if (showTutorial) {
      setTutorialVisible(true);
    }
  };

  const tutorialText =
    currentTutorialStep?.target === "load" && compilerResult.status !== "success"
      ? "Primero compila bien. Cuando salga en verde, pulsa Cargar."
      : currentTutorialStep?.text ?? "";

  const closeTutorial = () => {
    setTutorialVisible(false);
    setTargetRect(null);
  };

  const nextTutorialStep = () => {
    if (!canAdvanceTutorial) {
      return;
    }

    setTutorialStep((current) => {
      if (current >= TUTORIAL_STEPS.length - 1) {
        closeTutorial();
        return current;
      }

      return current + 1;
    });
  };

  const tutorialActionLabel = (() => {
    if (!currentTutorialStep) return "Siguiente";
    if (tutorialStep === TUTORIAL_STEPS.length - 1) return "Terminar";
    if (!canAdvanceTutorial) return tutorialStep === 5 ? "Compila primero" : "Completa el paso";
    return "Siguiente";
  })();

  const isIfObsElsePaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 0;
  const isTurnRightPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 1;
  const isForwardPaletteHighlighted =
    showTutorial && tutorialVisible && (tutorialStep === 2 || tutorialStep === 3);
  const isStopPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 4;
  const isCompileButtonHighlighted = showTutorial && tutorialVisible && tutorialStep === 5;
  const isTutorialButtonSpotlight = tutorialStep === 5 || tutorialStep === 6;

  return (
    <div className="relative min-h-[100dvh] bg-white flex flex-col overflow-x-hidden select-none">
      <AppNav userName="Beymar" role="student" />

      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={`/levels/2/mission`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Mision
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">
          {config.level} - {config.levelSlug} / Compilador
        </span>
        <div className="flex items-center gap-2">
          {compilerResult.status === "error" && (
            <button
              type="button"
              onClick={() => setShowErrorModal(true)}
              className="btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-600 border border-red-200 hover:bg-red-105 transition-colors"
            >
              <Warning size={13} weight="fill" className="text-red-500" />
              Ver errores ({compilerResult.issues.length})
            </button>
          )}
          <button
            onClick={clearProgram}
            className="btn-press flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
          >
            <Trash size={13} />
            Limpiar
          </button>
          <button
            id="btn-compile"
            ref={compileRef}
            onClick={compileProgram}
            disabled={!canCompile}
            className={`btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-300 ${
              isCompileButtonHighlighted
                ? "bg-indigo-650 ring-4 ring-indigo-500 ring-offset-2 animate-pulse scale-105 z-50 relative border-2 border-white shadow-xl text-white"
                : canCompile
                ? "bg-indigo-600 text-white hover:bg-indigo-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Code size={13} weight="bold" />
            Compilar
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div
          ref={paletteRef}
          className="w-[220px] lg:w-[240px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto"
        >
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 px-1">
              Bloques
            </p>
            <div
              className={`mb-3 rounded-lg border px-3 py-2 text-[11px] leading-relaxed ${
                stage.difficulty === "Facil"
                  ? "border-violet-200 bg-violet-50 text-violet-700"
                  : "border-violet-200 bg-violet-50 text-violet-700"
              }`}
            >
              {paletteHint}
            </div>
            <div className="flex flex-col gap-1.5">
              {config.palette.map((def, i) => {
                const isPaletteHighlighted =
                  (def.type === "IF_OBS_ELSE" && isIfObsElsePaletteHighlighted) ||
                  (def.type === "TURN_RIGHT" && isTurnRightPaletteHighlighted) ||
                  (def.type === "FORWARD" && isForwardPaletteHighlighted) ||
                  (def.type === "STOP" && isStopPaletteHighlighted);

                return (
                  <button
                    id={`btn-palette-${def.type.toLowerCase()}`}
                    key={`${def.type}-${i}`}
                    type="button"
                    draggable
                    onDragStart={handlePaletteDragStart(def.type)}
                    onDragEnd={() => setIsProgramDropActive(false)}
                    className={`block-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${
                      isPaletteHighlighted
                        ? "border-indigo-500 ring-4 ring-indigo-500 ring-offset-1 bg-indigo-50 animate-pulse text-indigo-900 z-50 relative scale-[1.03] shadow-md"
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

        <div
          ref={programRef}
          className={`flex-1 flex flex-col min-w-0 border-r border-gray-300 transition-all ${
            isProgramDropGuideActive
              ? "bg-violet-50/30 ring-4 ring-inset ring-violet-400/85 shadow-[0_0_0_1px_rgba(139,92,246,0.22),0_0_42px_rgba(139,92,246,0.32)]"
              : ""
          }`}
        >
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Programa ({program.length}/25)
            </p>
            <span className="text-[10px] font-mono text-violet-600 uppercase tracking-wider">
              Mision {missionIndex}/5
            </span>
          </div>
          <div
            className={`relative flex-1 overflow-y-auto p-3 transition-all ${
              isProgramDropActive ? "bg-violet-50/70" : ""
            } ${
              isProgramDropGuideActive
                ? "bg-violet-50/60 ring-4 ring-inset ring-violet-400/70 shadow-[inset_0_0_0_1px_rgba(139,92,246,0.14)]"
                : ""
            }`}
            onDragOver={handleProgramDragOver}
            onDrop={handleProgramDrop}
          >
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(196,181,253,0.26),transparent_58%)] animate-pulse" />
            )}
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-violet-300/90 bg-violet-100/20 shadow-[0_0_0_1px_rgba(167,139,250,0.18),0_0_38px_rgba(139,92,246,0.34)]" />
            )}
            {isProgramDropGuideActive && (
              <div className="relative z-10 mb-2 flex items-center justify-between rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[10px] font-mono text-violet-700 uppercase tracking-wider shadow-[0_0_24px_rgba(139,92,246,0.18)]">
                <span>Suelta los bloques aquí</span>
                <span>Zona activa</span>
              </div>
            )}
            <div className="relative z-10 flex flex-col gap-1.5 min-h-full">
              {renderProgramItems(programView)}
              {program.length > 1 && <DropIndicator index={program.length} />}
              {program.length < 2 && (
                <div className="flex items-center gap-2 py-3 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg bg-white/80 shadow-sm">
                  <Plus size={13} />
                  Arrastra bloques desde el panel izquierdo
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-[300px] lg:w-[340px] flex-shrink-0 flex flex-col">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Compilador
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            <div className="rounded-xl border border-violet-200 bg-violet-50 p-3">
              <p className="text-[10px] font-mono text-violet-700 uppercase tracking-wider mb-1">
                {stage.scenarioLabel}
              </p>
              <p className="text-sm font-semibold text-gray-900">{stage.title}</p>
              <p className="text-[11px] leading-relaxed text-gray-600 mt-1">
                {stage.summary}
              </p>
              <p className="text-[11px] leading-relaxed text-violet-700 mt-2">
                Construye este escenario para realizar las pruebas.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                Cómo funciona
              </p>
              <p className="text-[11px] text-gray-600 leading-relaxed">
                El robot detecta obstáculos internamente, así que aquí solo programas la
                reacción con bloques de decisión.
              </p>
            </div>

            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
            >
              {Array.from({ length: gridSize }).map((_, row) =>
                Array.from({ length: gridSize }).map((_, col) => {
                  const cell = stage.grid[row][col];
                  const isStart = cell === 2;
                  const isGoal = cell === 3;
                  const isObstacle = cell === 1;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`aspect-square rounded-sm flex items-center justify-center text-[11px] font-mono transition-colors duration-200 ${
                        isObstacle
                          ? "bg-gray-600 border border-gray-500"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-400"
                          : isStart
                          ? "bg-gray-200 border border-gray-300"
                          : "bg-gray-50 border border-gray-200"
                      }`}
                    >
                      {isGoal && (
                        <span className="text-emerald-700 text-[9px] font-bold">META</span>
                      )}
                      {isObstacle && <span className="text-gray-300">■</span>}
                      {isStart && (
                        <span className="text-gray-500 text-sm font-bold">
                          {config.startDir === 0
                            ? "→"
                            : config.startDir === 1
                            ? "↓"
                            : config.startDir === 2
                            ? "←"
                            : "↑"}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div
              className={`flex items-start gap-2 text-xs p-3 rounded-lg bg-gray-50 border ${
                compilerResult.status === "success"
                  ? "border-emerald-400"
                  : compilerResult.status === "error"
                  ? "border-red-400"
                  : "border-gray-200"
              }`}
            >
              {compilerResult.status === "success" ? (
                <CheckCircle size={14} weight="fill" className="text-emerald-600 mt-0.5" />
              ) : compilerResult.status === "error" ? (
                <Warning size={14} weight="fill" className="text-red-600 mt-0.5" />
              ) : (
                <Code size={14} className="text-violet-600 mt-0.5" />
              )}
              <div className="flex-1">
                <p
                  className={`font-medium font-mono ${
                    compilerResult.status === "success"
                      ? "text-emerald-600"
                      : compilerResult.status === "error"
                      ? "text-red-600"
                      : "text-gray-700"
                  }`}
                >
                  {compilerResult.status === "success"
                    ? "Compilacion exitosa"
                    : compilerResult.status === "error"
                    ? "Errores de compilacion"
                    : "Esperando compilacion"}
                </p>
                <p className="text-gray-600 mt-0.5 text-[11px]">{compilerResult.message}</p>
              </div>
            </div>

            {compilerResult.issues.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-4">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                  Detalles
                </p>
                <ul className="space-y-2">
                  {compilerResult.issues.map((issue, index) => (
                    <li key={`${index}-${issue.message}`} className="flex gap-2 text-[11px] text-gray-600">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <span>{issue.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                Instrucciones
              </p>
              <div className="space-y-2 text-[11px] text-gray-600 leading-relaxed">
                {stage.instructions.map((instruction, index) => (
                  <p key={`${index}-${instruction}`}>{instruction}</p>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-1.5 text-[11px] font-mono text-gray-500">
              <p className="text-[10px] uppercase tracking-wider mb-1">Leyenda</p>
              {[
                { cell: "bg-emerald-100 border border-emerald-400", label: "Meta" },
                { cell: "bg-gray-600", label: "Obstaculo" },
                { cell: "bg-gray-200 border border-gray-300", label: "Inicio" },
                { cell: "bg-red-50 border border-red-400", label: "Bloque a corregir" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-sm ${item.cell}`} />
                  {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Errores de Compilación */}
      {showErrorModal && compilerResult.status === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-6 transition-all duration-300">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-red-600 font-bold">
                <Warning size={20} weight="fill" />
                <h3 className="text-base font-bold">Errores de compilación</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="py-4 flex-1 overflow-y-auto max-h-[350px]">
              <p className="text-[11px] text-gray-400 mb-3 uppercase tracking-wider font-mono">
                Detalles de los problemas encontrados
              </p>
              <ul className="space-y-2.5">
                {compilerResult.issues.map((issue, index) => (
                  <li key={`${index}-${issue.message}`} className="flex gap-2.5 text-xs text-gray-700 bg-red-50/50 p-3.5 rounded-2xl border border-red-100">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="font-mono leading-relaxed">{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-3.5 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setShowErrorModal(false)}
                className="btn-press bg-red-600 hover:bg-red-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200"
              >
                Entendido, voy a corregir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Compilación Exitosa */}
      {showSuccessModal && compilerResult.status === "success" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-6 transition-all duration-300">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle size={20} weight="fill" />
                <h3 className="text-base font-bold">¡Compilación Exitosa!</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="py-5 text-center flex flex-col items-center">
              <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center text-emerald-600 mb-4 animate-pulse">
                <CheckCircle size={36} weight="duotone" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">El programa cumple con el escenario</h4>
              <p className="text-xs text-gray-500 max-w-sm leading-relaxed">
                Tu secuencia ha sido verificada y no presenta errores de lógica. Está lista para ser transmitida al robot físico por Bluetooth.
              </p>
            </div>
            
            <div className="pt-3.5 border-t border-gray-100 flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="btn-press border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold text-xs px-5 py-2.5 rounded-xl transition-all duration-200"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSuccessModal(false);
                  goToRobot();
                }}
                className="btn-press bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200"
              >
                Cargar al Robot
              </button>
            </div>
          </div>
        </div>
      )}

      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: isTutorialButtonSpotlight ? "9999px" : "12px",
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
            borderRadius: isTutorialButtonSpotlight ? "9999px" : "12px",
            border: "5px solid #ffffff",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.9)",
            zIndex: 40,
          }}
        />
      )}

      {showTutorial && tutorialVisible && currentTutorialStep && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          className="fixed w-[380px] bg-[#090d16] border border-slate-800 shadow-2xl shadow-black/85 rounded-3xl p-6 flex flex-col gap-4 select-none cursor-grab active:cursor-grabbing"
          style={{ zIndex: 45, ...cardPlacementStyle }}
        >
          <div className="w-12 h-1 bg-slate-850 rounded-full mx-auto -mt-2 opacity-60" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-widest">
              PASO {tutorialStep + 1}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {tutorialStep + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-mono">{tutorialText}</p>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 text-[11px] font-bold font-mono shadow-md">
                N
              </div>
              <button
                onClick={closeTutorial}
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
                  onClick={closeTutorial}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-indigo-650/30 transition-all"
                >
                  Terminar
                </button>
              ) : (
                <button
                  disabled={!canAdvanceTutorial}
                  onClick={nextTutorialStep}
                  className={`font-bold text-xs px-4 py-2 rounded-xl transition-all ${
                    canAdvanceTutorial
                      ? "bg-indigo-650 hover:bg-indigo-750 text-white shadow-lg shadow-indigo-650/30 cursor-pointer"
                      : "bg-slate-900 text-slate-600 border border-slate-850 cursor-not-allowed"
                  }`}
                >
                  {canAdvanceTutorial ? "Siguiente" : tutorialActionLabel}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {scenarioIntroVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] p-4 animate-fade-in">
          <div className="w-full max-w-[450px] bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-8 text-center transition-all duration-300">
            <p className="text-[11px] font-semibold font-mono text-indigo-600 uppercase tracking-widest mb-1.5">
              NIVEL 1 - INTERMEDIO / MISIÓN {missionIndex}
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
                      key={`intro-${r}-${c}`}
                      className={`aspect-square rounded-lg flex items-center justify-center font-bold text-[10px] transition-all duration-300 ${
                        isStart
                          ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
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

            <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/40 p-5 text-left mb-6">
              <p className="text-[10px] font-bold font-mono text-indigo-600 uppercase tracking-wider mb-2">
                INSTRUCCIONES DEL ESCENARIO
              </p>
              <p className="text-xs text-gray-700 leading-relaxed font-mono">{stage.summary}</p>
            </div>

            <button
              onClick={dismissScenarioIntro}
              className="btn-press bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all duration-200 w-full"
            >
              {showTutorial ? "Comenzar tutorial" : "Comenzar mision"}
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

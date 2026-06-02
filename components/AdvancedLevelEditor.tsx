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
  Cpu,
  Plus,
  Trash,
  Warning,
  X,
} from "@phosphor-icons/react";
import { LEVEL_3_STAGES } from "@/lib/nivel-2";
import { unlockMissionAfterComplete } from "@/lib/progress";
import {
  type BlockType,
  type Dir,
  type EditorLevelContent,
  type MissionStage,
  type PaletteBlock,
} from "@/lib/levels";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

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

const BLOCK_LABELS: Record<BlockType, string> = {
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
const EMPTY_BLOCKS: BlockType[] = [];

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "PASO 1 / ASISTENTE BEKIE",
    text: "Tu programa ya empieza con Iniciar mision. Ahora arrastra Repetir N veces desde el panel izquierdo. Este bloque repetirá las instrucciones de movimiento en cada iteración.",
    target: "palette",
    lockText: "Agrega el bloque Repetir N veces para continuar.",
    blocksToPress: ["REPEAT"],
  },
  {
    title: "PASO 2 / ASISTENTE BEKIE",
    text: "Ahora arrastra Avanzar para colocarlo dentro del bucle como primer paso de la escalera.",
    target: "palette",
    lockText: "Agrega Avanzar dentro del bucle para continuar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 3 / ASISTENTE BEKIE",
    text: "Ahora arrastra Girar derecha para añadir el giro dentro del bucle.",
    target: "palette",
    lockText: "Agrega Girar derecha dentro del bucle para continuar.",
    blocksToPress: ["TURN_RIGHT"],
  },
  {
    title: "PASO 4 / ASISTENTE BEKIE",
    text: "Arrastra otro bloque Avanzar dentro del bucle para avanzar en el siguiente eje.",
    target: "palette",
    lockText: "Agrega Avanzar dentro del bucle para continuar.",
    blocksToPress: ["FORWARD"],
  },
  {
    title: "PASO 5 / ASISTENTE BEKIE",
    text: "Arrastra Girar izquierda dentro del bucle para orientar el robot hacia el siguiente escalón.",
    target: "palette",
    lockText: "Agrega Girar izquierda dentro del bucle para continuar.",
    blocksToPress: ["TURN_LEFT"],
  },
  {
    title: "PASO 6 / ASISTENTE BEKIE",
    text: "Ahora arrastra Detener al final del programa (fuera del bucle) para finalizar sobre la meta.",
    target: "palette",
    lockText: "Agrega Detener al final para continuar.",
    blocksToPress: ["STOP"],
  },
  {
    title: "PASO 7 / ASISTENTE BEKIE",
    text: "Haz clic en el número N = 3 del bucle y cámbialo a 4. Así repetirá el patrón de escalones 4 veces hasta llegar a la posición (5,5).",
    target: "program",
    lockText: "Cambia el valor de N a 4 en el bloque Repetir N veces.",
  },
  {
    title: "PASO 8 / ASISTENTE BEKIE",
    text: "¡Perfecto! Ahora pulsa Compilar para simular el recorrido. El robot subirá la escalera de 5x5 hasta la meta.",
    target: "compile",
    lockText: "Presiona Compilar para finalizar el tutorial.",
  },
];

interface AdvancedLevelEditorProps {
  config: EditorLevelContent;
  stage: MissionStage;
  missionIndex: number;
}

export default function AdvancedLevelEditor({
  config,
  stage,
  missionIndex,
}: AdvancedLevelEditorProps) {
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
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [scenarioIntroVisible, setScenarioIntroVisible] = useState(true);
  const [isProgramDropActive, setIsProgramDropActive] = useState(false);
  const [targetRect, setTargetRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  const paletteRef = useRef<HTMLDivElement | null>(null);
  const programRef = useRef<HTMLDivElement | null>(null);
  const compileRef = useRef<HTMLButtonElement | null>(null);
  const loadRef = useRef<HTMLButtonElement | null>(null);

  const getPaletteBlock = useCallback(
    (type: BlockType) => config.palette.find((block) => block.type === type) ?? null,
    [config.palette]
  );

  const handlePaletteDragStart = (type: BlockType) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(BLOCK_DRAG_MIME, type);
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

  const updateTargetRect = useCallback(() => {
    if (!showTutorial || !tutorialVisible) {
      setTargetRect(null);
      return;
    }

    let selector = "";
    if (tutorialStep === 0) {
      selector = "#btn-palette-repeat";
    } else if (tutorialStep === 1) {
      selector = "#btn-palette-forward";
    } else if (tutorialStep === 2) {
      selector = "#btn-palette-turn_right";
    } else if (tutorialStep === 3) {
      selector = "#btn-palette-forward";
    } else if (tutorialStep === 4) {
      selector = "#btn-palette-turn_left";
    } else if (tutorialStep === 5) {
      selector = "#btn-palette-stop";
    } else if (tutorialStep === 6) {
      selector = "#input-loop-n";
    } else if (tutorialStep === 7) {
      selector = "#btn-compile";
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
  }, [showTutorial, tutorialVisible, tutorialStep, program]);

  useEffect(() => {
    updateTargetRect();
    const t = setTimeout(updateTargetRect, 120);
    
    let interval: number | undefined;
    if (showTutorial && tutorialVisible) {
      interval = window.setInterval(updateTargetRect, 250);
    }

    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      clearTimeout(t);
      if (interval) clearInterval(interval);
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [updateTargetRect, tutorialStep, program, tutorialVisible, showTutorial]);

  const normalizeStepCount = useCallback((value: number) => {
    if (!Number.isFinite(value)) return 1;
    return Math.max(1, Math.min(9, Math.floor(value)));
  }, []);

  const addBlock = (def: PaletteBlock) => {
    if (program.length >= 25) return;
    setProgram((current) => [
      ...current,
      {
        ...def,
        id: `b_${current.length + 1}_${Date.now()}`,
        ...(def.type === "REPEAT" ? { steps: 3 } : def.type === "FORWARD" ? { steps: 1 } : {}),
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
          ? current[index + 1]?.type === "REPEAT" || current[index + 2]?.type === "REPEAT"
            ? current.length - index
            : 3
          : block.type === "REPEAT"
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
  const tutorialBlocksToPress = currentTutorialStep?.blocksToPress ?? EMPTY_BLOCKS;
  const tutorialHighlightBlocks = useMemo(
    () => new Set(tutorialBlocksToPress),
    [tutorialBlocksToPress]
  );
  const isProgramDropGuideActive =
    showTutorial && tutorialVisible && currentTutorialStep?.target === "palette";

  const canAdvanceTutorial = useMemo(() => {
    if (!currentTutorialStep) return false;

    const types = program.map((b) => b.type);

    const isSubsequence = (arr: string[], sub: string[]) => {
      let subIdx = 0;
      for (let i = 0; i < arr.length; i++) {
        if (arr[i] === sub[subIdx]) {
          subIdx++;
          if (subIdx === sub.length) return true;
        }
      }
      return subIdx === sub.length;
    };

    switch (tutorialStep) {
      case 0:
        return isSubsequence(types, ["INIT", "REPEAT"]);
      case 1:
        return isSubsequence(types, ["INIT", "REPEAT", "FORWARD"]);
      case 2:
        return isSubsequence(types, ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT"]);
      case 3:
        return isSubsequence(types, ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD"]);
      case 4:
        return isSubsequence(types, ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT"]);
      case 5:
        return isSubsequence(types, ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "STOP"]);
      case 6: {
        const hasSeq = isSubsequence(types, ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "STOP"]);
        const repeatBlock = program.find((b) => b.type === "REPEAT");
        return hasSeq && repeatBlock?.steps === 4;
      }
      case 7:
        return compilerResult.status === "success";
      default:
        return false;
    }
  }, [compilerResult.status, currentTutorialStep, program, tutorialStep]);

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

  useEffect(() => {
    if (!showTutorial || !tutorialVisible || !currentTutorialStep) return;
    if (!canAdvanceTutorial || tutorialStep >= TUTORIAL_STEPS.length - 1) return;

    const timer = window.setTimeout(() => {
      setTutorialStep((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1));
    }, 300);

    return () => window.clearTimeout(timer);
  }, [canAdvanceTutorial, currentTutorialStep, showTutorial, tutorialStep, tutorialVisible]);

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
            ifLoopBody: ifBranch?.type === "REPEAT" ? loopBody : undefined,
            elseLoopBody: elseBranch?.type === "REPEAT" ? loopBody : undefined,
          });
          if (ifBranch?.type === "REPEAT" || elseBranch?.type === "REPEAT") {
            if (loopEndIndex > index) {
              index = loopEndIndex - 1;
            }
            continue;
          }

          index += 2;
          continue;
        }

        if (block.type === "REPEAT") {
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
        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border ${block.colorClass} ${
          isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
        } ${options?.className ?? ""} ${nested ? "shadow-sm" : ""}`}
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
            <span>pasos</span>
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
    const loopIterations = normalizeStepCount(block.steps ?? 3);
    const isNInputActive = showTutorial && tutorialVisible && tutorialStep === 2;

    return (
      <div
        key={block.id}
        className={`rounded-xl border ${block.colorClass} ${
          isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
        } overflow-hidden`}
      >
        <div className="w-full flex items-center gap-2.5 px-3 py-2.5 text-left bg-white/40">
          <div className="flex flex-1 items-center gap-2.5 text-left">
            <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
              {index + 1}
            </span>
            <span className="flex-shrink-0">{block.icon}</span>
            <span className="text-xs font-mono">{block.label}</span>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="text-xs font-mono text-indigo-750 font-semibold">(N =</span>
              <input
                id="input-loop-n"
                type="number"
                min={1}
                max={9}
                value={loopIterations}
                onChange={(e) => {
                  const val = normalizeStepCount(Number(e.target.value));
                  setProgram((current) =>
                    current.map((curr) =>
                      curr.id === block.id ? { ...curr, steps: val } : curr
                    )
                  );
                  setCompilerResult({
                    status: "idle",
                    message: "La secuencia cambio. Vuelve a compilar para validar la nueva version.",
                    issues: [],
                    highlightIndexes: [],
                  });
                }}
                className={`w-10 text-center font-bold text-xs bg-white border rounded px-1 py-0.5 text-indigo-700 focus:outline-none transition-all ${
                  isNInputActive
                    ? "ring-4 ring-indigo-500 ring-offset-1 border-indigo-500 animate-pulse bg-indigo-50"
                    : "border-indigo-200"
                }`}
              />
              <span className="text-xs font-mono text-indigo-750 font-semibold">)</span>
            </div>
            <span className="text-[10px] font-mono text-gray-400 ml-auto uppercase tracking-wider">
              Repite lo de abajo
            </span>
          </div>
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
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-indigo-600">
              ACCION A REPETIR {loopIterations} VECES
            </div>
            {bodyChildren.length > 0 ? (
              <div className="flex flex-col gap-1.5">{bodyChildren}</div>
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500">
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
  ): ReactNode[] =>
    items.map((item) => {
      if (item.kind === "block") {
        return renderBlockRow(item.block, item.index, { nested, allowSteps });
      }

      if (item.kind === "conditional") {
        const isHighlighted = [item.index, item.ifIndex, item.elseIndex].some((index) =>
          typeof index === "number" ? compilerResult.highlightIndexes.includes(index) : false
        );

        return (
          <div
            key={item.block.id}
            className={`rounded-xl border ${item.block.colorClass} ${
              isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
            } overflow-hidden`}
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
                  item.ifBranch.type === "REPEAT" ? (
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
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500">
                    Agrega aqui la respuesta del obstaculo
                  </div>
                )}

                <div className="mx-4 h-4 border-l-2 border-dashed border-gray-300" />

                <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-emerald-600">
                  <CheckCircle size={12} weight="fill" />
                  Si no hay obstaculo
                </div>
                {item.elseBranch ? (
                  item.elseBranch.type === "REPEAT" ? (
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
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white/70 px-3 py-3 text-[11px] text-gray-500">
                    Agrega aqui la respuesta libre
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      }

      if (item.kind === "loop") {
        return renderLoopCard(
          item.block,
          item.index,
          renderProgramItems(item.body, true, false),
          "Agrega aqui la ruta que se repetira"
        );
      }

      return null;
    });

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

    if (countBlocks("STOP") !== 1) {
      pushIssue("Esta mision necesita exactamente un bloque Detener.");
    } else if (stopIndexInProgram !== program.length - 1) {
      pushIssue(
        `El bloque "${BLOCK_LABELS.STOP}" debe quedar al final para detener el robot en la meta.`,
        stopIndexInProgram
      );
    }

    // Level-specific constraints
    if (stage.id === 1) {
      const repeatIdx = program.findIndex((b) => b.type === "REPEAT");
      if (repeatIdx === -1) {
        pushIssue("Debes incluir el bloque Repetir N veces.");
      } else if (program[repeatIdx].steps !== 4) {
        pushIssue("Configura el valor de N en 4 para recorrer la distancia exacta hasta la meta.", repeatIdx);
      }
    }

    program.forEach((block, index) => {
      if (block.type === "FORWARD" || block.type === "BACKWARD") {
        if (!Number.isInteger(block.steps ?? 1) || (block.steps ?? 1) < 1) {
          pushIssue(`El bloque "${BLOCK_LABELS[block.type]}" necesita un numero mayor que 0.`, index);
        }
      }
    });

    const executionBlocks = program.filter((block) => block.type !== "INIT");
    const stopIndex = executionBlocks.findIndex((block) => block.type === "STOP");
    const loopExitIndex = stopIndex !== -1 ? stopIndex : executionBlocks.length;
    const MAX_STEPS = 220;
    const MAX_LOOPS = 20;
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
    let stepIdx = 0;
    let stepCount = 0;
    let loopCount = 0;
    let loopStartIndex: number | null = null;
    let loopMaxIterations = 0;
    let skipAfterBranch = 0;
    let evaluationMessage = "El programa no llega a la meta.";

    while (stepCount++ <= MAX_STEPS) {
      if (stepIdx >= executionBlocks.length) {
        if (getCell(pos) === 3) {
          evaluationMessage = "La secuencia llega a la meta correctamente.";
          break;
        }
        evaluationMessage = "El programa no llega a la meta.";
        break;
      }

      const block = executionBlocks[stepIdx++];
      if (!block) {
        evaluationMessage = "La secuencia tiene un bloque incompleto.";
        break;
      }

      switch (block.type as BlockType) {
        case "FORWARD": {
          for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
            const moved = moveRobot(pos, dir);
            pos = moved.nextPos;
            sensors = readSensors(pos, dir);
            if (moved.status === "collision") {
              evaluationMessage = "El robot choco con un obstaculo.";
              break;
            }
            if (moved.status === "oob") {
              evaluationMessage = "El robot salio del area permitida.";
              break;
            }
          }
          break;
        }
        case "BACKWARD": {
          const backDir = ((dir + 2) % 4) as Dir;
          for (let step = 0; step < normalizeStepCount(block.steps ?? 1); step += 1) {
            const moved = moveRobot(pos, backDir);
            pos = moved.nextPos;
            sensors = readSensors(pos, dir);
            if (moved.status === "collision") {
              evaluationMessage = "El robot choco retrocediendo.";
              break;
            }
            if (moved.status === "oob") {
              evaluationMessage = "El robot salio del area permitida al retroceder.";
              break;
            }
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
            evaluationMessage = "La secuencia llega a la meta correctamente.";
          } else {
            evaluationMessage = "El robot se detuvo antes de llegar a la meta.";
          }
          stepCount = MAX_STEPS + 100; // trigger exit
          break;
        case "IF_OBS_ELSE": {
          if (sensors.obstacleAhead) {
            skipAfterBranch = 1;
          } else {
            stepIdx += 1;
          }
          break;
        }
        case "REPEAT": {
          loopStartIndex = stepIdx;
          loopMaxIterations = block.steps ?? 3;
          loopCount = 0;
          break;
        }
        default:
          break;
      }

      if (evaluationMessage !== "El programa no llega a la meta." && evaluationMessage !== "La secuencia llega a la meta correctamente.") {
        break;
      }

      if (skipAfterBranch > 0) {
        stepIdx += skipAfterBranch;
        skipAfterBranch = 0;
      }

      if (loopStartIndex !== null && stepIdx === loopExitIndex && getCell(pos) !== 3) {
        loopCount += 1;
        if (loopCount >= loopMaxIterations) {
          loopStartIndex = null;
        } else {
          stepIdx = loopStartIndex;
        }
      }
    }

    if (getCell(pos) === 3) {
      evaluationMessage = "La secuencia llega a la meta correctamente.";
    }

    const isSuccess = evaluationMessage === "La secuencia llega a la meta correctamente." && issues.length === 0;

    setCompilerResult({
      status: isSuccess ? "success" : "error",
      message: isSuccess ? evaluationMessage : `No se pudo compilar: ${evaluationMessage}`,
      issues,
      highlightIndexes: issues.map((issue) => issue.index).filter((idx): idx is number => typeof idx === "number"),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canCompile, config.start, config.startDir, normalizeStepCount, program, stage.grid]);

  const goToRobot = () => {
    if (compilerResult.status === "success") {
      unlockMissionAfterComplete(
        "bekie-level-3-progress",
        missionIndex,
        LEVEL_3_STAGES.length
      );
      if (showTutorial) {
        setTutorialVisible(false);
      }
      router.push("/robot");
    }
  };

  const paletteHint = useMemo(
    () => {
      if (stage.id === 1) {
        return "Usa Repetir N veces para tramos fijos y Si hay obstaculo para tomar decisiones automáticas.";
      }
      return "Logica avanzada: encadena condicionales y bucles. Observa los sensores del robot en el simulador.";
    },
    [stage.id]
  );

  // Active step highlight checks
  const isRepeatPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 0;
  const isForwardPaletteHighlighted = showTutorial && tutorialVisible && (tutorialStep === 1 || tutorialStep === 3);
  const isTurnRightPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 2;
  const isTurnLeftPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 4;
  const isStopPaletteHighlighted = showTutorial && tutorialVisible && tutorialStep === 5;
  const isCompileButtonHighlighted = showTutorial && tutorialVisible && tutorialStep === 7;

  return (
    <div className="relative min-h-[100dvh] bg-white flex flex-col overflow-x-hidden select-none">
      <AppNav userName="Beymar" role="student" />

      {/* Intro Modal / Selector de Matriz - Styled exactly as requested */}
      {scenarioIntroVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-[2px] p-4 animate-fade-in">
          <div className="w-full max-w-[450px] bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-8 text-center transition-all duration-300">
            <p className="text-[11px] font-semibold font-mono text-indigo-600 uppercase tracking-widest mb-1.5">
              NIVEL 2 - AVANZADO / MISIÓN {missionIndex}
            </p>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">{stage.title}</h2>
            
            {/* Grid Visual representation */}
            <div className="aspect-square w-full max-w-[260px] mx-auto border border-gray-100 bg-gray-50/50 rounded-2xl p-4 mb-6 grid gap-2" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
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
              <p className="text-xs text-gray-700 leading-relaxed font-mono">
                {stage.summary}
              </p>
            </div>
            
            <button
              onClick={() => {
                setScenarioIntroVisible(false);
                if (showTutorial) setTutorialVisible(true);
              }}
              className="btn-press bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-indigo-600/20 transition-all duration-200 w-full"
            >
              {showTutorial ? "Comenzar tutorial" : "Comenzar mision"}
            </button>
          </div>
        </div>
      )}

      {/* Editor Header */}
      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-4 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={`/levels/3/mission`}
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
          <button
            id="btn-compile"
            ref={compileRef}
            onClick={compileProgram}
            disabled={!canCompile}
            className={`btn-press flex items-center gap-1.5 text-xs text-white font-semibold px-4 py-1.5 rounded-lg transition-all duration-300 ${
              isCompileButtonHighlighted
                ? "bg-indigo-650 ring-4 ring-indigo-500 ring-offset-2 animate-pulse scale-105 z-50 relative border-2 border-white shadow-xl"
                : "bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed"
            }`}
          >
            Compilar
          </button>
          <button
            ref={loadRef}
            onClick={goToRobot}
            disabled={compilerResult.status !== "success"}
            className={`btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              compilerResult.status === "success"
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Cpu size={13} weight="duotone" />
            Cargar programa
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Block Palette */}
        <div
          ref={paletteRef}
          className="w-[230px] lg:w-[250px] flex-shrink-0 border-r border-gray-300 bg-white overflow-y-auto"
        >
          <div className="p-3">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider mb-2 px-1">
              Bloques
            </p>
            {paletteHint && (
              <div className="mb-3 rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[11px] leading-relaxed text-indigo-700">
                {paletteHint}
              </div>
            )}
            <div className="flex flex-col gap-1.5">
              {config.palette.map((def, i) => {
                const isPaletteHighlighted =
                  (def.type === "REPEAT" && isRepeatPaletteHighlighted) ||
                  (def.type === "FORWARD" && isForwardPaletteHighlighted) ||
                  (def.type === "TURN_RIGHT" && isTurnRightPaletteHighlighted) ||
                  (def.type === "TURN_LEFT" && isTurnLeftPaletteHighlighted) ||
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

        {/* Program Editor Panel */}
        <div
          ref={programRef}
          className={`flex-1 flex flex-col min-w-0 border-r border-gray-300 bg-gray-50/50 transition-all ${
            isProgramDropGuideActive
              ? "bg-indigo-50/30 ring-4 ring-inset ring-indigo-400/85 shadow-[0_0_0_1px_rgba(99,102,241,0.22),0_0_42px_rgba(99,102,241,0.32)]"
              : ""
          }`}
        >
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Programa ({program.length}/25)
            </p>
            {isProgramDropGuideActive && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
                Suelta aquí
              </span>
            )}
          </div>
          <div
            className={`relative flex-1 overflow-y-auto p-4 max-w-[560px] mx-auto w-full transition-all ${
              isProgramDropActive ? "bg-indigo-50/70" : ""
            } ${
              isProgramDropGuideActive
                ? "bg-indigo-50/60 ring-4 ring-inset ring-indigo-400/70 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.14)]"
                : ""
            }`}
            onDragOver={handleProgramDragOver}
            onDrop={handleProgramDrop}
          >
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(191,219,254,0.26),transparent_58%)] animate-pulse" />
            )}
            {isProgramDropGuideActive && (
              <div className="pointer-events-none absolute inset-2 rounded-xl border border-indigo-300/90 bg-indigo-100/20 shadow-[0_0_0_1px_rgba(165,180,252,0.18),0_0_38px_rgba(99,102,241,0.34)]" />
            )}
            {isProgramDropGuideActive && (
              <div className="relative z-10 mb-2 flex items-center justify-between rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-2 text-[10px] font-mono text-indigo-700 uppercase tracking-wider shadow-[0_0_24px_rgba(99,102,241,0.18)]">
                <span>Arrastra y suelta los bloques aquí</span>
                <span>Zona activa</span>
              </div>
            )}
            <div className="relative z-10 flex flex-col gap-2 min-h-full">
              {renderProgramItems(programView, false, true)}
              {program.length < 2 && (
                <div className="flex items-center justify-center gap-2 py-8 px-4 text-xs text-gray-400 border border-dashed border-gray-300 bg-white/85 rounded-xl shadow-sm">
                  <Plus size={14} />
                  Arrastra bloques desde el panel izquierdo
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2D Simulator & Console */}
        <div className="w-[300px] lg:w-[340px] flex-shrink-0 flex flex-col border-l border-gray-200">
          <div className="p-3 border-b border-gray-300/60">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Simulador & Consola
            </p>
          </div>
          <div className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
            {/* Visual Grid representation */}
            <div className="aspect-square w-full max-w-[280px] mx-auto border border-gray-200 bg-gray-50 rounded-xl p-3 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}>
              {Array.from({ length: gridSize }).map((_, r) =>
                Array.from({ length: gridSize }).map((_, c) => {
                  const isStart = stage.grid[r][c] === 2;
                  const isGoal = stage.grid[r][c] === 3;
                  const isObstacle = stage.grid[r][c] === 1;
                  return (
                    <div
                      key={`${r}-${c}`}
                      className={`rounded flex items-center justify-center font-bold text-[9px] ${
                        isStart
                          ? "bg-indigo-600 text-white"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-400 text-emerald-700 animate-pulse"
                          : isObstacle
                          ? "bg-gray-600 text-white"
                          : "bg-white border border-gray-200"
                      }`}
                    >
                      {isStart && "→"}
                      {isGoal && "META"}
                    </div>
                  );
                })
              )}
            </div>

            {/* Status card */}
            <div
              className={`p-4 rounded-xl border flex flex-col gap-2 ${
                compilerResult.status === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : compilerResult.status === "error"
                  ? "border-red-300 bg-red-50 text-red-800"
                  : "border-gray-200 bg-gray-50 text-gray-600"
              }`}
            >
              <div className="flex items-center gap-2">
                {compilerResult.status === "success" ? (
                  <CheckCircle size={18} weight="fill" className="text-emerald-500" />
                ) : compilerResult.status === "error" ? (
                  <Warning size={18} weight="fill" className="text-red-500" />
                ) : (
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                )}
                <span className="text-xs font-mono font-bold uppercase tracking-wider">
                  {compilerResult.status === "success"
                    ? "Compilacion exitosa"
                    : compilerResult.status === "error"
                    ? "Errores detectados"
                    : "Esperando Compilacion"}
                </span>
              </div>
              <p className="text-xs leading-relaxed">{compilerResult.message}</p>
            </div>

            {/* Stage description info block */}
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col gap-2">
              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">{stage.scenarioLabel}</p>
              <h4 className="font-bold text-sm text-gray-800">{stage.title}</h4>
              <p className="text-xs text-gray-600 leading-relaxed">{stage.summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Static Backdrop Spotlight Overlay (Adjusts Contrast only, No Flicker/Pulse) */}
      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius:
              tutorialStep === 7
                ? "9999px"
                : "12px",
            boxShadow: "0 0 0 9999px rgba(9, 13, 22, 0.55)",
            zIndex: 39,
          }}
        />
      )}

      {/* Pulsing Glow Ring around the Target element (No full-screen Shadow to prevent Flicker) */}
      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200 animate-pulse"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius:
              tutorialStep === 7
                ? "9999px"
                : "12px",
            border: "5px solid #ffffff",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.9)",
            zIndex: 40,
          }}
        />
      )}

      {/* Tutorial overlay - Sleek dark card exactly like the user's screenshot, draggable freely */}
      {showTutorial && tutorialVisible && currentTutorialStep && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          className="fixed w-[380px] bg-[#090d16] border border-slate-800 shadow-2xl shadow-black/85 rounded-3xl p-6 flex flex-col gap-4 select-none cursor-grab active:cursor-grabbing"
          style={{ zIndex: 45, ...cardPlacementStyle }}
        >
          {/* Drag Handle Bar */}
          <div className="w-12 h-1 bg-slate-850 rounded-full mx-auto -mt-2 opacity-60" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11px] font-bold font-mono text-indigo-400 uppercase tracking-widest">
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
              <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-indigo-400 text-[11px] font-bold font-mono shadow-md">
                N
              </div>
              <button
                onClick={() => {
                  setTutorialVisible(false);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
              >
                Omitir
              </button>
            </div>
            
            <div className="flex gap-2">
              {tutorialStep > 0 && (
                <button
                  onClick={() => {
                    setTutorialStep((current) => Math.max(0, current - 1));
                  }}
                  className="border border-slate-850 hover:bg-slate-800/40 text-slate-300 font-semibold text-xs px-4 py-2 rounded-xl transition-all"
                >
                  Atrás
                </button>
              )}
              {tutorialStep === 7 ? (
                <button
                  onClick={() => {
                    setTutorialVisible(false);
                  }}
                  className="bg-indigo-650 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-indigo-650/30 transition-all"
                >
                  Terminar
                </button>
              ) : (
                <button
                  disabled={!canAdvanceTutorial}
                  onClick={() => {
                    setTutorialStep((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1));
                  }}
                  className={`font-bold text-xs px-4 py-2 rounded-xl transition-all ${
                    canAdvanceTutorial
                      ? "bg-indigo-650 hover:bg-indigo-750 text-white shadow-lg shadow-indigo-650/30 cursor-pointer"
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
    </div>
  );
}

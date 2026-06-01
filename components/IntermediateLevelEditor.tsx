"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { LEVEL_2_STAGES } from "@/lib/nivel-1";
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
};

const EMPTY_BLOCKS: BlockType[] = [];

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Paso 1",
    text: "Tu programa ya empieza con Iniciar mision. Ahora pulsa Si hay obstaculo / Si no hay obstaculo para abrir la decision y completar sus dos respuestas. Cuando lo hagas, avanzaremos automaticamente al siguiente paso.",
    target: "palette",
    lockText: "Agrega la respuesta del obstaculo y la respuesta libre para desbloquear el siguiente paso.",
    blocksToPress: ["IF_OBS_ELSE"],
  },
  {
    title: "Paso 2",
    text: "Ahora pulsa Girar derecha para la respuesta del obstaculo y Avanzar para la respuesta libre. Luego agrega un Avanzar simple fuera de la decision para llegar a la meta y termina con Detener para cerrar el programa correctamente. Al terminar, pasaremos solos al siguiente paso.",
    target: "palette",
    lockText: "Agrega la respuesta libre con Avanzar, el Avanzar final sin numero y Detener para continuar.",
    blocksToPress: ["TURN_RIGHT", "FORWARD", "STOP"],
  },
  {
    title: "Paso 3",
    text: "Cuando termines, pulsa Compilar. Si algo queda mal, se marcara en rojo. Si todo esta bien, el tutorial seguira automaticamente.",
    target: "compile",
    lockText: "Compila la secuencia correcta para avanzar al último paso.",
  },
  {
    title: "Paso 4",
    text: "Si la compilacion queda correcta, pulsa Cargar para enviar el programa.",
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
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [scenarioIntroVisible, setScenarioIntroVisible] = useState(true);
  const [focusRect, setFocusRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);
  const paletteRef = useRef<HTMLDivElement | null>(null);
  const programRef = useRef<HTMLDivElement | null>(null);
  const compileRef = useRef<HTMLButtonElement | null>(null);
  const loadRef = useRef<HTMLButtonElement | null>(null);

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
        ...(def.type === "FORWARD" ? { steps: 1 } : {}),
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
          ? current[index + 1]?.type === "WHILE_GOAL" || current[index + 2]?.type === "WHILE_GOAL"
            ? current.length - index
            : 3
          : block.type === "WHILE_GOAL"
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
          program.length === 6 &&
          program[0]?.type === "INIT" &&
          program[1]?.type === "IF_OBS_ELSE" &&
          program[2]?.type === "TURN_RIGHT" &&
          program[3]?.type === "FORWARD" &&
          program[4]?.type === "FORWARD" &&
          program[5]?.type === "STOP"
        );
      case 2:
        return compilerResult.status === "success";
      case 3:
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
    }, 300);

    return () => window.clearTimeout(timer);
  }, [canAdvanceTutorial, currentTutorialStep, showTutorial, tutorialStep, tutorialVisible]);

  const updateFocusRect = useCallback(() => {
    if (!currentTutorialStep || typeof window === "undefined") {
      return;
    }

    const targetRefs = {
      palette: paletteRef,
      program: programRef,
      compile: compileRef,
      load: loadRef,
    };

    const element = targetRefs[currentTutorialStep.target].current;
    if (!element) {
      setFocusRect(null);
      return;
    }

    const rect = element.getBoundingClientRect();
    const padding = currentTutorialStep.target === "compile" || currentTutorialStep.target === "load" ? 10 : 12;

    setFocusRect({
      top: Math.max(12, rect.top - padding),
      left: Math.max(12, rect.left - padding),
      width: Math.min(window.innerWidth - 24, rect.width + padding * 2),
      height: Math.min(window.innerHeight - 24, rect.height + padding * 2),
    });
  }, [currentTutorialStep]);

  useEffect(() => {
    if (!currentTutorialStep) return;

    const frame = window.requestAnimationFrame(updateFocusRect);
    const handleUpdate = () => updateFocusRect();

    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [currentTutorialStep, updateFocusRect]);

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
            ifLoopBody: ifBranch?.type === "WHILE_GOAL" ? loopBody : undefined,
            elseLoopBody: elseBranch?.type === "WHILE_GOAL" ? loopBody : undefined,
          });
          if (ifBranch?.type === "WHILE_GOAL" || elseBranch?.type === "WHILE_GOAL") {
            if (loopEndIndex > index) {
              index = loopEndIndex - 1;
            }
            continue;
          }

          index += 2;
          continue;
        }

        if (block.type === "WHILE_GOAL") {
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
    const showSteps = (options?.allowSteps ?? nested) && block.type === "FORWARD";

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
        className={`rounded-xl border ${block.colorClass} ${
          isHighlighted ? "ring-2 ring-red-400 bg-red-50" : ""
        } overflow-hidden`}
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
            <div className="mb-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-violet-600">
              Mientras no llegue
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
                  item.ifBranch.type === "WHILE_GOAL" ? (
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
                  item.elseBranch.type === "WHILE_GOAL" ? (
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

    if (countBlocks("IF_OBS") > 0) {
      pushIssue("En este nivel no se usa el bloque Si hay obstaculo sin la rama libre.");
    }

    if (countBlocks("IF_OBS_ELSE") !== 1) {
      pushIssue("Cada mision de este nivel necesita exactamente un bloque Si hay obstaculo / Si no hay obstaculo.");
    }

    const whileIndexInProgram = program.findIndex((block) => block.type === "WHILE_GOAL");

    if (missionIndex >= 4 && countBlocks("WHILE_GOAL") !== 1) {
      pushIssue("Esta mision necesita exactamente un bloque Mientras no llegue.");
    }

    if (missionIndex < 4 && countBlocks("WHILE_GOAL") > 0) {
      pushIssue("En esta mision todavia no necesitas Mientras no llegue.");
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
      if (block.type === "FORWARD" || block.type === "BACKWARD") {
        if (!Number.isInteger(block.steps ?? 1) || (block.steps ?? 1) < 1) {
          pushIssue(`El bloque "${BLOCK_LABELS[block.type]}" necesita un numero mayor que 0.`, index);
        }
      }
    });

    if (missionIndex >= 4 && whileIndexInProgram !== -1) {
      const whileBodyLength = stopIndexInProgram - whileIndexInProgram - 1;
      if (whileBodyLength !== 1) {
        pushIssue("Mientras no llegue solo puede contener un bloque.", whileIndexInProgram);
      } else if (program[whileIndexInProgram + 1]?.type !== "FORWARD") {
        pushIssue("Mientras no llegue debe contener un solo bloque Avanzar.", whileIndexInProgram + 1);
      }
    }

    const executionBlocks = program.filter((block) => block.type !== "INIT");
    const stopIndex = executionBlocks.findIndex((block) => block.type === "STOP");
    const loopExitIndex = stopIndex !== -1 ? stopIndex : executionBlocks.length;
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
    let stepIdx = 0;
    let stepCount = 0;
    let loopCount = 0;
    let loopStartIndex: number | null = null;
    let skipAfterBranch = 0;
    let branchDecisionPending = false;
    let branchSkipAfterChosen = 0;
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

      let jumpToNextTick = false;

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
          if (evaluationMessage !== "El programa no llega a la meta.") {
            break;
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
          if (evaluationMessage !== "El programa no llega a la meta.") {
            break;
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
          jumpToNextTick = true;
          break;
        case "IF_OBS_ELSE":
          if (sensors.obstacleAhead) {
            branchDecisionPending = true;
            branchSkipAfterChosen = 1;
          } else {
            stepIdx += 1;
            branchDecisionPending = true;
            branchSkipAfterChosen = 0;
          }
          jumpToNextTick = true;
          break;
        case "WHILE_GOAL":
          loopStartIndex = stepIdx;
          jumpToNextTick = true;
          break;
        case "INIT":
          break;
        default:
          break;
      }

      if (evaluationMessage === "El robot choco con un obstaculo." || evaluationMessage === "El robot salio del area permitida." || evaluationMessage === "El robot choco retrocediendo." || evaluationMessage === "El robot salio del area permitida al retroceder.") {
        break;
      }

      if (jumpToNextTick) {
        continue;
      }

      if (skipAfterBranch > 0) {
        stepIdx += skipAfterBranch;
        skipAfterBranch = 0;
      }

      if (branchDecisionPending) {
        if (branchSkipAfterChosen > 0) {
          stepIdx += branchSkipAfterChosen;
        }
        branchDecisionPending = false;
        branchSkipAfterChosen = 0;
      }

      if (loopStartIndex !== null && stepIdx === loopExitIndex && getCell(pos) !== 3) {
        loopCount += 1;
        if (loopCount > MAX_LOOPS) {
          evaluationMessage = "El bucle alcanzo el limite permitido sin llegar a la meta.";
          break;
        }

        stepIdx = loopStartIndex;
        continue;
      }

      if (stepIdx >= executionBlocks.length) {
        if (getCell(pos) === 3) {
          evaluationMessage = "La secuencia llega a la meta correctamente.";
          break;
        }

        if (loopStartIndex !== null) {
          loopCount += 1;
          if (loopCount > MAX_LOOPS) {
            evaluationMessage = "El bucle alcanzo el limite permitido sin llegar a la meta.";
            break;
          }

          stepIdx = loopStartIndex;
          continue;
        }

        evaluationMessage = "El programa no llega a la meta.";
        break;
      }
    }

    if (issues.length === 0) {
      if (getCell(pos) === 3) {
        setCompilerResult({
          status: "success",
          message:
            "Compilacion correcta. La secuencia cumple con el escenario de la mision.",
          issues: [
            {
              message:
                "Ahora puedes cargar el programa al robot fisico desde el boton de Cargar.",
            },
          ],
          highlightIndexes: [],
        });

        if (showTutorial && tutorialVisible && tutorialStep === 2) {
          setTutorialStep(3);
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
  }, [
    canCompile,
    config.start,
    config.startDir,
    missionIndex,
    normalizeStepCount,
    program,
    showTutorial,
    stage.id,
    stage.grid,
    tutorialStep,
    tutorialVisible,
  ]);

  const goToRobot = () => {
    if (compilerResult.status === "success") {
      const nextUnlocked = Math.min(LEVEL_2_STAGES.length, missionIndex + 1);
      const currentStored =
        typeof window !== "undefined"
          ? Number(window.localStorage.getItem("bekie-level-2-progress") ?? "1")
          : 1;

      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          "bekie-level-2-progress",
          String(Math.max(currentStored, nextUnlocked))
        );
      }
      if (showTutorial) {
        setTutorialVisible(false);
        setFocusRect(null);
      }
      router.push("/robot");
    }
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

      if (stage.id === 4 || stage.id === 5) {
        return "En esta misión combina Si hay obstaculo / Si no hay obstaculo con Mientras no llegue. El numero en Avanzar se usa en la ruta que realmente se repite.";
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
    setFocusRect(null);
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
    if (!canAdvanceTutorial) return tutorialStep === 2 ? "Compila primero" : "Completa el paso";
    return "Siguiente";
  })();

  const getPaletteBlockClasses = useCallback(
    (def: PaletteBlock) => {
      const base = `block-item w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all ${def.colorClass} hover:brightness-125`;

      if (!tutorialVisible || !currentTutorialStep || tutorialBlocksToPress.length === 0) {
        return base;
      }

      if (tutorialHighlightBlocks.has(def.type)) {
        return `${base} ring-2 ring-violet-200 shadow-[0_0_0_2px_rgba(168,85,247,0.32)] scale-[1.03] brightness-125 saturate-125`;
      }

      return `${base} opacity-15 saturate-0 brightness-60`;
    },
    [currentTutorialStep, tutorialBlocksToPress.length, tutorialHighlightBlocks, tutorialVisible]
  );

  const previousTutorialStep = () => {
    setTutorialStep((current) => Math.max(0, current - 1));
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
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
          <button
            onClick={clearProgram}
            className="btn-press flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 px-3 py-1.5 rounded-lg border border-gray-300 hover:border-gray-400 transition-colors"
          >
            <Trash size={13} />
            Limpiar
          </button>
          <button
            ref={compileRef}
            onClick={compileProgram}
            disabled={!canCompile}
            className={`btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
              canCompile
                ? "bg-violet-600 text-white hover:bg-violet-700"
                : "bg-gray-200 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Code size={13} weight="bold" />
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
            Cargar
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
              {config.palette.map((def, i) => (
                <button
                  key={`${def.type}-${i}`}
                  onClick={() => addBlock(def)}
                  className={getPaletteBlockClasses(def)}
                >
                  <span className="flex-shrink-0">{def.icon}</span>
                  <span className="text-xs font-mono">{def.label}</span>
                  <Plus size={11} className="ml-auto opacity-40" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          ref={programRef}
          className="flex-1 flex flex-col min-w-0 border-r border-gray-300"
        >
          <div className="p-3 border-b border-gray-300/60 flex items-center justify-between">
            <p className="text-[10px] font-mono text-gray-600 uppercase tracking-wider">
              Programa ({program.length}/25)
            </p>
            <span className="text-[10px] font-mono text-violet-600 uppercase tracking-wider">
              Mision {missionIndex}/5
            </span>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="flex flex-col gap-1.5">
              {renderProgramItems(programView)}
              {program.length < 2 && (
                <div className="flex items-center gap-2 py-3 px-3 text-xs text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <Plus size={13} />
                  Agrega bloques desde el panel izquierdo
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

      {showTutorial && tutorialVisible && focusRect && (
        <div className="fixed inset-0 z-[80] pointer-events-none">
          <div
            className="absolute rounded-2xl border-2 border-violet-300 shadow-[0_0_0_9999px_rgba(0,0,0,0.68)] transition-all duration-200"
            style={{
              top: focusRect.top,
              left: focusRect.left,
              width: focusRect.width,
              height: focusRect.height,
            }}
          />

          <div className="absolute left-4 right-4 bottom-4 sm:left-6 sm:right-auto sm:max-w-[390px] pointer-events-auto">
            <div className="rounded-2xl border border-white/20 bg-gray-950 text-white shadow-2xl p-4">
              <div className="flex items-center justify-between gap-3 mb-2">
                <p className="text-xs font-mono uppercase tracking-wider text-violet-300">
                  {currentTutorialStep?.title}
                </p>
                <span className="text-[10px] font-mono text-gray-300">
                  {tutorialStep + 1}/{TUTORIAL_STEPS.length}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-gray-100">{tutorialText}</p>
              {!canAdvanceTutorial && currentTutorialStep && (
                <p className="mt-2 text-[11px] leading-relaxed text-violet-200">
                  {currentTutorialStep.lockText}
                </p>
              )}

              <div className="mt-4 flex items-center justify-between gap-2">
                <button
                  onClick={closeTutorial}
                  className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-900 transition-colors"
                >
                  Omitir
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={previousTutorialStep}
                    disabled={tutorialStep === 0}
                    className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg border border-gray-700 text-gray-200 hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={nextTutorialStep}
                    disabled={!canAdvanceTutorial}
                    className="btn-press text-[11px] font-semibold px-3 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 transition-colors disabled:opacity-45 disabled:cursor-not-allowed"
                  >
                    {tutorialActionLabel}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {scenarioIntroVisible && (
        <motion.div
          className="fixed inset-0 z-[90] flex cursor-pointer items-center justify-center bg-black/75 px-4 py-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.25, ease: EASE_OUT }}
          onClick={dismissScenarioIntro}
        >
          <motion.div
            className="w-full max-w-5xl rounded-[28px] border border-white/20 bg-white shadow-2xl overflow-hidden"
            initial={{ scale: 0.94, y: 18, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            transition={{ duration: 0.32, ease: EASE_OUT }}
          >
            <div className="bg-violet-50/85 border-b border-violet-200 px-5 py-4">
              <p className="text-[10px] font-mono text-violet-700 uppercase tracking-[0.3em] mb-2">
                Presiona en cualquier lugar para continuar
              </p>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{stage.scenarioLabel}</p>
                  <p className="text-2xl font-bold tracking-tight text-gray-900 mt-1">
                    {stage.title}
                  </p>
                </div>
                <p className="text-xs font-mono px-2.5 py-1 rounded-full bg-violet-400/10 text-violet-700 flex-shrink-0">
                  {stage.difficulty}
                </p>
              </div>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{stage.summary}</p>
            </div>

            <div className="p-5">
              <div
                className="grid gap-1.5"
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
                        key={`intro-${row}-${col}`}
                        className={`aspect-square rounded-md flex items-center justify-center text-[11px] font-mono ${
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

              <p className="mt-4 text-sm text-gray-700 leading-relaxed">
                {stage.objective}
              </p>
              <p className="mt-2 text-xs text-violet-700 leading-relaxed">
                Construye este escenario para realizar las pruebas.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

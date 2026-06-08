"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
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
  Play,
  StopCircle,
  FolderOpen,
  ArrowUp,
  ArrowDown,
  ArrowClockwise,
  ArrowCounterClockwise,
  PencilSimple,
} from "@phosphor-icons/react";
import { LEVEL_3_STAGES } from "@/lib/nivel-2";
import { unlockMissionAfterComplete, saveRobotLoadPayload } from "@/lib/progress";
import {
  type BlockType,
  type Dir,
  type EditorLevelContent,
  type MissionStage,
  type PaletteBlock,
} from "@/lib/levels";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

type TutorialTarget = "create-btn" | "editor-modal" | "custom-list" | "probar-btn";

interface TutorialStep {
  target: TutorialTarget;
  selector: string;
  text: string;
  lockText?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    target: "create-btn",
    selector: "#btn-create-custom-block",
    text: "¡Bienvenido al Nivel 2 (Avanzado)! Aquí aprenderás a programar en C para controlar Arduino. En este nivel no tienes bloques de movimiento hechos. Presiona el botón '+' para crear tu primer bloque de movimiento.",
    lockText: "Haz clic en el botón '+' para comenzar.",
  },
  {
    target: "editor-modal",
    selector: "#modal-c-editor",
    text: "Este es el Editor de Código C para Arduino. El nombre del bloque será el de la función. Escribe el comando 'forward();' dentro de la función void para avanzar y luego presiona 'Crear Bloque'.",
    lockText: "Escribe tu código y haz clic en 'Crear Bloque'.",
  },
  {
    target: "custom-list",
    selector: "#custom-blocks-list",
    text: "¡Perfecto! Tu función C se ha compilado con éxito y se convirtió en tu primer bloque personalizado. Arrástralo hacia el 'Programa Principal' en el espacio de trabajo.",
    lockText: "Arrastra el bloque creado a la secuencia.",
  },
  {
    target: "probar-btn",
    selector: "#btn-play-sim",
    text: "¡Excelente! Ahora tu robot tiene instrucciones. Presiona el botón 'Probar' para iniciar la simulación 2D y verificar tu código.",
    lockText: "Haz clic en 'Probar' para ejecutar.",
  },
];

interface Block extends PaletteBlock {
  id: string;
  steps?: number;
  // For custom blocks
  isCustom?: boolean;
  sequence?: Omit<Block, "id">[];
}

interface CompilerResult {
  status: "idle" | "success" | "error";
  message: string;
  issues: { message: string; index?: number }[];
  highlightIndexes: number[];
}

interface CustomBlockDefinition {
  name: string;
  colorClass: string;
  iconType: "code" | "folder" | "cpu";
  sequence: Omit<Block, "id">[];
}

type SimStatus = "idle" | "running" | "success" | "collision" | "oob" | "incomplete";

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

const DIR_DELTA: [number, number][] = [
  [0, 1],
  [1, 0],
  [0, -1],
  [-1, 0],
];
const DIR_ARROW = ["→", "↓", "←", "↑"];
const SENSOR_STEP_CM = 20;
const BLOCK_DRAG_MIME = "application/x-bekie-block";
const MAX_STEPS = 220;

const COLORS = [
  { class: "border-indigo-300 bg-indigo-50 text-indigo-700", label: "Indigo" },
  { class: "border-violet-300 bg-violet-50 text-violet-700", label: "Violeta" },
  { class: "border-pink-300 bg-pink-50 text-pink-700", label: "Rosa" },
  { class: "border-emerald-300 bg-emerald-50 text-emerald-700", label: "Esmeralda" },
  { class: "border-amber-300 bg-amber-50 text-amber-700", label: "Ámbar" },
];

export default function CustomBlockLevelEditor({
  config,
  stage,
  missionIndex,
}: {
  config: EditorLevelContent;
  stage: MissionStage;
  missionIndex: number;
}) {
  const router = useRouter();
  const levelKey = "3";
  const progressKey = "bekie-level-3-progress";
  const stagesList = LEVEL_3_STAGES;
  const totalMissions = stagesList.length;

  // Límite de bloques en el editor principal según la misión
  const maxMainBlocks = useMemo(() => {
    if (stage.id === 1) return 5;
    if (stage.id === 2) return 6;
    if (stage.id === 3) return 6;
    return 8;
  }, [stage.id]);

  const [program, setProgram] = useState<Block[]>(() => [
    { ...config.palette[0], id: "b_1" }, // Iniciar mision
  ]);

  const [customBlocks, setCustomBlocks] = useState<CustomBlockDefinition[]>([]);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorName, setCreatorName] = useState("");
  const [creatorColor, setCreatorColor] = useState(COLORS[0].class);
  const [creatorIcon, setCreatorIcon] = useState<"code" | "folder" | "cpu">("code");
  const [creatorError, setCreatorError] = useState("");
  const [creatorCode, setCreatorCode] = useState("");
  const [editingBlockIndex, setEditingBlockIndex] = useState<number | null>(null);

  const openCreatorModal = () => {
    setEditingBlockIndex(null);
    setCreatorName("");
    setCreatorCode(`void mi_bloque() {\n  // Escribe aquí tus comandos de Arduino\n  // Comandos disponibles:\n  // - forward();\n  // - backward();\n  // - turnRight();\n  // - turnLeft();\n  \n  forward();\n}`);
    setCreatorColor(COLORS[0].class);
    setCreatorIcon("code");
    setCreatorError("");
    setShowCreatorModal(true);

    if (showTutorial && tutorialVisible && tutorialStep === 0) {
      setTutorialStep(1);
    }
  };

  const openEditBlockModal = (idx: number) => {
    const block = customBlocks[idx];
    if (!block) return;
    setEditingBlockIndex(idx);
    setCreatorName(block.name);
    setCreatorCode(block.code || `void ${block.name}() {\n  // Escribe aquí tus comandos de Arduino\n  forward();\n}`);
    setCreatorColor(block.colorClass);
    setCreatorIcon(block.iconType);
    setCreatorError("");
    setShowCreatorModal(true);
  };

  const deleteCustomBlock = (idx: number) => {
    setCustomBlocks((current) => current.filter((_, i) => i !== idx));
  };

  // ── TUTORIAL DE NIVEL 2 ──
  const showTutorial = missionIndex === 1;
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [targetRect, setTargetRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (showTutorial) {
      setTutorialVisible(true);
      setTutorialStep(0);
    }
  }, [showTutorial]);

  const updateTargetRect = useCallback(() => {
    if (!showTutorial || !tutorialVisible) {
      setTargetRect(null);
      return;
    }
    const currentStep = TUTORIAL_STEPS[tutorialStep];
    if (!currentStep) return;

    const el = document.querySelector(currentStep.selector);
    if (el) {
      const r = el.getBoundingClientRect();
      setTargetRect({
        top: r.top,
        left: r.left,
        width: r.width,
        height: r.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [showTutorial, tutorialVisible, tutorialStep]);

  useEffect(() => {
    updateTargetRect();
    const t = window.setTimeout(updateTargetRect, 100);

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
  }, [updateTargetRect, showTutorial, tutorialVisible, tutorialStep, program]);

  const cardPlacementStyle = useMemo(() => {
    if (!targetRect) {
      return { bottom: "32px", left: "32px" };
    }

    const W = typeof window !== "undefined" ? window.innerWidth : 1200;
    const isTargetInLeft = targetRect.left < W / 2;

    if (isTargetInLeft) {
      return { bottom: "32px", right: "32px" };
    }
    return { bottom: "32px", left: "32px" };
  }, [targetRect]);

  const canAdvanceTutorial = useMemo(() => {
    if (!showTutorial || !tutorialVisible) return false;
    // Step 0: click '+' button
    if (tutorialStep === 0) return false; // Advanced by clicking '+'
    // Step 1: write C code and click 'Crear Bloque'
    if (tutorialStep === 1) return false; // Advanced by handleSaveCustomBlock
    // Step 2: drag custom block to program
    if (tutorialStep === 2) return false; // Advanced by useEffect checking program
    // Step 3: click 'Probar'
    if (tutorialStep === 3) return false; // Advanced by runSimulation
    return true;
  }, [showTutorial, tutorialVisible, tutorialStep]);

  useEffect(() => {
    if (showTutorial && tutorialVisible && tutorialStep === 2) {
      const hasCustomBlock = program.some((p) => p.isCustom);
      if (hasCustomBlock) {
        setTutorialStep(3);
      }
    }
  }, [program, showTutorial, tutorialVisible, tutorialStep]);

  const [compilerResult, setCompilerResult] = useState<CompilerResult>({
    status: "idle",
    message: "Agrega bloques al programa para habilitar el compilador.",
    issues: [],
    highlightIndexes: [],
  });
  const [executionTrace, setExecutionTrace] = useState<string[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Simulador 2D State
  const findStartPos = useCallback((): [number, number] => {
    for (let r = 0; r < stage.grid.length; r++) {
      const c = stage.grid[r].indexOf(2);
      if (c !== -1) return [r, c];
    }
    return [0, 0];
  }, [stage.grid]);

  const [sim, setSim] = useState<SimState>(() => ({
    pos: findStartPos(),
    dir: config.startDir,
    visited: new Set([`${findStartPos()[0]}-${findStartPos()[1]}`]),
    status: "idle",
    message: "",
    sensors: { front: null, left: null, right: null, obstacleAhead: false },
  }));

  const [isProgramDropActive, setIsProgramDropActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean timeouts on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const measureDistance = useCallback(
    (pos: [number, number], dir: Dir) => {
      const [dr, dc] = DIR_DELTA[dir];
      let row = pos[0];
      let col = pos[1];
      let cells = 0;
      const gridSize = stage.grid.length;

      while (true) {
        row += dr;
        col += dc;
        cells += 1;

        if (row < 0 || row >= gridSize || col < 0 || col >= stage.grid[row]?.length) {
          return cells * SENSOR_STEP_CM;
        }

        if (stage.grid[row][col] === 1) {
          return cells * SENSOR_STEP_CM;
        }
      }
    },
    [stage.grid]
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

  const getCell = useCallback((pos: [number, number]) => stage.grid[pos[0]]?.[pos[1]] ?? null, [stage.grid]);

  // Expansion of custom blocks inside program sequence into pure blocks
  const expandProgram = useCallback((progBlocks: Block[]): Block[] => {
    const result: Block[] = [];
    progBlocks.forEach((block) => {
      if (block.isCustom && block.sequence) {
        block.sequence.forEach((subBlock, idx) => {
          result.push({
            ...subBlock,
            id: `${block.id}_sub_${idx}`,
          } as Block);
        });
      } else {
        result.push(block);
      }
    });
    return result;
  }, []);

  const compileProgram = useCallback(() => {
    const issues: { message: string; index?: number }[] = [];
    const pushIssue = (message: string, index?: number) => {
      issues.push({ message, index });
    };

    if (program.length === 0 || program[0].type !== "INIT") {
      pushIssue("El programa debe comenzar con Iniciar mision.", 0);
    }

    if (program.length < 2) {
      pushIssue("Agrega al menos un bloque de movimiento o un bloque personalizado.");
    }

    if (program.length > maxMainBlocks) {
      pushIssue(
        `Límite de bloques excedido (${program.length}/${maxMainBlocks}). Reduce bloques principales usando bloques personalizados.`
      );
    }

    const stopIndexInProgram = program.findIndex((block) => block.type === "STOP");
    const hasStop = program.some((block) => block.type === "STOP");
    if (!hasStop) {
      pushIssue("Esta mision necesita exactamente un bloque Detener.");
    } else if (stopIndexInProgram !== program.length - 1) {
      pushIssue("El bloque Detener debe quedar al final de la secuencia.", stopIndexInProgram);
    }

    // Expand to test simulated execution
    const expandedBlocks = expandProgram(program).filter((b) => b.type !== "INIT");

    let pos = findStartPos();
    let dir = config.startDir;
    let stepCount = 0;
    let stepIdx = 0;
    let evaluationMessage = "El robot no llega a la meta.";

    const trace: string[] = ["Iniciar mision"];

    while (stepCount++ <= MAX_STEPS) {
      if (stepIdx >= expandedBlocks.length) {
        if (getCell(pos) === 3) {
          evaluationMessage = "La secuencia llega a la meta correctamente.";
        }
        break;
      }

      const block = expandedBlocks[stepIdx++];
      if (!block) break;

      const blockLabel = block.label;
      if (block.type === "FORWARD" || block.type === "BACKWARD") {
        trace.push(blockLabel);
      } else if (
        block.type === "TURN_RIGHT" ||
        block.type === "TURN_LEFT" ||
        block.type === "WAIT" ||
        block.type === "STOP"
      ) {
        trace.push(blockLabel);
      }

      const moveRobotSim = (moveDir: Dir): boolean => {
        const [dr, dc] = DIR_DELTA[moveDir];
        const next: [number, number] = [pos[0] + dr, pos[1] + dc];
        const cell = getCell(next);

        if (cell === null) {
          evaluationMessage = "El robot salio del area permitida.";
          return true;
        }
        if (cell === 1) {
          evaluationMessage = "El robot choco con un obstaculo.";
          return true;
        }

        pos = next;
        return false;
      };

      switch (block.type as BlockType) {
        case "FORWARD":
          if (moveRobotSim(dir)) stepCount = MAX_STEPS + 10;
          break;
        case "BACKWARD":
          if (moveRobotSim(((dir + 2) % 4) as Dir)) stepCount = MAX_STEPS + 10;
          break;
        case "TURN_RIGHT":
          dir = ((dir + 1) % 4) as Dir;
          break;
        case "TURN_LEFT":
          dir = ((dir + 3) % 4) as Dir;
          break;
        case "STOP":
          if (getCell(pos) === 3) {
            evaluationMessage = "La secuencia llega a la meta correctamente.";
          } else {
            evaluationMessage = "El robot se detuvo antes de llegar a la meta.";
          }
          stepCount = MAX_STEPS + 10;
          break;
        default:
          break;
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

    if (isSuccess) {
      setExecutionTrace(trace);
      setShowSuccessModal(true);
    } else {
      setShowErrorModal(true);
    }
  }, [program, findStartPos, config.startDir, getCell, expandProgram, maxMainBlocks]);

  const goToRobot = () => {
    if (compilerResult.status === "success") {
      unlockMissionAfterComplete(progressKey, missionIndex, totalMissions);
      saveRobotLoadPayload({
        levelKey: levelKey,
        missionIndex,
        missionTitle: stage.title,
        commands: executionTrace,
      });
      router.push(`/levels/${levelKey}/load?mission=${missionIndex}`);
    }
  };

  // Drag and drop setup for editor
  const handlePaletteDragStart = (type: BlockType, customIndex?: number) => (event: DragEvent<HTMLButtonElement>) => {
    event.dataTransfer.effectAllowed = "copy";
    if (customIndex !== undefined) {
      event.dataTransfer.setData(BLOCK_DRAG_MIME, `custom_${customIndex}`);
    } else {
      event.dataTransfer.setData(BLOCK_DRAG_MIME, type);
    }
  };

  const handleProgramDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsProgramDropActive(true);
  };

  const handleProgramDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsProgramDropActive(false);

    const payload = event.dataTransfer.getData(BLOCK_DRAG_MIME);
    if (!payload) return;

    if (payload.startsWith("custom_")) {
      const idx = parseInt(payload.replace("custom_", ""), 10);
      const customDef = customBlocks[idx];
      if (!customDef) return;

      const getIconComponent = (type: "code" | "folder" | "cpu") => {
        if (type === "folder") return <FolderOpen size={14} weight="fill" />;
        if (type === "cpu") return <Cpu size={14} weight="fill" />;
        return <Code size={14} weight="fill" />;
      };

      setProgram((current) => [
        ...current,
        {
          id: `custom_${Date.now()}`,
          type: "FORWARD", // Mock type for compatibility
          label: customDef.name,
          colorClass: customDef.colorClass,
          icon: getIconComponent(customDef.iconType),
          isCustom: true,
          sequence: customDef.sequence,
        },
      ]);
    } else {
      const def = config.palette.find((p) => p.type === payload);
      if (!def) return;
      setProgram((current) => [
        ...current,
        { ...def, id: `block_${Date.now()}` },
      ]);
    }
  };

  const removeBlock = (id: string) => {
    setProgram((current) => current.filter((b, idx) => idx === 0 || b.id !== id));
  };

  const clearProgram = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setProgram([{ ...config.palette[0], id: "b_1" }]);
    setSim({
      pos: findStartPos(),
      dir: config.startDir,
      visited: new Set([`${findStartPos()[0]}-${findStartPos()[1]}`]),
      status: "idle",
      message: "",
      sensors: { front: null, left: null, right: null, obstacleAhead: false },
    });
  };

  // Run Simulation 2D
  const runSimulation = () => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (showTutorial && tutorialVisible && tutorialStep === 3) {
      setTutorialVisible(false);
    }

    const expandedBlocks = expandProgram(program).filter((b) => b.type !== "INIT");

    let pos = findStartPos();
    let dir = config.startDir;
    const visited = new Set<string>([`${pos[0]}-${pos[1]}`]);
    let sensors = readSensors(pos, dir);
    let stepIdx = 0;
    let stepCount = 0;

    setSim({
      pos,
      dir,
      visited,
      status: "running",
      message: "Simulación iniciada con bloques expandidos.",
      sensors,
    });

    const tick = () => {
      if (stepCount++ > MAX_STEPS) {
        setSim((prev) => ({
          ...prev,
          status: "incomplete",
          message: "Llegó al límite de pasos.",
        }));
        return;
      }

      if (stepIdx >= expandedBlocks.length) {
        const atGoal = getCell(pos) === 3;
        setSim((prev) => ({
          ...prev,
          status: atGoal ? "success" : "incomplete",
          message: atGoal ? "¡Felicidades! Llegaste a la meta." : "El robot no llegó a la meta.",
        }));
        return;
      }

      const block = expandedBlocks[stepIdx++];
      let failed = false;

      const moveRobotSim = (moveDir: Dir): boolean => {
        const [dr, dc] = DIR_DELTA[moveDir];
        const next: [number, number] = [pos[0] + dr, pos[1] + dc];
        const cell = getCell(next);

        if (cell === null) {
          failed = true;
          setSim((prev) => ({ ...prev, pos: next, status: "oob", message: "Fuera de la pista." }));
          return true;
        }
        if (cell === 1) {
          failed = true;
          setSim((prev) => ({ ...prev, pos: next, status: "collision", message: "Colisión con obstáculo." }));
          return true;
        }

        pos = next;
        visited.add(`${pos[0]}-${pos[1]}`);
        sensors = readSensors(pos, dir);
        return false;
      };

      switch (block.type as BlockType) {
        case "FORWARD":
          moveRobotSim(dir);
          break;
        case "BACKWARD":
          moveRobotSim(((dir + 2) % 4) as Dir);
          break;
        case "TURN_RIGHT":
          dir = ((dir + 1) % 4) as Dir;
          sensors = readSensors(pos, dir);
          break;
        case "TURN_LEFT":
          dir = ((dir + 3) % 4) as Dir;
          sensors = readSensors(pos, dir);
          break;
        case "STOP":
          const atGoal = getCell(pos) === 3;
          failed = true;
          setSim((prev) => ({
            ...prev,
            status: atGoal ? "success" : "incomplete",
            message: atGoal ? "¡Felicidades! El robot se detuvo en la meta." : "Se detuvo antes de la meta.",
          }));
          break;
        default:
          break;
      }

      if (failed) return;

      setSim({
        pos,
        dir,
        visited: new Set(visited),
        status: "running",
        message: `Ejecutando: ${block.label}`,
        sensors,
      });

      timerRef.current = setTimeout(tick, 450);
    };

    timerRef.current = setTimeout(tick, 450);
  };

  const stopSim = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setSim((prev) => ({ ...prev, status: "idle", message: "" }));
  };

  const handleSaveCustomBlock = () => {
    // Limpiar comentarios de una línea y de múltiples líneas
    const cleanCode = creatorCode
      .replace(/\/\/.*$/gm, "")
      .replace(/\/\*[^]*?\*\//g, "");

    // Buscar la firma de la función void nombre() { ... }
    const funcMatch = cleanCode.match(/void\s+([a-zA-Z_]\w*)\s*\(\s*\)\s*\{([^]*)\}/);
    if (!funcMatch) {
      setCreatorError("Error de sintaxis: Debe definir una función en C válida. Ejemplo:\nvoid mi_bloque() {\n  forward();\n}");
      return;
    }

    const functionName = funcMatch[1].trim();
    const functionBody = funcMatch[2].trim();

    if (!functionName) {
      setCreatorError("Error: La función debe tener un nombre válido.");
      return;
    }

    if (functionName.toLowerCase() === "setup" || functionName.toLowerCase() === "loop") {
      setCreatorError("Error: No puedes usar los nombres reservados 'setup' o 'loop' para tu bloque.");
      return;
    }

    // Buscar todas las llamadas a funciones de tipo cmd();
    const calls = functionBody.match(/[a-zA-Z_]\w*\s*\(\s*\)/g) || [];
    const parsedSequence: Omit<Block, "id">[] = [];

    for (const call of calls) {
      const cmdName = call.replace(/\s*\(\s*\)/, "").trim();
      if (cmdName === "forward" || cmdName === "avanzar") {
        parsedSequence.push({
          type: "FORWARD",
          label: "Avanzar",
          colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
          icon: <ArrowUp size={14} weight="bold" />,
        });
      } else if (cmdName === "backward" || cmdName === "retroceder") {
        parsedSequence.push({
          type: "BACKWARD",
          label: "Retroceder",
          colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
          icon: <ArrowDown size={14} weight="bold" />,
        });
      } else if (cmdName === "turnRight" || cmdName === "girarDerecha") {
        parsedSequence.push({
          type: "TURN_RIGHT",
          label: "Girar derecha",
          colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
          icon: <ArrowClockwise size={14} weight="bold" />,
        });
      } else if (cmdName === "turnLeft" || cmdName === "girarIzquierda") {
        parsedSequence.push({
          type: "TURN_LEFT",
          label: "Girar izquierda",
          colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
          icon: <ArrowCounterClockwise size={14} weight="bold" />,
        });
      } else {
        setCreatorError(`Error de compilación C: Comando '${cmdName}();' no reconocido. Comandos válidos: forward(), backward(), turnRight(), turnLeft()`);
        return;
      }
    }

    if (parsedSequence.length === 0) {
      setCreatorError("Error de compilación: El cuerpo de la función está vacío o no contiene comandos válidos de Arduino.");
      return;
    }

    setCreatorError("");

    const blockName = creatorName.trim() || functionName;

    if (editingBlockIndex !== null) {
      const oldBlockName = customBlocks[editingBlockIndex].name;
      setCustomBlocks((current) => {
        const next = [...current];
        next[editingBlockIndex] = {
          name: blockName,
          colorClass: creatorColor,
          iconType: creatorIcon,
          sequence: [...parsedSequence],
          code: creatorCode,
        };
        return next;
      });

      // Actualizar también los bloques colocados en el programa principal
      setProgram((current) =>
        current.map((p) => {
          if (p.isCustom && p.label === oldBlockName) {
            return {
              ...p,
              label: blockName,
              colorClass: creatorColor,
              icon: getIconTypeComponent(creatorIcon),
              sequence: [...parsedSequence],
            };
          }
          return p;
        })
      );
      setEditingBlockIndex(null);
    } else {
      setCustomBlocks((current) => [
        ...current,
        {
          name: blockName,
          colorClass: creatorColor,
          iconType: creatorIcon,
          sequence: [...parsedSequence],
          code: creatorCode,
        },
      ]);
    }

    // Resetear inputs y cerrar modal
    setCreatorName("");
    setCreatorCode("");
    setShowCreatorModal(false);

    if (showTutorial && tutorialVisible && tutorialStep === 1) {
      setTutorialStep(2);
    }
  };

  const getIconTypeComponent = (type: "code" | "folder" | "cpu") => {
    if (type === "folder") return <FolderOpen size={16} weight="fill" />;
    if (type === "cpu") return <Cpu size={16} weight="fill" />;
    return <Code size={16} weight="fill" />;
  };

  return (
    <div className="relative min-h-[100dvh] bg-white flex flex-col overflow-x-hidden select-none">
      <AppNav userName="Beymar" role="student" />

      {/* Editor Header */}
      <div className="sticky top-[52px] z-30 border-b border-gray-300/60 bg-white/95 backdrop-blur px-5 py-2.5 flex items-center justify-between gap-3">
        <Link
          href={`/levels/${levelKey}/mission`}
          className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={13} />
          Misión
        </Link>
        <span className="text-xs font-mono text-gray-600 hidden sm:block">
          {config.level} - {config.levelSlug} / {stage.title}
        </span>
        <div className="flex items-center gap-2">
          {compilerResult.status === "error" && (
            <button
              type="button"
              onClick={() => setShowErrorModal(true)}
              className="btn-press flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-red-50 text-red-650 border border-red-200 hover:bg-red-100 transition-colors"
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
              className={`btn-press flex items-center gap-1.5 text-xs bg-cyan-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-cyan-700 transition-colors disabled:opacity-40 ${
                showTutorial && tutorialVisible && tutorialStep === 3
                  ? "ring-4 ring-cyan-500 animate-pulse relative z-[100]"
                  : ""
              }`}
            >
              <Play size={13} weight="fill" />
              Probar
            </button>
          )}
          <button
            onClick={compileProgram}
            className="btn-press flex items-center gap-1.5 text-xs bg-violet-600 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-violet-700 transition-colors"
          >
            <Cpu size={13} weight="duotone" />
            Cargar al Robot
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Columna 1: Paleta de Bloques Básicos + Botón de Bloques Personalizados */}
        <div className="w-[240px] flex-shrink-0 border-r border-gray-300 bg-gray-50 flex flex-col p-4 overflow-y-auto">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2 px-1">
            Instrucciones Básicas
          </p>
          <div className="flex flex-col gap-2 mb-6">
            {config.palette
              .filter((p) => p.type === "STOP")
              .map((def, i) => (
                <button
                  key={`${def.type}-${i}`}
                  type="button"
                  draggable
                  onDragStart={handlePaletteDragStart(def.type)}
                  onDragEnd={() => setIsProgramDropActive(false)}
                  className={`block-item w-full flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left bg-white transition-all ${def.colorClass} hover:brightness-95 cursor-grab active:cursor-grabbing`}
                >
                  <span className="flex-shrink-0">{def.icon}</span>
                  <span className="text-xs font-mono flex-1 truncate">{def.label}</span>
                </button>
              ))}
          </div>

          <div className="border-t border-gray-200 pt-4 flex flex-col gap-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-mono text-gray-500 uppercase tracking-wider">
                Mis Bloques (Funciones)
              </span>
              <button
                id="btn-create-custom-block"
                type="button"
                onClick={openCreatorModal}
                className={`p-1 rounded bg-violet-100 text-violet-700 hover:bg-violet-200 transition-colors ${
                  showTutorial && tutorialVisible && tutorialStep === 0
                    ? "ring-4 ring-violet-500 animate-pulse relative z-[100]"
                    : ""
                }`}
                title="Crear bloque personalizado"
              >
                <Plus size={14} weight="bold" />
              </button>
            </div>

            {customBlocks.length === 0 ? (
              <p className="text-[11px] text-gray-400 px-1 font-mono italic">
                Aún no has creado bloques personalizados. ¡Crea uno para optimizar tu código!
              </p>
            ) : (
               <div id="custom-blocks-list" className="flex flex-col gap-2">
                {customBlocks.map((cBlock, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 w-full">
                    <button
                      type="button"
                      draggable
                      onDragStart={handlePaletteDragStart("FORWARD", idx)}
                      onDragEnd={() => setIsProgramDropActive(false)}
                      className={`block-item flex-1 flex items-center gap-2 px-2.5 py-2 rounded-lg border text-left transition-all ${cBlock.colorClass} hover:brightness-95 cursor-grab active:cursor-grabbing text-xs font-mono font-bold truncate`}
                    >
                      <span className="flex-shrink-0">{getIconTypeComponent(cBlock.iconType)}</span>
                      <span className="truncate flex-1">{cBlock.name}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditBlockModal(idx)}
                      className="p-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-650 transition-colors flex-shrink-0"
                      title="Editar bloque"
                    >
                      <PencilSimple size={12} weight="bold" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteCustomBlock(idx)}
                      className="p-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-650 transition-colors flex-shrink-0"
                      title="Eliminar bloque"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Columna 2: Espacio de Trabajo Principal */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-300">
          <div className="p-4 border-b border-gray-300/60 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs font-semibold text-gray-800">
                Programa Principal
              </p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                Límite de bloques: <span className="font-bold text-violet-600">{program.length} / {maxMainBlocks}</span>
              </p>
            </div>
            {program.length > maxMainBlocks && (
              <span className="flex items-center gap-1 text-[10px] text-red-600 bg-red-50 border border-red-200 px-2 py-1 rounded-md font-mono">
                <Warning size={12} weight="fill" /> Exceso de bloques
              </span>
            )}
          </div>

          <div
            className={`flex-1 overflow-y-auto p-4 transition-colors ${
              isProgramDropActive ? "bg-cyan-50/70" : "bg-white"
            }`}
            onDragOver={handleProgramDragOver}
            onDrop={handleProgramDrop}
          >
            <div className="flex flex-col gap-2 min-h-full">
              {program.map((block, i) => (
                <div
                  key={block.id}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border ${block.colorClass}`}
                >
                  <span className="text-[10px] font-mono text-gray-400 w-4 flex-shrink-0">
                    {i + 1}
                  </span>
                  <span className="flex-shrink-0">{block.icon}</span>
                  <span className="text-xs font-mono flex-1 font-bold">{block.label}</span>
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
                <div className="flex items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-8 text-center text-xs text-gray-400 mt-4">
                  Arrastra bloques básicos o tus bloques personalizados aquí
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna 3: Simulador 2D + Didáctica Lateral */}
        <div className="w-[320px] flex-shrink-0 flex flex-col p-4 bg-gray-50 overflow-y-auto gap-4">
          <div>
            <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">
              Pista de simulación
            </p>
            <div
              className="grid gap-1 bg-white p-3 rounded-2xl border border-gray-200"
              style={{ gridTemplateColumns: `repeat(${stage.grid.length}, 1fr)` }}
            >
              {Array.from({ length: stage.grid.length }).map((_, row) =>
                Array.from({ length: stage.grid.length }).map((_, col) => {
                  const cell = stage.grid[row][col];
                  const isRobot = sim.pos[0] === row && sim.pos[1] === col;
                  const isVisited = sim.visited.has(`${row}-${col}`) && !isRobot;
                  const isObstacle = cell === 1;
                  const isGoal = cell === 3;
                  const isStart = cell === 2 && !isRobot;

                  return (
                    <div
                      key={`${row}-${col}`}
                      className={`aspect-square rounded flex items-center justify-center text-[10px] font-mono transition-colors duration-200 ${
                        isRobot
                          ? "bg-cyan-600 text-white font-bold"
                          : isObstacle
                          ? "bg-gray-400 border border-gray-300"
                          : isGoal
                          ? "bg-emerald-100 border border-emerald-400 text-emerald-700 font-bold"
                          : isStart
                          ? "bg-gray-200 border border-gray-350"
                          : isVisited
                          ? "bg-cyan-50 border border-cyan-200"
                          : "bg-white border border-gray-100"
                      }`}
                    >
                      {isRobot && <span>{DIR_ARROW[sim.dir]}</span>}
                      {isGoal && !isRobot && <span>🏁</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Consola del Simulador */}
          <div className="rounded-xl border border-gray-250 bg-white p-3">
            <p className="text-[9px] font-mono text-gray-400 uppercase tracking-wider mb-1">
              Registro del Simulador
            </p>
            <p className="text-xs text-gray-700 leading-relaxed font-mono">
              {sim.message || "Simulación detenida."}
            </p>
          </div>

          {/* Sección de ayuda didáctica para rellenar los espacios vacíos */}
          <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border border-violet-100 rounded-2xl p-4 flex flex-col gap-2">
            <h4 className="text-xs font-bold text-violet-800 uppercase tracking-wider flex items-center gap-1.5">
              <Code size={14} weight="bold" />
              ¿Por qué usar funciones?
            </h4>
            <p className="text-[11px] text-violet-700 leading-relaxed">
              Las funciones te permiten agrupar múltiples pasos de movimiento repetitivos en un solo bloque. 
              Dado que este nivel tiene un límite de bloques muy estricto en el programa principal, ¡debes encapsular el zigzag o las escaleras en tus propios bloques!
            </p>
          </div>
        </div>
      </div>

      {/* MODAL CREAR NUEVO BLOQUE PERSONALIZADO */}
      <AnimatePresence>
        {showCreatorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
              className="w-full max-w-xl bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col p-6 max-h-[90vh]"
            >
              <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
                <div className="flex items-center gap-2 text-violet-750 font-bold">
                  <Code size={20} weight="fill" />
                  <h3 className="text-base font-bold">
                    {editingBlockIndex !== null ? "Editar Bloque Personalizado" : "Crear Bloque Personalizado"}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCreatorModal(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="py-4 flex-1 overflow-y-auto flex flex-col gap-4">
                {/* Ayuda Didáctica e Instrucciones */}
                <div className="p-3.5 rounded-2xl bg-violet-50 border border-violet-100 flex flex-col gap-1.5 text-xs text-violet-850">
                  <span className="font-semibold flex items-center gap-1.5 text-violet-900">
                    <Cpu size={15} weight="fill" className="text-violet-650" /> Comandos de C disponibles para controlar Arduino:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-mono mt-1 text-violet-900 bg-white/60 p-2.5 rounded-xl border border-violet-200/50">
                    <div>
                      <span className="font-bold text-violet-850">forward();</span>
                      <p className="text-gray-500 font-sans mt-0.5">Avanza 1 celda en la cuadrícula.</p>
                    </div>
                    <div>
                      <span className="font-bold text-violet-850">backward();</span>
                      <p className="text-gray-500 font-sans mt-0.5">Retrocede 1 celda en la cuadrícula.</p>
                    </div>
                    <div>
                      <span className="font-bold text-violet-850">turnRight();</span>
                      <p className="text-gray-500 font-sans mt-0.5">Gira 90° hacia la derecha.</p>
                    </div>
                    <div>
                      <span className="font-bold text-violet-850">turnLeft();</span>
                      <p className="text-gray-500 font-sans mt-0.5">Gira 90° hacia la izquierda.</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-sans mt-1">
                    Define tu bloque personalizado usando una función <code className="font-mono text-violet-700 bg-violet-100/50 px-1 py-0.5 rounded">void</code> en C. El nombre de tu función será el nombre asignado al bloque.
                  </p>
                </div>

                {/* Nombre del bloque */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Nombre del bloque:
                  </label>
                  <input
                    type="text"
                    value={creatorName}
                    onChange={(e) => setCreatorName(e.target.value)}
                    placeholder="Ej: Subir_Escalon o mi_bloque"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono focus:border-violet-500 focus:outline-none"
                  />
                </div>

                {/* Editor de Código en C */}
                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-gray-700">
                      Código C (Arduino):
                    </label>
                    <span className="text-[10px] font-mono text-gray-500 bg-gray-100 px-2 py-0.5 rounded border">
                      C++ Sintaxis
                    </span>
                  </div>

                  <div className="relative rounded-2xl border border-gray-300 overflow-hidden bg-slate-950 font-mono text-xs flex">
                    {/* Números de Línea */}
                    <div className="bg-slate-900 text-slate-500 text-right px-2.5 py-4 select-none border-r border-slate-800 text-[11px] leading-relaxed flex flex-col font-mono">
                      <span>1</span>
                      <span>2</span>
                      <span>3</span>
                      <span>4</span>
                      <span>5</span>
                      <span>6</span>
                      <span>7</span>
                      <span>8</span>
                      <span>9</span>
                      <span>10</span>
                      <span>11</span>
                      <span>12</span>
                    </div>
                    {/* Textarea */}
                    <textarea
                      value={creatorCode}
                      onChange={(e) => setCreatorCode(e.target.value)}
                      spellCheck={false}
                      className="flex-1 bg-transparent text-slate-100 p-4 outline-none resize-none font-mono text-[11px] leading-relaxed h-[200px]"
                    />
                  </div>
                </div>

                {/* Selección de Color e Icono */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Color del bloque:
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {COLORS.map((col) => (
                        <button
                          key={col.label}
                          type="button"
                          onClick={() => setCreatorColor(col.class)}
                          className={`w-7 h-7 rounded-full border transition-all ${col.class} ${
                            creatorColor === col.class ? "ring-2 ring-violet-600 ring-offset-2" : ""
                          }`}
                          title={col.label}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      Icono del bloque:
                    </label>
                    <div className="flex gap-2">
                      {[
                        { type: "code", icon: <Code size={16} /> },
                        { type: "folder", icon: <FolderOpen size={16} /> },
                        { type: "cpu", icon: <Cpu size={16} /> },
                      ].map((item) => (
                        <button
                          key={item.type}
                          type="button"
                          onClick={() => setCreatorIcon(item.type as "code" | "folder" | "cpu")}
                          className={`p-2 rounded-lg border transition-all ${
                            creatorIcon === item.type
                              ? "bg-violet-100 border-violet-300 text-violet-700"
                              : "bg-gray-50 border-gray-250 text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {creatorError && (
                  <div className="text-xs text-red-650 font-mono mt-1 p-3 rounded-xl bg-red-50 border border-red-200 whitespace-pre-wrap flex items-start gap-1.5">
                    <Warning size={14} weight="fill" className="text-red-500 mt-0.5 flex-shrink-0" />
                    <span>{creatorError}</span>
                  </div>
                )}
              </div>

              <div className="pt-3.5 border-t border-gray-100 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setShowCreatorModal(false)}
                  className="btn-press border border-gray-250 hover:bg-gray-50 text-gray-650 font-semibold text-xs px-5 py-2.5 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveCustomBlock}
                  className="btn-press bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg"
                >
                  {editingBlockIndex !== null ? "Guardar Cambios" : "Crear Bloque"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal de Errores de Compilación */}
      {showErrorModal && compilerResult.status === "error" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-[2px] p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-150 shadow-2xl overflow-hidden flex flex-col p-6 transition-all duration-300">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div className="flex items-center gap-2 text-red-605 font-bold">
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
              <p className="text-[11px] text-gray-450 mb-3 uppercase tracking-wider font-mono">
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
                className="btn-press bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-5 py-2.5 rounded-xl shadow-lg transition-all duration-200"
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
      {/* Spotlight Backdrop Highlights for Tutorial */}
      {showTutorial && tutorialVisible && targetRect && (
        <div
          className="fixed pointer-events-none transition-all duration-200"
          style={{
            left: targetRect.left - 6,
            top: targetRect.top - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
            borderRadius: "12px",
            boxShadow: "0 0 0 9999px rgba(9, 13, 22, 0.65)",
            zIndex: 49,
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
            borderRadius: "12px",
            border: "4px solid #ffffff",
            boxShadow: "0 0 15px rgba(255, 255, 255, 0.9)",
            zIndex: 50,
          }}
        />
      )}

      {/* Tutorial Assistant Floating Draggable Card */}
      {showTutorial && tutorialVisible && TUTORIAL_STEPS[tutorialStep] && (
        <motion.div
          drag
          dragMomentum={false}
          dragElastic={0.1}
          className="fixed w-[380px] bg-[#090d16] border border-slate-800 shadow-2xl shadow-black/85 rounded-3xl p-6 flex flex-col gap-4 select-none cursor-grab active:cursor-grabbing text-white"
          style={{ zIndex: 55, ...cardPlacementStyle }}
        >
          {/* Drag Handle */}
          <div className="w-12 h-1 bg-slate-800 rounded-full mx-auto -mt-2 opacity-60" />

          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <span className="text-[11px] font-bold font-mono text-cyan-400 uppercase tracking-widest">
              PASO {tutorialStep + 1}
            </span>
            <span className="text-[11px] font-mono text-slate-500">
              {tutorialStep + 1}/{TUTORIAL_STEPS.length}
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed font-mono">
            {TUTORIAL_STEPS[tutorialStep].text}
          </p>

          <div className="flex justify-between items-center mt-2 pt-3 border-t border-slate-800">
            <div className="flex items-center gap-3">
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
                  className="border border-slate-800 hover:bg-slate-800/40 text-slate-350 font-semibold text-xs px-4 py-2 rounded-xl transition-all bg-transparent"
                >
                  Atrás
                </button>
              )}
              {tutorialStep === TUTORIAL_STEPS.length - 1 ? (
                <button
                  onClick={() => setTutorialVisible(false)}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg shadow-cyan-600/30 transition-all border-none"
                >
                  Terminar
                </button>
              ) : (
                <button
                  disabled={!canAdvanceTutorial}
                  onClick={() => setTutorialStep((current) => Math.min(current + 1, TUTORIAL_STEPS.length - 1))}
                  className={`font-bold text-xs px-4 py-2 rounded-xl transition-all border-none ${
                    canAdvanceTutorial
                      ? "bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/30 cursor-pointer"
                      : "bg-slate-900 text-slate-650 cursor-not-allowed"
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

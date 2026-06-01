import type { ReactNode } from "react";
import {
  ArrowClockwise,
  ArrowCounterClockwise,
  ArrowDown,
  ArrowUp,
  Code,
  Flag,
  StopCircle,
  Timer,
} from "@phosphor-icons/react";

export type LevelKey = "1" | "2";
export type Dir = 0 | 1 | 2 | 3;
export type BlockType =
  | "INIT"
  | "FORWARD"
  | "BACKWARD"
  | "TURN_RIGHT"
  | "TURN_LEFT"
  | "WAIT"
  | "STOP"
  | "IF_OBS"
  | "IF_OBS_ELSE"
  | "WHILE_GOAL";

export interface PaletteBlock {
  type: BlockType;
  label: string;
  colorClass: string;
  icon: ReactNode;
}

export interface MissionContent {
  level: string;
  levelSlug: string;
  title: string;
  badge: string;
  icon: ReactNode;
  accent: "cyan" | "violet";
  objective: string;
  instructions: string[];
  victory: string;
  learningOutcomes: string[];
  blocks: string[];
  tips: string[];
}

export interface EditorLevelContent {
  title: string;
  level: string;
  levelSlug: string;
  accent: "cyan" | "violet";
  grid: number[][];
  start: [number, number];
  startDir: Dir;
  palette: PaletteBlock[];
  helperText: string;
}

export interface MissionStage {
  id: number;
  title: string;
  difficulty: "Facil" | "Basica" | "Media" | "Alta" | "Final";
  objective: string;
  summary: string;
  scenarioLabel: string;
  grid: number[][];
  requiredSequence: BlockType[];
  learningOutcomes: string[];
  instructions: string[];
  victory: string;
  tips: string[];
}

export const BASIC_PALETTE: PaletteBlock[] = [
  {
    type: "INIT",
    label: "Iniciar mision",
    colorClass: "border-emerald-300 bg-emerald-50 text-emerald-700",
    icon: <Flag size={14} weight="fill" />,
  },
  {
    type: "FORWARD",
    label: "Avanzar",
    colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
    icon: <ArrowUp size={14} weight="bold" />,
  },
  {
    type: "BACKWARD",
    label: "Retroceder",
    colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
    icon: <ArrowDown size={14} weight="bold" />,
  },
  {
    type: "TURN_RIGHT",
    label: "Girar derecha",
    colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
    icon: <ArrowClockwise size={14} weight="bold" />,
  },
  {
    type: "TURN_LEFT",
    label: "Girar izquierda",
    colorClass: "border-cyan-300 bg-cyan-50 text-cyan-700",
    icon: <ArrowCounterClockwise size={14} weight="bold" />,
  },
  {
    type: "WAIT",
    label: "Esperar",
    colorClass: "border-amber-300 bg-amber-50 text-amber-700",
    icon: <Timer size={14} weight="bold" />,
  },
  {
    type: "STOP",
    label: "Detener",
    colorClass: "border-red-300 bg-red-50 text-red-600",
    icon: <StopCircle size={14} weight="fill" />,
  },
];

const GRID_BASIC = [
  [2, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 3],
];

export const LEVEL_MISSIONS: Record<"1", MissionContent> = {
  "1": {
    level: "Nivel 0",
    levelSlug: "Basico",
    title: "Movimiento basico",
    badge: "Secuencial",
    icon: <Code size={24} weight="duotone" />,
    accent: "cyan",
    objective:
      "Lleva el robot desde el punto A hasta el punto B usando bloques de movimiento y orientacion.",
    learningOutcomes: [
      "Reconocer los bloques básicos de movimiento.",
      "Ordenar una secuencia simple desde Iniciar misión hasta la meta.",
      "Probar antes de enviar el programa al robot.",
    ],
    instructions: [
      "Selecciona los bloques del panel izquierdo.",
      "Armalos en orden en el area central de programacion.",
      "Presiona Probar simulacion para verificar tu logica.",
      "Si la simulacion es exitosa, envia el programa al robot fisico.",
    ],
    victory:
      "El robot debe llegar a la meta sin salir del tablero ni chocar con ningun obstaculo.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Esperar",
      "Detener",
    ],
    tips: [
      "El robot empieza mirando hacia la derecha.",
      "Cada Avanzar mueve el robot una celda.",
      "Girar no desplaza al robot, solo cambia su direccion.",
    ],
  },
};

export const LEVEL_EDITORS: Record<"1", EditorLevelContent> = {
  "1": {
    title: "Basico",
    level: "Nivel 0",
    levelSlug: "Basico",
    accent: "cyan",
    grid: GRID_BASIC,
    start: [0, 0],
    startDir: 0,
    palette: BASIC_PALETTE,
    helperText:
      "Ruta secuencial: usa los bloques de movimiento para llevar al robot hasta la meta.",
  },
};

export const LEVEL_ORDER: LevelKey[] = ["1", "2"];

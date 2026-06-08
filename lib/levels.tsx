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

export type LevelKey = "1" | "2" | "3";
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
  | "WHILE_GOAL"
  | "REPEAT";

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
  levelKey?: string;
  progressKey?: string;
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

export const LEVEL_ORDER: LevelKey[] = ["1", "2", "3"];

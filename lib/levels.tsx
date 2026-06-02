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

export const LEVEL_0_STAGES: MissionStage[] = [
  {
    id: 1,
    title: "Primer recorrido",
    difficulty: "Facil",
    objective: "Aprende a mover el robot en linea recta usando el bloque Avanzar.",
    summary: "Guia al robot desde el punto A hasta el punto B usando solo movimiento recto.",
    scenarioLabel: "Mision 1 / 5x5",
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [2, 0, 0, 3, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "FORWARD", "FORWARD", "STOP"],
    learningOutcomes: [
      "Entender que el robot ejecuta bloques en orden de arriba hacia abajo.",
      "Usar el bloque Avanzar para mover el robot una celda.",
      "Iniciar y detener correctamente el programa.",
    ],
    instructions: [
      "El robot empieza mirando hacia la derecha.",
      "Cada bloque Avanzar mueve el robot una celda en su direccion actual.",
      "Necesitas llegar a la celda META (B) usando la cantidad correcta de avances.",
      "No olvides iniciar el programa con Iniciar mision y cerrarlo con Detener.",
    ],
    victory: "El robot debe llegar a la meta en linea recta sin salir del tablero.",
    tips: [
      "Cuenta cuantas celdas hay entre A y B.",
      "El robot no se mueve al girar, solo cambia de direccion.",
    ],
  },
  {
    id: 2,
    title: "Primer giro",
    difficulty: "Facil",
    objective: "Aprende que girar cambia la direccion del robot pero no lo mueve.",
    summary: "El robot debe avanzar y luego girar para alcanzar la meta.",
    scenarioLabel: "Mision 2 / 5x5",
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [2, 0, 0, 0, 0],
      [0, 0, 3, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "FORWARD", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Entender que Girar cambia la orientacion pero no desplaza al robot.",
      "Combinar avances y giros para llegar a una meta en L.",
      "Planificar la secuencia antes de programar.",
    ],
    instructions: [
      "El robot comienza mirando hacia la derecha.",
      "Avanza hasta alinearte con la columna de la meta.",
      "Gira a la derecha para apuntar hacia abajo.",
      "Avanza una celda mas para llegar a la meta.",
    ],
    victory: "El robot debe trazar una ruta en L hasta la meta.",
    tips: [
      "Girar derecha desde la derecha apunta el robot hacia abajo.",
      "Despues de girar, el proximo Avanzar va en la nueva direccion.",
    ],
  },
  {
    id: 3,
    title: "Ruta con obstaculo",
    difficulty: "Basica",
    objective: "Evita un obstaculo planificando la ruta manualmente antes de programar.",
    summary: "Hay una X en el camino directo. Debes rodearla con giros y avances.",
    scenarioLabel: "Mision 3 / 5x5",
    grid: [
      [2, 0, 1, 0, 0],
      [0, 0, 0, 3, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "FORWARD", "FORWARD", "STOP"],
    learningOutcomes: [
      "Planificar una ruta evitando obstaculos.",
      "Combinar giros opuestos para retomar la direccion original.",
      "Entender que el robot no detecta obstaculos automaticamente en este nivel.",
    ],
    instructions: [
      "Hay un obstaculo (X) bloqueando el camino directo.",
      "Avanza hasta la celda justo antes del obstaculo.",
      "Gira para rodearlo y luego vuelve a la ruta hacia la meta.",
      "En el Nivel 0 el robot no tiene sensores: debes planificar todo manualmente.",
    ],
    victory: "El robot debe llegar a la meta sin chocar con el obstaculo.",
    tips: [
      "Un giro a la derecha seguido de un avance y un giro a la izquierda te devuelve a la misma direccion.",
      "Visualiza la ruta en el simulador antes de probarla.",
    ],
  },
  {
    id: 4,
    title: "Ruta en L",
    difficulty: "Media",
    objective: "Resuelve una ruta mas larga que combina varios avances y un giro.",
    summary: "El robot debe recorrer una L mas larga hasta la meta.",
    scenarioLabel: "Mision 4 / 5x5",
    grid: [
      [2, 0, 0, 0, 0],
      [0, 0, 0, 3, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "FORWARD", "FORWARD", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Construir secuencias mas largas con precision.",
      "Mantener el orden correcto de los bloques.",
      "Probar y corregir la ruta en el simulador antes de enviar al robot.",
    ],
    instructions: [
      "La meta esta en una esquina alejada del inicio.",
      "Avanza tres celdas hacia la derecha.",
      "Gira y avanza una celda hacia abajo para llegar a la meta.",
      "Usa el simulador para verificar tu ruta.",
    ],
    victory: "El robot debe completar la ruta en L sin errores.",
    tips: [
      "Cuenta bien los pasos: 3 hacia la derecha y 1 hacia abajo.",
      "Si la simulacion falla, revisa el orden de tus bloques.",
    ],
  },
  {
    id: 5,
    title: "Desafio secuencial",
    difficulty: "Final",
    objective: "Demuestra que dominas la programacion secuencial resolviendo una ruta compleja.",
    summary: "Ruta con giros multiples y un obstaculo. Planifica bien antes de programar.",
    scenarioLabel: "Mision 5 / 5x5",
    grid: [
      [2, 0, 1, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 3, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "FORWARD", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Resolver rutas complejas con multiples giros.",
      "Aplicar todos los bloques del Nivel 0 en una sola secuencia.",
      "Prepararse para el Nivel 1 con sensores y condicionales.",
    ],
    instructions: [
      "La ruta tiene un obstaculo y requiere varios cambios de direccion.",
      "Planifica el camino completo antes de empezar a programar.",
      "Usa el simulador para validar cada paso de tu secuencia.",
      "Si llegas a la meta, podras enviar el programa al robot fisico.",
    ],
    victory: "El robot debe llegar a la meta usando la secuencia correcta de movimientos y giros.",
    tips: [
      "Dibuja la ruta en papel antes de programar.",
      "Un giro derecha-avance-giro izquierda te permite esquivar un obstaculo y seguir recto.",
      "Felicitaciones: al completar esta mision, habras dominado el Nivel 0.",
    ],
  },
];

export const LEVEL_ORDER: LevelKey[] = ["1", "2"];

import { Code, Flag, ArrowUp, ArrowDown, ArrowClockwise, ArrowCounterClockwise, Timer, StopCircle } from "@phosphor-icons/react";
import { type EditorLevelContent, type MissionContent, type MissionStage, BASIC_PALETTE } from "@/lib/levels";

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
    ],    instructions: [
      "Selecciona los bloques del panel izquierdo.",
      "Armalos en orden en el area central de programacion.",
      "Presiona Probar simulacion para verificar tu logica.",
      "Completa las misiones en el simulador para prepararte para el robot fisico.",
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
    summary: "Tutorial interactivo: aprende a usar el simulador y a mover al robot en linea recta.",
    scenarioLabel: "Mision 1 / Tutorial",
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
      "Sigue los pasos del asistente del tutorial para armar el programa y probarlo.",
    ],
    victory: "El robot debe llegar a la meta en linea recta sin salir del tablero.",
    tips: [
      "Cuenta bien los pasos: son 3 avances desde A hasta B.",
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
];

"use client";

import {
  CheckCircle,
  Cpu,
  Repeat,
  Warning,
} from "@phosphor-icons/react";
import {
  BASIC_PALETTE,
  type EditorLevelContent,
  type MissionContent,
  type MissionStage,
} from "@/lib/levels";
export type { MissionStage };

// ── Paleta del Nivel 2 (sin WHILE) ───────────────────────────────────────────
export const ADVANCED_PALETTE = [
  {
    type: "IF_OBS_ELSE" as const,
    label: "Si hay obstaculo / Si no hay obstaculo",
    colorClass: "border-amber-300 bg-amber-50 text-amber-700",
    icon: (
      <span className="flex items-center gap-0.5">
        <Warning size={14} weight="fill" />
        <CheckCircle size={14} weight="fill" />
      </span>
    ),
  },
  {
    type: "FOR_REPEAT" as const,
    label: "Repetir N veces",
    colorClass: "border-indigo-300 bg-indigo-50 text-indigo-700",
    icon: <Repeat size={14} weight="bold" />,
  },
];

// ── 5 misiones: For + If/Else, grillas 5x5 ───────────────────────────────────
export const LEVEL_3_STAGES: MissionStage[] = [
  // ── Mision 1: Tutorial For ────────────────────────────────────────────────
  {
    id: 1,
    title: "Intro al bucle For",
    difficulty: "Facil",
    objective:
      "Aprende a usar Repetir N veces para avanzar varias celdas sin escribir el mismo bloque varias veces.",
    summary:
      "Tutorial guiado: en lugar de poner cuatro Avanzar seguidos, usas un For con N=4 que los reemplaza automaticamente.",
    scenarioLabel: "Escenario 1 / Tutorial",
    // Robot en (0,0) mirando derecha → meta en (0,4)
    grid: [
      [2, 0, 0, 0, 3],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FOR_REPEAT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Entender que For N veces repite el bloque siguiente N veces.",
      "Reemplazar bloques repetidos por un solo For.",
      "Cerrar siempre con Detener.",
    ],
    instructions: [
      "Coloca Repetir N veces y configura N=4.",
      "Agrega Avanzar dentro del For.",
      "Cierra con Detener.",
      "Pulsa Probar para verificar que el robot llega a la meta.",
    ],
    victory: "El robot avanza 4 celdas con For N=4 + Avanzar, terminando con Detener.",
    tips: [
      "El robot empieza en la columna 0, la meta esta en la columna 4.",
      "For N veces ejecuta su contenido exactamente N veces.",
    ],
  },

  // ── Mision 2: Ruta en L con dos For ──────────────────────────────────────
  {
    id: 2,
    title: "Esquina con For",
    difficulty: "Basica",
    objective:
      "Usa dos bloques Repetir N veces consecutivos para trazar una ruta en L hasta la meta.",
    summary:
      "La ruta baja y luego gira a la derecha. Cada tramo recto se cubre con un For distinto.",
    scenarioLabel: "Escenario 2 / 5x5",
    // Robot en (0,0) mirando abajo → baja 3 → gira derecha → avanza 4 → meta (3,4)
    grid: [
      [2, 1, 0, 0, 0],
      [0, 0, 1, 0, 0],
      [0, 0, 1, 0, 0],
      [1, 0, 0, 0, 3],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: [
      "INIT", "FOR_REPEAT", "FORWARD", "TURN_RIGHT", "FOR_REPEAT", "FORWARD", "STOP",
    ],
    learningOutcomes: [
      "Encadenar dos For para cubrir dos tramos distintos.",
      "Combinar giros con bloques For.",
      "Planificar distancias antes de configurar N.",
    ],
    instructions: [
      "El primer For baja el robot 3 filas (N=3) con Avanzar.",
      "Agrega Girar derecha entre los dos For.",
      "El segundo For mueve 4 columnas (N=4) con Avanzar.",
      "Cierra con Detener.",
    ],
    victory: "Dos For (N=3 y N=4) con un giro intermedio para alcanzar la meta.",
    tips: [
      "Cuenta las casillas de cada tramo antes de asignar N.",
      "El giro va entre los dos For, no dentro de ninguno.",
      "El robot empieza mirando hacia abajo.",
    ],
  },

  // ── Mision 3: Primera If/Else ─────────────────────────────────────────────
  {
    id: 3,
    title: "Decision en el camino",
    difficulty: "Media",
    objective:
      "Usa Si hay obstaculo / Si no hay obstaculo para que el robot elija entre dos acciones segun lo que detecte el sensor frontal.",
    summary:
      "El robot arranca con un obstaculo al frente. La rama 'Si hay obstaculo' debe girar para esquivarlo; la rama libre avanza directo.",
    scenarioLabel: "Escenario 3 / 5x5",
    // Robot en (2,0) mirando derecha; obstaculo en (2,1); meta en (4,4)
    // Ruta correcta: If→ hay obstaculo → Girar derecha; else → Avanzar
    // Luego For N=3 + Avanzar + For N=4 + Avanzar + Detener (rama if ejecuta giro)
    grid: [
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 3],
    ],
    requiredSequence: [
      "INIT", "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD", "FOR_REPEAT", "FORWARD", "FOR_REPEAT", "FORWARD", "STOP",
    ],
    learningOutcomes: [
      "Usar la condicion If/Else para tomar decisiones automaticas.",
      "Distinguir la rama de obstaculo de la rama libre.",
      "Combinar If/Else con For en una misma secuencia.",
    ],
    instructions: [
      "Agrega Si hay obstaculo / Si no hay obstaculo.",
      "Rama obstaculo: Girar derecha (para bajar).",
      "Rama libre: Avanzar (si no hubiera bloqueo).",
      "Despues del If/Else agrega For N=3 + Avanzar para bajar hasta la fila 4.",
      "Agrega For N=4 + Avanzar para llegar a la columna 4.",
      "Cierra con Detener.",
    ],
    victory: "El If detecta el obstaculo, gira, luego dos For llevan al robot a la meta.",
    tips: [
      "El sensor frontal detecta el obstaculo en (2,1) cuando el robot esta en (2,0).",
      "Despues del giro el robot mira hacia abajo.",
      "Planifica cuantas celdas recorre cada For.",
    ],
  },

  // ── Mision 4: For dentro de rama If/Else ─────────────────────────────────
  {
    id: 4,
    title: "For dentro de condicion",
    difficulty: "Alta",
    objective:
      "Combina If/Else con un bloque de movimiento en cada rama para recorrer caminos distintos segun si hay obstaculo o no.",
    summary:
      "La bifurcacion inicial separa dos rutas. Despues del If/Else, un For cubre el tramo final comun.",
    scenarioLabel: "Escenario 4 / 5x5",
    // Robot en (0,0) mirando derecha; obstaculo en (0,1); meta en (4,4)
    // Rama obstaculo: Girar derecha (baja) → For N=4 → Avanzar → Girar derecha → For N=4 → Avanzar
    // Rama libre: Avanzar (pero hay obstaculo así que se ejecuta la de arriba)
    grid: [
      [2, 1, 0, 0, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 0, 0, 0],
      [0, 0, 0, 0, 3],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD",
      "FOR_REPEAT", "FORWARD",
      "TURN_RIGHT",
      "FOR_REPEAT", "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Anidar movimiento dentro de una rama if/else.",
      "Seguir la ruta correcta segun la deteccion del sensor.",
      "Combinar condicion y repeticion fija en una sola secuencia.",
    ],
    instructions: [
      "Agrega If/Else.",
      "Rama obstaculo: Girar derecha.",
      "Rama libre: Avanzar (no se ejecutara porque hay obstaculo).",
      "Agrega For N=4 + Avanzar para bajar 4 filas.",
      "Agrega Girar derecha para orientarte hacia la meta.",
      "Agrega For N=4 + Avanzar para avanzar 4 columnas hasta la meta.",
      "Cierra con Detener.",
    ],
    victory: "If detecta obstaculo, gira; dos For con giro intermedio llevan al robot a la meta.",
    tips: [
      "El robot empieza mirando a la derecha con un muro al frente.",
      "Despues del primer giro el robot mira hacia abajo.",
      "Cuenta las casillas de cada tramo antes de configurar N.",
    ],
  },

  // ── Mision 5: Desafio maestro — If/Else + dos For ────────────────────────
  {
    id: 5,
    title: "Desafio maestro",
    difficulty: "Final",
    objective:
      "Resuelve el laberinto final combinando If/Else y dos bloques Repetir N veces en una sola secuencia coherente.",
    summary:
      "El laberinto mas complejo del nivel exige una decision inicial y dos tramos de repeticion fija para alcanzar la meta.",
    scenarioLabel: "Escenario 5 / 5x5",
    // Robot en (0,0) mirando derecha; obstaculo en (0,1) y (0,2); meta en (4,4)
    grid: [
      [2, 1, 1, 0, 0],
      [0, 0, 0, 1, 0],
      [1, 0, 0, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 3],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD",
      "FOR_REPEAT", "FORWARD",
      "TURN_RIGHT",
      "FOR_REPEAT", "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Integrar If/Else y dos For en una sola secuencia.",
      "Resolver un laberinto complejo con decisiones y repeticiones.",
      "Planificar el orden de las estructuras antes de programar.",
    ],
    instructions: [
      "Empieza con If/Else: rama obstaculo → Girar derecha; rama libre → Avanzar.",
      "Agrega For N=4 + Avanzar para bajar hasta la fila 4.",
      "Agrega Girar derecha para orientarte hacia la columna 4.",
      "Agrega For N=4 + Avanzar para llegar a la meta.",
      "Cierra con Detener.",
    ],
    victory: "If + dos For con giro intermedio llevan al robot a la meta sin colisiones.",
    tips: [
      "Planifica la ruta en papel antes de programar.",
      "El orden de las estructuras es tan importante como su contenido.",
      "El primer For baja; el segundo avanza hacia la meta.",
      "Usa el simulador para validar cada estructura por separado.",
    ],
  },
];

// ── Contenido de mision del Nivel 2 ──────────────────────────────────────────
export const LEVEL_MISSIONS: Record<"3", MissionContent> = {
  "3": {
    level: "Nivel 2",
    levelSlug: "Avanzado",
    title: "Bucles y decisiones",
    badge: "For + If/Else",
    icon: <Cpu size={24} weight="duotone" />,
    accent: "indigo",
    objective:
      "Domina las estructuras de control: usa Repetir N veces para recorrer tramos fijos sin repetir bloques, y Si hay obstaculo / Si no hay obstaculo para que el robot tome decisiones automaticas.",
    learningOutcomes: [
      "Usar Repetir N veces para recorrer tramos fijos sin repetir bloques manualmente.",
      "Usar Si hay obstaculo / Si no para elegir entre dos acciones automaticamente.",
      "Combinar If/Else y For en una secuencia compleja.",
    ],
    instructions: [
      "La primera mision es un tutorial guiado sobre el bloque For.",
      "A partir de la mision 3 se introduce el bloque Si hay obstaculo / Si no hay obstaculo.",
      "En las ultimas misiones debes combinar ambas estructuras.",
      "Configura N en el bloque For segun la distancia real del tramo.",
      "Presiona Probar para simular antes de enviar al robot fisico.",
    ],
    victory:
      "Cada mision tiene su condicion especifica. Lee el objetivo y las instrucciones antes de programar.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Esperar",
      "Detener",
      "Si hay obstaculo / Si no hay obstaculo",
      "Repetir N veces",
    ],
    tips: [
      "For repite exactamente N veces, sin importar los sensores.",
      "If/Else toma una decision segun el sensor frontal en ese instante.",
      "Puedes encadenar varios For para cubrir tramos distintos.",
      "El robot mira en la direccion de la flecha al inicio de cada mision.",
      "Planifica la ruta en papel antes de programar las misiones finales.",
    ],
  },
};

// ── Configuracion del editor del Nivel 2 ─────────────────────────────────────
export const LEVEL_EDITORS: Record<"3", EditorLevelContent> = {
  "3": {
    title: "Avanzado",
    level: "Nivel 2",
    levelSlug: "Avanzado",
    accent: "indigo",
    grid: LEVEL_3_STAGES[0].grid,
    start: [0, 0],
    startDir: 0,
    palette: [...BASIC_PALETTE, ...ADVANCED_PALETTE],
    helperText:
      "Usa Repetir N veces para tramos fijos y Si hay obstaculo para tomar decisiones automaticas.",
  },
};
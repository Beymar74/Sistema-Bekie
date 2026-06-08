import {
  Code,
} from "@phosphor-icons/react";
import { BASIC_PALETTE, type EditorLevelContent, type MissionContent, type MissionStage, type PaletteBlock } from "@/lib/levels";

const ADVANCED_PALETTE: PaletteBlock[] = [
  // En este nivel el alumno crea sus propios bloques. Damos el bloque de inicio básico.
];

export const LEVEL_3_STAGES: MissionStage[] = [
  {
    id: 1,
    title: "Escalera de funciones en C",
    difficulty: "Facil",
    objective: "Crea tu primer bloque personalizado en C para subir una escalera repetitiva con Arduino.",
    summary: "Aprende la estructura de una función básica en C para subir una escalera. Define un bloque personalizado llamado 'Escalón' para controlar el movimiento del Arduino sin exceder el límite de instrucciones.",
    scenarioLabel: "ESCENARIO 1 / TUTORIAL",
    grid: [
      [2, 0, 1, 1, 1],
      [1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1],
      [1, 1, 1, 0, 0],
      [1, 1, 1, 1, 3],
    ],
    requiredSequence: ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "STOP"],
    learningOutcomes: [
      "Crear y nombrar una función o bloque personalizado.",
      "Identificar patrones repetitivos en C para encapsular en funciones.",
      "Estructurar lógica de Arduino de manera modular.",
    ],
    instructions: [
      "Abre el panel de 'Crear Bloque' e ingresa un nombre (ej. 'Escalon').",
      "Arrastra dentro del bloque personalizado la secuencia de C: Avanzar, Girar derecha, Avanzar, Girar izquierda.",
      "Pulsa 'Crear' para añadirlo a tu paleta.",
      "Usa tu nuevo bloque en el programa principal junto con Iniciar y Detener para controlar el Arduino.",
    ],
    victory: "El robot alcanza la meta subiendo la escalera mediante el uso del bloque personalizado en C.",
    tips: [
      "Crear un bloque 'Escalon' te permite agrupar 4 comandos en una sola función de C.",
      "Usa el bucle 'Repetir N veces' con tu bloque adentro para subir las 4 escaleras.",
    ],
  },
  {
    id: 2,
    title: "Pasillo en zigzag con Arduino",
    difficulty: "Basica",
    objective: "Usa funciones personalizadas en C para sortear pasillos en zigzag.",
    summary: "El camino tiene un patrón constante de giros y avances. Define una función 'Avance en L' que traduzca movimientos secuenciales para reducir los bloques en el editor principal.",
    scenarioLabel: "ESCENARIO 2 / 5x5",
    grid: [
      [2, 0, 1, 1, 1],
      [1, 0, 1, 1, 1],
      [1, 0, 0, 1, 1],
      [1, 1, 0, 1, 1],
      [1, 1, 0, 0, 3],
    ],
    requiredSequence: ["INIT", "FORWARD", "TURN_RIGHT", "FORWARD", "FORWARD", "TURN_LEFT", "STOP"],
    learningOutcomes: [
      "Estructurar un bloque de avance y giro alterno en C.",
      "Reutilizar el mismo bloque personalizado de Arduino múltiples veces.",
    ],
    instructions: [
      "El robot inicia mirando hacia el Este.",
      "Crea un bloque en C llamado 'Avance en L' que haga avanzar al robot, girar a la derecha, avanzar 2 celdas y girar a la izquierda.",
      "Utiliza ese bloque personalizado en tu programa principal para resolver el trayecto.",
    ],
    victory: "El robot navega el zigzag usando el bloque 'Avance en L' en C hasta llegar a la meta.",
    tips: [
      "Al final del bloque 'Avance en L' el robot debe quedar orientado de nuevo hacia el Este para la siguiente iteración.",
    ],
  },
  {
    id: 3,
    title: "El laberinto en espiral",
    difficulty: "Media",
    objective: "Controla los motores de tu Arduino para girar continuamente hacia el interior de una espiral usando un bloque personalizado eficiente.",
    summary: "El robot debe doblar continuamente hacia adentro. Define un bloque en C para avanzar tramos rectos y girar, logrando entrar a la espiral.",
    scenarioLabel: "ESCENARIO 3 / ESPIRAL 5x5",
    grid: [
      [2, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 0, 3, 1, 0],
      [1, 0, 1, 1, 0],
      [1, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "FORWARD", "TURN_RIGHT", "STOP"],
    learningOutcomes: [
      "Diseñar bloques reutilizables en C aplicados a distancias variables.",
      "Optimizar el código de Arduino en escenarios de giros repetitivos.",
    ],
    instructions: [
      "Define una función en C que te ayude a recorrer las rectas de Arduino y girar a la derecha al final.",
      "Navega las esquinas del espiral y ubica la meta en el centro.",
    ],
    victory: "El robot llega al centro de la espiral cuadrada usando tus bloques de C.",
    tips: [
      "Puedes crear más de un bloque personalizado en C si lo requieres.",
    ],
  },
  {
    id: 4,
    title: "Desafío de zigzag doble",
    difficulty: "Final",
    objective: "Resuelve una pista de zigzag doble combinando múltiples bloques personalizados en C.",
    summary: "Domina la programación modular en C para Arduino combinando múltiples bloques personalizados. Consigue resolver una pista compleja con lógica compacta y estructurada.",
    scenarioLabel: "ESCENARIO 4 / DESAFÍO 5x5",
    grid: [
      [2, 0, 1, 0, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 3],
    ],
    requiredSequence: ["INIT", "FORWARD", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Dominar la descomposición de problemas complejos usando funciones en C.",
      "Planificar y organizar la paleta de código de Arduino del alumno.",
    ],
    instructions: [
      "Diseña bloques en C para resolver los tramos de ida y vuelta del zigzag.",
      "Combina las funciones en C y lleva al robot a la meta física final.",
    ],
    victory: "El robot completa el laberinto de doble zigzag con un programa principal optimizado en C.",
    tips: [
      "Escribe funciones de C pequeñas y modulares, son más fáciles de depurar y combinar.",
    ],
  },
];

export const LEVEL_MISSIONS: Record<"3", MissionContent> = {
  "3": {
    level: "Nivel 2",
    levelSlug: "Avanzado",
    title: "Programación en C y Bloques",
    badge: "C / Arduino",
    icon: <Code size={24} weight="duotone" />,
    accent: "violet",
    objective:
      "Aprende a programar en C para controlar Arduino y a construir tus propios bloques personalizados de código para dominar la automatización y la robótica.",
    learningOutcomes: [
      "Programar en lenguaje C para el control de microcontroladores Arduino.",
      "Construir bloques de código personalizados (funciones) para modularizar programas.",
      "Entender la relación entre la programación visual por bloques y el código C real.",
    ],
    instructions: [
      "Usa la pestaña 'Crear Bloque' para definir un nuevo bloque de código con un nombre personalizado.",
      "Arrastra las instrucciones necesarias para definir el comportamiento de tu bloque, emulando funciones en C.",
      "Una vez guardado, el bloque aparecerá en tu paleta lateral para arrastrarlo al programa principal.",
      "El programa principal tiene un límite estricto de bloques, obligándote a modularizar la lógica en C.",
    ],
    victory:
      "Resuelve los retos controlando el robot Arduino mediante tus propios bloques personalizados y lógica en C.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Detener",
      "Bloque Personalizado (C)",
    ],
    tips: [
      "El lenguaje C te da control total sobre el hardware de Arduino.",
      "Modularizar tu código agrupando instrucciones en bloques personalizados simula funciones en C.",
    ],
  },
};

export const LEVEL_EDITORS: Record<"3", EditorLevelContent> = {
  "3": {
    title: "Avanzado",
    level: "Nivel 2",
    levelSlug: "Avanzado",
    accent: "violet",
    grid: LEVEL_3_STAGES[0].grid,
    start: [0, 0],
    startDir: 0,
    palette: BASIC_PALETTE,
    helperText:
      "Crea tus propios bloques personalizados (funciones) para encapsular instrucciones y solucionar los retos sin exceder el límite de bloques principales.",
  },
};

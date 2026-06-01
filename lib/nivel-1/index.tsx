import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Warning,
} from "@phosphor-icons/react";
import { BASIC_PALETTE, type EditorLevelContent, type MissionContent, type MissionStage } from "@/lib/levels";

const INTERMEDIATE_PALETTE = [
  {
    type: "IF_OBS_ELSE",
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
    type: "WHILE_GOAL",
    label: "Mientras no llegue",
    colorClass: "border-amber-300 bg-amber-50 text-amber-700",
    icon: <ArrowRight size={14} weight="bold" />,
  },
] satisfies EditorLevelContent["palette"];

export const LEVEL_2_STAGES: MissionStage[] = [
  {
    id: 1,
    title: "Cruce inicial",
    difficulty: "Facil",
    objective:
      "Aprende a reaccionar a un obstaculo sin llenar el programa de numeros innecesarios.",
    summary:
      "El tutorial te guia paso a paso: completas la estructura y el siguiente paso aparece automaticamente.",
    scenarioLabel: "Escenario 1 / Tutorial",
    grid: [
      [2, 1, 0, 0, 0, 0],
      [3, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "TURN_RIGHT", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Usar una sola estructura if/else para dos respuestas distintas.",
      "Responder con un giro si hay obstaculo y avanzar de forma directa para completar la ruta.",
    ],
    instructions: [
      "Completa la reaccion del robot ante el obstaculo para que sepa que hacer cuando el camino este bloqueado.",
      "Haz que la ruta libre permita seguir avanzando hasta llegar a la meta.",
      "Asegura que el recorrido termine correctamente y que el programa pueda cerrarse sin errores.",
      "Compila cuando la secuencia ya describa el comportamiento completo del tutorial.",
    ],
    victory:
      "La secuencia debe usar una sola estructura if/else y luego un avance directo para alcanzar la meta.",
    tips: [
      "Piensa en un solo bloque con dos ramas: una para obstaculo y otra para camino libre.",
      "Avanzar queda simple por defecto; el numero solo aparece cuando la mision lo necesita.",
    ],
  },
  {
    id: 2,
    title: "Desvio corto",
    difficulty: "Basica",
    objective:
      "Lleva el robot por un corredor unico y cerrado hasta la meta inferior usando una sola decision inicial.",
    summary:
      "La ruta queda encerrada en un solo pasillo vertical para que no existan caminos alternos.",
    scenarioLabel: "Escenario 2 / 6x6",
    grid: [
      [2, 1, 0, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [0, 1, 0, 0, 0, 0],
      [3, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "TURN_RIGHT", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Usar una sola estructura if/else para desbloquear una ruta mas larga.",
      "Usar la rama correcta para iniciar un corredor sin caminos alternos.",
      "Leer la meta lejos del inicio y resolver la mision con orden.",
    ],
    instructions: [
      "Construye una solucion que saque al robot del inicio y lo lleve por el unico pasillo disponible.",
      "La decision inicial debe abrir el corredor vertical correcto.",
      "Despues del giro, avanza en linea recta hasta la meta.",
      "Cierra el programa al final para que la compilacion pueda validarlo correctamente.",
    ],
    victory:
      "La secuencia debe abrir el corredor unico y recorrerlo hasta la esquina inferior izquierda.",
    tips: [
      "La primera decision abre el corredor vertical.",
      "El resto del recorrido es un avance recto sin desvíos.",
    ],
  },
  {
    id: 3,
    title: "Lectura doble",
    difficulty: "Media",
    objective:
      "Resuelve un desvio corto con una sola decision antes de entrar al pasillo final.",
    summary:
      "La ruta obliga a decidir al inicio y luego avanzar por un corredor en L hasta la meta.",
    scenarioLabel: "Escenario 3 / 6x6",
    grid: [
      [0, 0, 2, 1, 0, 1],
      [0, 1, 0, 0, 0, 3],
      [0, 0, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE",
      "TURN_RIGHT",
      "TURN_LEFT",
      "FORWARD",
      "TURN_LEFT",
      "FORWARD",
      "FORWARD",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Usar una condicion para elegir la salida correcta antes del tramo final.",
      "Mantener la secuencia corta y precisa.",
      "Resolver la meta sin depender de Esperar.",
    ],
    instructions: [
      "Usa Si hay obstaculo / Si no hay obstaculo para decidir la salida desde el inicio.",
      "La rama libre puede usar otro giro util; no hace falta Esperar.",
      "Lleva al robot por el corredor en L hasta la meta y cierra con Detener.",
      "Cierra el programa cuando el robot ya este sobre la meta.",
    ],
    victory:
      "La secuencia debe usar una sola condicion antes del tramo en L que lleva a la meta.",
    tips: [
      "La rama libre no necesita Esperar; puede ser otro giro que no rompa la ruta.",
      "La meta queda al final del pasillo recto después de la condicion.",
    ],
  },
  {
    id: 4,
    title: "Ruta repetible",
    difficulty: "Alta",
    objective:
      "Combina una condicion inicial con un while para bajar por un pasillo vertical cerrado.",
    summary:
      "El robot corrige el desvio con una decision y luego repite un avance numerado hasta la meta inferior.",
    scenarioLabel: "Escenario 4 / 6x6",
    grid: [
      [0, 1, 2, 0, 1, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 1, 0, 1, 0, 0],
      [0, 1, 3, 1, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE",
      "TURN_LEFT",
      "TURN_RIGHT",
      "FORWARD",
      "WHILE_GOAL",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Usar una condicion para corregir la salida inicial.",
      "Repetir una ruta vertical con un bucle.",
      "Usar un avance numerado dentro del while para recorrer el tramo final.",
    ],
    instructions: [
      "Usa Si hay obstaculo / Si no hay obstaculo para corregir la salida inicial.",
      "Despues coloca Mientras no llegue y repite el avance numerado hasta la meta de abajo.",
      "No hace falta Esperar; la secuencia debe terminar con Detener.",
    ],
    victory:
      "La secuencia debe abrirse con una decision y cerrar con un while que repite un avance numerado hasta la meta inferior.",
    tips: [
      "La rama correcta de la condicion te deja alineado con el corredor vertical.",
      "El while cierra el tramo final bajando por la misma columna.",
      "Detener debe quedar al final como salida segura del programa.",
    ],
  },
  {
    id: 5,
    title: "Desafio final",
    difficulty: "Final",
    objective:
      "Cierra el nivel con una condicion inicial y un while que repite una ruta escalonada.",
    summary:
      "La ruta final obliga a decidir la salida y despues seguir un zigzag corto hasta la meta.",
    scenarioLabel: "Escenario 5 / 6x6",
    grid: [
      [0, 1, 2, 1, 0, 0],
      [0, 1, 0, 0, 1, 0],
      [0, 0, 1, 0, 0, 1],
      [0, 0, 0, 1, 0, 3],
      [0, 0, 0, 0, 1, 1],
      [0, 0, 0, 0, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE",
      "TURN_RIGHT",
      "TURN_LEFT",
      "FORWARD",
      "TURN_LEFT",
      "FORWARD",
      "TURN_RIGHT",
      "FORWARD",
      "TURN_LEFT",
      "FORWARD",
      "TURN_RIGHT",
      "FORWARD",
      "TURN_LEFT",
      "WHILE_GOAL",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Unir una condicion con un while que repite una distancia fija.",
      "Resolver una ruta mas larga sin perder el orden de las acciones.",
      "Usar el while para seguir un recorrido escalonado hasta la meta.",
    ],
    instructions: [
      "Primero resuelve la salida con Si hay obstaculo / Si no hay obstaculo.",
      "Luego usa Mientras no llegue para repetir el avance numerado hasta la meta en zigzag.",
      "La respuesta libre no necesita Esperar; cierra con Detener.",
    ],
    victory:
      "La secuencia final debe mezclar una decision inicial y un while con un cuerpo repetible que lleve la ruta hasta la meta en escalera.",
    tips: [
      "El orden de los bloques importa mucho mas que en las misiones anteriores.",
      "Busca una ruta base que puedas repetir sin cambiar su sentido.",
      "El while funciona como una apertura: lo que va debajo se repite hasta llegar.",
    ],
  },
];

export const LEVEL_MISSIONS: Record<"2", MissionContent> = {
  "2": {
    level: "Nivel 1",
    levelSlug: "Intermedio",
    title: "Evadir obstaculos",
    badge: "Condicionales",
    icon: <Cpu size={24} weight="duotone" />,
    accent: "violet",
    objective:
      "Aprende a construir secuencias con condicionales y bucles, mientras el robot reacciona a los obstaculos y avanza hacia metas ubicadas en esquinas cada vez mas lejanas.",
    learningOutcomes: [
      "Usar una estructura if/else para responder a obstaculos.",
      "Entender como cambia la ruta cuando el tutorial de la primera mision se completa solo y las siguientes suben la dificultad.",
      "Combinar condicion, correccion y bucles paso a paso.",
    ],
    instructions: [
      "La primera mision funciona como tutorial y avanza sola cuando completas cada paso.",
      "Desde la mision 3, las rutas combinan condicionales y, mas adelante, while.",
      "Usa las decisiones y los bucles para describir el comportamiento correcto del robot.",
      "Cuando aparezca, el numero en Avanzar define la distancia total que debe recorrer el robot.",
      "Compila la secuencia para comprobar que el robot realmente llega a la meta de cada escenario.",
    ],
    victory:
      "La primera mision sirve de introduccion automatica. Despues, cada reto agrega un poco mas de complejidad hasta dominar condicionales, correcciones y bucles.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Esperar",
      "Detener",
      "Si hay obstaculo / Si no hay obstaculo",
      "Mientras no llegue",
    ],
    tips: [
      "La primera mision se abre sola cuando completas el tutorial.",
      "Esperar sigue siendo una pausa opcional, pero no es el centro del nivel.",
      "Cuando aparezca, el numero en Avanzar define cuantas casillas recorrera el robot dentro de una condicion o de un while.",
      "Mientras no llegue abre una seccion de repeticion, no un cierre de programa.",
      "Cada mision agrega un pequeno salto de dificultad para que el aprendizaje sea gradual.",
    ],
  },
};

export const LEVEL_EDITORS: Record<"2", EditorLevelContent> = {
  "2": {
    title: "Intermedio",
    level: "Nivel 1",
    levelSlug: "Intermedio",
    accent: "violet",
    grid: LEVEL_2_STAGES[0].grid,
    start: [0, 0],
    startDir: 0,
    palette: [...BASIC_PALETTE, ...INTERMEDIATE_PALETTE],
    helperText:
      "Compilador de decisiones: arma condicionales con dos respuestas, while con cuerpo repetible y Avanzar numerado solo dentro del while cuando la mision lo pida.",
  },
};

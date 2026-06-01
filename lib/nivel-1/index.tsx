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
      "Aprende a usar una estructura if/else simple y a cerrar la ruta con un avance fuera de la decision.",
    summary:
      "El tutorial te guia paso a paso: completas una decision con dos respuestas y luego usas un avance simple fuera de la condicion para llegar a la meta.",
    scenarioLabel: "Escenario 1 / Tutorial",
    grid: [
      [2, 0, 3, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD", "FORWARD", "STOP"],
    learningOutcomes: [
      "Usar una sola estructura if/else para dos respuestas distintas.",
      "Responder con un giro si hay obstaculo y con un avance si el camino esta libre.",
      "Usar un avance simple fuera de la condicion para alcanzar la meta.",
    ],
    instructions: [
      "Completa la reaccion del robot ante el obstaculo para que sepa que hacer cuando el camino este bloqueado.",
      "La rama de obstaculo gira a la derecha; la rama libre avanza una casilla con N.",
      "Despues de la decision, avanza una sola vez sin numero para llegar a la meta y cierra con Detener.",
      "Compila cuando la secuencia ya describa el comportamiento completo del tutorial.",
    ],
    victory:
      "La secuencia debe usar una sola estructura if/else, girar a la derecha en la rama del obstaculo, avanzar en la rama libre con N y luego avanzar una sola vez fuera de la condicion para alcanzar la meta.",
    tips: [
      "Piensa en un solo bloque con dos ramas: una corrige el desvio y la otra sigue recto con N.",
      "El Avanzar final queda fuera de la decision y no lleva numero.",
    ],
  },
  {
    id: 2,
    title: "Desvio corto",
    difficulty: "Basica",
    objective:
      "Lleva el robot por un desvio corto usando una sola decision inicial y dos avances rectos hasta la meta.",
    summary:
      "La ruta obliga a elegir entre dos giros distintos y despues avanzar dos veces hasta la meta.",
    scenarioLabel: "Escenario 2 / 5x5",
    grid: [
      [2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [3, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "TURN_RIGHT", "TURN_LEFT", "FORWARD", "FORWARD", "STOP"],
    learningOutcomes: [
      "Usar una sola estructura if/else para escoger una salida.",
      "Diferenciar la respuesta del obstaculo y la respuesta libre.",
      "Completar un descenso corto con dos avances rectos.",
    ],
    instructions: [
      "Construye una solucion que saque al robot del inicio y lo lleve hacia la meta de abajo.",
      "La rama de obstaculo gira a la derecha; la rama libre gira a la izquierda como alternativa.",
      "Despues de la decision, avanza dos veces en linea recta hasta la meta.",
      "Cierra el programa al final para que la compilacion pueda validarlo correctamente.",
    ],
    victory:
      "La secuencia debe usar una sola decision y dos avances rectos para llevar el robot hasta la meta inferior izquierda.",
    tips: [
      "La primera decision separa dos giros distintos.",
      "Los dos avances finales completan el trayecto hasta la meta.",
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
      "Cierra el nivel con una condicion inicial y un while que repite un tramo recto al final de una ruta en zigzag.",
    summary:
      "La ruta final combina un zigzag corto con un while que repite el ultimo tramo recto hasta la meta.",
    scenarioLabel: "Escenario 5 / 6x6",
    grid: [
      [2, 1, 0, 1, 0, 0],
      [0, 0, 0, 1, 0, 0],
      [0, 0, 0, 0, 3, 0],
      [1, 1, 1, 1, 1, 0],
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
      "TURN_RIGHT",
      "FORWARD",
      "TURN_LEFT",
      "FORWARD",
      "WHILE_GOAL",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Unir una condicion con un while que repite la distancia final.",
      "Resolver una ruta en zigzag sin perder el orden de las acciones.",
      "Usar el while para completar el tramo recto que lleva a la meta.",
    ],
    instructions: [
      "Primero resuelve la salida con Si hay obstaculo / Si no hay obstaculo.",
      "Luego encadena el zigzag y abre Mientras no llegue para repetir el tramo final recto.",
      "La respuesta libre no necesita Esperar; cierra con Detener.",
    ],
    victory:
      "La secuencia final debe mezclar una decision inicial, un zigzag corto y un while con un cuerpo repetible que lleve la ruta hasta la meta.",
    tips: [
      "El orden de los bloques importa mucho mas que en las misiones anteriores.",
      "Busca una ruta base que termine apuntando directo a la meta.",
      "El while funciona como una repeticion del ultimo tramo recto.",
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
      "Cuando aparezca dentro de una rama o un bucle, el numero en Avanzar define cuantas casillas recorrera el robot.",
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
      "El numero en Avanzar solo aparece dentro de ramas o bucles; fuera de una decision el bloque avanza una sola casilla.",
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
      "Compilador de decisiones: arma condicionales con dos respuestas, usa Avanzar numerado solo dentro de ramas o while y deja los Avanzar sueltos sin numero.",
  },
};

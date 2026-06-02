import { CheckCircle, Cpu, Warning } from "@phosphor-icons/react";
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
] satisfies EditorLevelContent["palette"];

export const LEVEL_2_STAGES: MissionStage[] = [
  {
    id: 1,
    title: "Cruce inicial",
    difficulty: "Facil",
    objective:
      "Aprende a usar una estructura if/else simple: si el camino esta libre, avanzas en esa rama y luego cierras la ruta con otro avance fuera de la decision.",
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
      "Responder con un giro si hay obstaculo y con un avance numerado si el camino esta libre.",
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
    title: "Ruta larga",
    difficulty: "Alta",
    objective:
      "Combina una condicion inicial con varios avances rectos para recorrer un pasillo largo hasta la meta.",
    summary:
      "El robot corrige el desvio con una decision y luego avanza varias casillas en linea recta hasta la meta inferior.",
    scenarioLabel: "Escenario 4 / 5x5",
    grid: [
      [2, 1, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [3, 0, 0, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "IF_OBS_ELSE",
      "TURN_RIGHT",
      "TURN_LEFT",
      "FORWARD",
      "FORWARD",
      "FORWARD",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Usar una condicion para corregir la salida inicial.",
      "Encadenar varios avances despues de la decision.",
      "Contar cuantas casillas debe avanzar el robot en linea recta.",
    ],
    instructions: [
      "Usa Si hay obstaculo / Si no hay obstaculo para corregir la salida inicial.",
      "Despues de la decision, agrega los Avanzar necesarios en linea recta hasta la meta de abajo.",
      "Cada Avanzar suelto mueve una casilla; cuenta el pasillo antes de compilar.",
      "Cierra con Detener al final.",
    ],
    victory:
      "La secuencia debe abrirse con una decision y cerrar con cuatro avances rectos que lleven al robot hasta la meta inferior.",
    tips: [
      "La rama correcta de la condicion te deja mirando hacia el pasillo.",
      "Cuenta las casillas libres entre el desvio y la meta.",
      "Detener debe quedar al final como salida segura del programa.",
    ],
  },
  {
    id: 5,
    title: "Desafio final",
    difficulty: "Final",
    objective:
      "Cierra el nivel con una condicion inicial y una ruta en zigzag hecha solo con giros y avances.",
    summary:
      "La ruta final combina un zigzag corto con un tramo recto final hasta la meta, usando solo if/else y movimiento.",
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
      "FORWARD",
      "FORWARD",
      "STOP",
    ],
    learningOutcomes: [
      "Unir una condicion inicial con una ruta larga de giros y avances.",
      "Resolver una ruta en zigzag sin perder el orden de las acciones.",
      "Completar el tramo recto final con los avances exactos.",
    ],
    instructions: [
      "Primero resuelve la salida con Si hay obstaculo / Si no hay obstaculo.",
      "Luego encadena el zigzag con giros alternados y avances de una casilla.",
      "Al final agrega los Avanzar rectos que faltan para llegar a la meta.",
      "Cierra con Detener.",
    ],
    victory:
      "La secuencia final debe mezclar una decision inicial, un zigzag corto y avances rectos finales que lleven la ruta hasta la meta.",
    tips: [
      "El orden de los bloques importa mucho mas que en las misiones anteriores.",
      "Busca una ruta base que termine apuntando directo a la meta.",
      "Cuenta los avances del tramo final sin usar bucles.",
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
      "Aprende a construir secuencias con condicionales if/else mientras el robot reacciona a los obstaculos y avanza hacia metas cada vez mas lejanas.",
    learningOutcomes: [
      "Usar una estructura if/else para responder a obstaculos.",
      "Entender que la mision 1 es un tutorial guiado y que las siguientes ya se resuelven de forma autonoma.",
      "Combinar condicion, correccion y avances encadenados paso a paso.",
    ],
    instructions: [
      "La primera mision funciona como tutorial guiado; las siguientes ya no usan esa ayuda paso a paso.",
      "Desde la mision 2, las rutas combinan condicionales y mas avances en linea recta.",
      "Usa las decisiones para describir el comportamiento correcto del robot.",
      "Cuando aparezca dentro de una rama, el numero en Avanzar define cuantas casillas recorrera el robot.",
      "Compila la secuencia para comprobar que el robot realmente llega a la meta de cada escenario.",
    ],
    victory:
      "La primera mision sirve de introduccion guiada. Despues, cada reto agrega un poco mas de complejidad hasta dominar condicionales y rutas largas.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Esperar",
      "Detener",
      "Si hay obstaculo / Si no hay obstaculo",
    ],
    tips: [
      "La primera mision se abre sola cuando completas el tutorial.",
      "Esperar sigue siendo una pausa opcional, pero no es el centro del nivel.",
      "El numero en Avanzar solo aparece dentro de ramas; fuera de una decision el bloque avanza una sola casilla.",
      "Cada mision agrega un pequeno salto de dificultad para que el aprendizaje sea gradual.",
    ],
  },
};

function findGridStart(grid: number[][]): [number, number] {
  for (let row = 0; row < grid.length; row += 1) {
    const col = grid[row].indexOf(2);
    if (col !== -1) {
      return [row, col];
    }
  }
  return [0, 0];
}

export const LEVEL_EDITORS: Record<"2", EditorLevelContent> = {
  "2": {
    title: "Intermedio",
    level: "Nivel 1",
    levelSlug: "Intermedio",
    accent: "violet",
    grid: LEVEL_2_STAGES[0].grid,
    start: findGridStart(LEVEL_2_STAGES[0].grid),
    startDir: 0,
    palette: [...BASIC_PALETTE, ...INTERMEDIATE_PALETTE],
    helperText:
      "Compilador de decisiones: arma condicionales con dos respuestas, usa Avanzar numerado solo dentro de ramas y deja los Avanzar sueltos sin numero.",
  },
};

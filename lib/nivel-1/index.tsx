import { CheckCircle, Cpu, Warning, Repeat } from "@phosphor-icons/react";
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
    type: "REPEAT",
    label: "Repetir N veces",
    colorClass: "border-indigo-300 bg-indigo-50 text-indigo-700",
    icon: <Repeat size={14} weight="bold" />,
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
      "Responder con un giro si hay obstaculo y con un avance libre si el camino esta libre.",
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
    scenarioLabel: "Escenario 3 / 5x5",
    grid: [
      [0, 2, 1, 0, 0],
      [0, 1, 0, 0, 3],
      [0, 0, 1, 1, 1],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
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
    title: "Introducción al bucle for",
    difficulty: "Basica",
    objective: "Aprende a usar un bucle For para repetir una accion un numero exacto de veces.",
    summary: "Tutorial guiado: en lugar de escribir muchos bloques redundantes, usaras un For con N=4 para subir la escalera.",
    scenarioLabel: "Escenario 4 / Tutorial Bucles",
    grid: [
      [2, 0, 1, 1, 1],
      [1, 0, 0, 1, 1],
      [1, 1, 0, 0, 1],
      [1, 1, 1, 0, 0],
      [1, 1, 1, 1, 3],
    ],
    requiredSequence: ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "FORWARD", "TURN_LEFT", "STOP"],
    learningOutcomes: [
      "Usar bucles For para repeticion fija.",
      "Configurar el parametro N en un bucle.",
      "Optimizar codigo secuencial.",
    ],
    instructions: [
      "Coloca el bloque Repetir N veces y configuralo en N=4.",
      "Agrega dentro del bucle: Avanzar, Girar derecha, Avanzar y Girar izquierda.",
      "Cierra el programa con Detener.",
      "Verifica en la simulacion que el robot logre subir las escaleras.",
    ],
    victory: "El robot debe llegar a la meta usando un bucle For configurado en 4 iteraciones.",
    tips: [
      "Haz clic en el numero del bloque For para cambiar el valor de N.",
      "Los bloques dentro de 'Repetir N veces' se ejecutaran consecutivamente.",
    ],
  },
  {
    id: 5,
    title: "Esquina con for",
    difficulty: "Basica",
    objective: "Usa un bucle For para avanzar una distancia larga y luego realiza un giro para llegar a la meta.",
    summary: "Avanza por un pasillo recto usando repeticion y luego gira hacia la meta lateral.",
    scenarioLabel: "Escenario 5 / 5x5",
    grid: [
      [2, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [1, 1, 1, 1, 0],
      [1, 1, 1, 1, 0],
      [1, 1, 1, 1, 3],
    ],
    requiredSequence: ["INIT", "REPEAT", "FORWARD", "TURN_RIGHT", "REPEAT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Combinar multiples bucles For en la misma secuencia.",
      "Calcular iteraciones exactas para girar en esquinas.",
    ],
    instructions: [
      "Avanza 4 celdas usando un bucle For.",
      "Gira a la derecha y luego avanza otras 4 celdas usando otro bucle For.",
      "Termina el programa con Detener sobre la meta.",
    ],
    victory: "El robot alcanza la esquina inferior derecha del tablero usando bucles.",
    tips: [
      "Usa la cantidad exacta de pasos N en cada bucle.",
    ],
  },
  {
    id: 6,
    title: "Laberinto en U",
    difficulty: "Alta",
    objective: "Supera un corredor largo en forma de U usando bucles optimizados.",
    summary: "Recorre dos tramos largos y uno corto para sortear las paredes externas en U del laberinto.",
    scenarioLabel: "Escenario 6 / U 5x5",
    grid: [
      [2, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0],
      [0, 1, 3, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "REPEAT", "FORWARD", "TURN_RIGHT",
      "REPEAT", "FORWARD", "TURN_RIGHT",
      "REPEAT", "FORWARD",
      "STOP"
    ],
    learningOutcomes: [
      "Resolver trayectos en forma de U con la menor cantidad de bloques.",
      "Calcular distancias de avance en corredores paralelos.",
      "Utilizar la simulacion 2D para ajustar el valor de N."
    ],
    instructions: [
      "Inicia con el bloque de entrada.",
      "Avanza 4 celdas a la derecha con un bucle N=4 y gira a la derecha.",
      "Avanza 4 celdas hacia abajo con un bucle N=4 y gira a la derecha.",
      "Avanza 2 celdas a la izquierda con un bucle N=2 para llegar al punto META.",
      "Coloca Detener al final del recorrido."
    ],
    victory: "El robot recorre el canal en U y se detiene exactamente en la meta.",
    tips: [
      "Observa que el primer tramo tiene 4 celdas libres, el segundo tiene 4 y el tercero tiene 2.",
      "Asegurate de orientar al robot a la derecha antes de girar."
    ]
  },
  {
    id: 7,
    title: "Doble zigzag",
    difficulty: "Final",
    objective: "Domina el movimiento avanzado esquivando obstaculos en un doble zigzag de alta precision.",
    summary: "Planifica una secuencia de giros alternados y bucles para sortear un pasillo de obstaculos dobles.",
    scenarioLabel: "Escenario 7 / Zigzag 5x5",
    grid: [
      [2, 0, 1, 0, 0],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 1, 1, 0, 3],
    ],
    requiredSequence: [
      "INIT",
      "FORWARD",
      "TURN_RIGHT",
      "REPEAT", "FORWARD",
      "TURN_LEFT",
      "REPEAT", "FORWARD",
      "TURN_RIGHT",
      "REPEAT", "FORWARD",
      "TURN_LEFT",
      "REPEAT", "FORWARD",
      "STOP"
    ],
    learningOutcomes: [
      "Estructurar trayectorias complejas con multiples giros alternados.",
      "Combinar bloques de avance simple con bucles repetitivos.",
      "Completar el nivel avanzado demostrando control total sobre el robot."
    ],
    instructions: [
      "Inicia la secuencia.",
      "Avanza 1 paso al frente y gira a la derecha.",
      "Usa un bucle de N=1 para avanzar 1 paso, y gira a la izquierda.",
      "Usa un bucle de N=2 para avanzar 2 pasos, y gira a la derecha.",
      "Usa un bucle de N=3 para avanzar 3 pasos, y gira a la izquierda.",
      "Usa un bucle de N=1 para avanzar 1 paso para llegar a la META.",
      "Finaliza con Detener."
    ],
    victory: "El robot recorre el laberinto de doble zigzag completo sin tocar ningun obstaculo y finaliza en la meta.",
    tips: [
      "Dibuja o imagina la ruta en el simulador paso por paso.",
      "Recuerda que cada giro cambia tu orientacion y determina la direccion del siguiente bucle."
    ]
  }
];

export const LEVEL_MISSIONS: Record<"2", MissionContent> = {
  "2": {
    level: "Nivel 1",
    levelSlug: "Intermedio",
    title: "Evadir obstáculos y bucles",
    badge: "Control",
    icon: <Cpu size={24} weight="duotone" />,
    accent: "violet",
    objective:
      "Aprende a construir secuencias con condicionales if/else y bucles repetitivos for mientras el robot reacciona a los obstáculos y optimiza su ruta.",
    learningOutcomes: [
      "Usar una estructura if/else para responder a obstáculos.",
      "Utilizar bucles repetitivos para automatizar trayectos constantes.",
      "Combinar decisiones y bucles de forma óptima.",
    ],
    instructions: [
      "Las primeras misiones se enfocan en condicionales sencillos frente a obstáculos.",
      "Las misiones avanzadas introducen el bloque Repetir N veces (bucle For) para optimizar tus secuencias.",
      "Cuando aparezca dentro de una rama, el número en Avanzar define cuántas casillas recorrerá el robot.",
      "Compila la secuencia para comprobar que el robot realmente llega a la meta de cada escenario.",
    ],
    victory:
      "Domina el uso de condicionales y bucles repetitivos para guiar al robot a través de escenarios complejos con obstáculos.",
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
      "Las misiones progresan de condicionales simples a bucles eficientes.",
      "El bloque Repetir N veces repite las instrucciones que pongas dentro de él.",
      "Puedes ajustar la cantidad de repeticiones N haciendo clic en el bloque.",
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
      "Compilador de decisiones y bucles: arma condicionales con if/else o bucles for para automatizar movimientos repetitivos.",
  },
};

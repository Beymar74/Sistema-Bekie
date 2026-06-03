import {
  ArrowRight,
  CheckCircle,
  Cpu,
  Warning,
  Repeat,
  Flag,
} from "@phosphor-icons/react";
import { BASIC_PALETTE, type EditorLevelContent, type MissionContent, type MissionStage, type PaletteBlock } from "@/lib/levels";

const ADVANCED_PALETTE: PaletteBlock[] = [
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
];

export const LEVEL_3_STAGES: MissionStage[] = [
  {
    id: 1,
    title: "Intro al bucle For",
    difficulty: "Facil",
    objective: "Aprende a usar un bucle For para repetir una accion un numero exacto de veces.",
    summary: "Tutorial guiado: en lugar de escribir 17 bloques de codigo, usaras un For con N=4 para subir la escalera.",
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
      "Usar bucles For para repeticion fija.",
      "Configurar el parametro N en un bucle.",
      "Optimizar codigo secuencial.",
    ],
    instructions: [
      "Coloca Repetir N veces y configura N=4.",
      "Agrega dentro del For: Avanzar, Girar derecha, Avanzar y Girar izquierda.",
      "Cierra con Detener.",
      "Pulsa Probar para verificar que el robot llega a la meta.",
    ],
    victory: "El robot debe llegar a la meta usando un bucle For configurado en 4 iteraciones.",
    tips: [
      "Haz clic en el numero del bloque For para cambiar el valor de N.",
      "Los bloques dentro de 'Repetir N veces' se ejecutaran consecutivamente.",
    ],
  },
  {
    id: 2,
    title: "Esquina con For",
    difficulty: "Basica",
    objective: "Usa un bucle For para avanzar una distancia larga y luego realiza un giro para llegar a la meta.",
    summary: "Avanza por un pasillo recto usando repeticion y luego gira hacia la meta lateral.",
    scenarioLabel: "ESCENARIO 2 / 5x5",
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
    id: 3,
    title: "Decision en el camino",
    difficulty: "Media",
    objective: "Combina condicionales y bucles en una secuencia avanzada.",
    summary: "Decide la direccion correcta al inicio y luego usa un bucle For para recorrer el tramo final.",
    scenarioLabel: "ESCENARIO 3 / 6x6",
    grid: [
      [2, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 3],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD", "REPEAT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Integrar condicionales y bucles en orden secuencial.",
      "Planificar rutas dinamicas ante obstaculos fijos.",
    ],
    instructions: [
      "Evalua si hay obstaculo al frente para elegir el desvio correcto.",
      "Una vez alineado con el corredor de la meta, usa un bucle For para avanzar 4 celdas directamente.",
    ],
    victory: "El robot esquiva el obstaculo y recorre el pasillo hasta la meta.",
    tips: [
      "La decision inicial te saca del bloqueo del inicio.",
    ],
  },
  {
    id: 4,
    title: "For dentro de condicion",
    difficulty: "Alta",
    objective: "Anida un bucle For dentro de una de las ramas de un condicional.",
    summary: "Si no hay obstaculo avanza con un bucle, si hay obstaculo toma otra ruta.",
    scenarioLabel: "ESCENARIO 4 / 6x6",
    grid: [
      [2, 0, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 1],
      [1, 1, 1, 0, 0, 3],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
      [1, 1, 1, 1, 1, 1],
    ],
    requiredSequence: ["INIT", "IF_OBS_ELSE", "REPEAT", "FORWARD", "FORWARD", "STOP"],
    learningOutcomes: [
      "Anidar estructuras de repeticion dentro de condicionales.",
      "Estructurar ramas complejas con multiples bloques.",
    ],
    instructions: [
      "Configura una condicion inicial de obstaculo.",
      "Coloca un bloque Repetir N veces dentro de la rama libre para avanzar rapidamente.",
      "Cierra la ruta sobre la meta y valida en la consola.",
    ],
    victory: "El robot ejecuta la repetición anidada en la rama correspondiente para llegar a la meta.",
    tips: [
      "Puedes arrastrar el bloque For y soltarlo directamente dentro de la seccion 'Si no hay obstaculo'.",
    ],
  },
  {
    id: 5,
    title: "Desafio maestro",
    difficulty: "Alta",
    objective: "Resuelve una ruta de alta complejidad anidando condicionales dentro de bucles y usando For.",
    summary: "Zigzag complejo con obstaculos fijos que requiere optimizacion maxima de bloques.",
    scenarioLabel: "ESCENARIO 5 / Desafio Maestro",
    grid: [
      [2, 0, 1, 1, 1, 1],
      [1, 0, 1, 1, 1, 1],
      [1, 0, 0, 0, 1, 1],
      [1, 1, 1, 0, 1, 3],
      [1, 1, 1, 0, 0, 0],
      [1, 1, 1, 1, 1, 1],
    ],
    requiredSequence: ["INIT", "REPEAT", "IF_OBS_ELSE", "TURN_RIGHT", "FORWARD", "STOP"],
    learningOutcomes: [
      "Resolver desvios continuos de forma automatica.",
      "Combinar multiples estructuras anidadas en el nivel final.",
    ],
    instructions: [
      "Usa una combinacion de Repetir N veces y condicionales para avanzar decidiendo en cada esquina.",
      "Llega a la meta en la esquina derecha media de forma automatica y envia el programa.",
    ],
    victory: "El robot resuelve el laberinto complejo de forma exitosa.",
    tips: [
      "Analiza el recorrido del robot y cuenta cuantas repeticiones totales requiere.",
    ],
  },
  {
    id: 6,
    title: "Espiral cuadrada",
    difficulty: "Alta",
    objective: "Usa multiples bucles para guiar al robot hacia el centro de un espiral cuadrado.",
    summary: "Navega hacia el interior de un laberinto en espiral usando secuencias de bucles de tamaño decreciente.",
    scenarioLabel: "ESCENARIO 6 / Espiral",
    grid: [
      [2, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 0],
      [1, 3, 0, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 1, 0, 1, 0],
      [1, 0, 0, 0, 0, 0],
    ],
    requiredSequence: [
      "INIT",
      "REPEAT", "FORWARD", "TURN_RIGHT",
      "REPEAT", "FORWARD", "TURN_RIGHT",
      "REPEAT", "FORWARD", "TURN_RIGHT",
      "REPEAT", "FORWARD",
      "STOP"
    ],
    learningOutcomes: [
      "Encadenar multiples bucles con diferentes valores de N.",
      "Comprender el patron de reduccion de paso en espirales.",
      "Controlar la orientacion del robot en giros continuos a la derecha."
    ],
    instructions: [
      "Comienza con Iniciar mision.",
      "Avanza 5 celdas a la derecha con un bucle de N=5, y gira a la derecha.",
      "Avanza 5 celdas abajo con un bucle de N=5, y gira a la derecha.",
      "Avanza 4 celdas a la izquierda con un bucle de N=4, y gira a la derecha.",
      "Avanza 3 celdas arriba con un bucle de N=3 para alcanzar la meta.",
      "Cierra la secuencia con Detener."
    ],
    victory: "El robot alcanza la meta en el centro del espiral mediante un patron de bucles repetitivos y giros ordenados.",
    tips: [
      "Cuenta bien los pasos del robot en cada tramo recto.",
      "Cada giro a la derecha te orienta hacia la siguiente seccion del espiral."
    ]
  },
  {
    id: 7,
    title: "El laberinto en U",
    difficulty: "Alta",
    objective: "Supera un corredor largo en forma de U usando bucles optimizados.",
    summary: "Recorre dos tramos largos y uno corto para sortear las paredes externas en U del laberinto.",
    scenarioLabel: "ESCENARIO 7 / Laberinto en U",
    grid: [
      [2, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 0],
      [0, 1, 3, 0, 0, 0],
      [0, 1, 1, 1, 1, 1],
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
      "Avanza 5 celdas a la derecha con un bucle N=5 y gira a la derecha.",
      "Avanza 4 celdas hacia abajo con un bucle N=4 y gira a la derecha.",
      "Avanza 3 celdas a la izquierda con un bucle N=3 para llegar al punto META.",
      "Coloca Detener al final del recorrido."
    ],
    victory: "El robot recorre el canal en U y se detiene exactamente en la meta.",
    tips: [
      "Observa que el primer tramo tiene 5 celdas libres, el segundo tiene 4 y el tercero tiene 3.",
      "Asegurate de orientar al robot a la derecha antes de girar."
    ]
  },
  {
    id: 8,
    title: "Doble zigzag",
    difficulty: "Final",
    objective: "Domina el movimiento avanzado esquivando obstaculos en un doble zigzag de alta precision.",
    summary: "Planifica una secuencia de giros alternados y bucles para sortear un pasillo de obstaculos dobles.",
    scenarioLabel: "ESCENARIO 8 / Desafio Final",
    grid: [
      [2, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [1, 0, 0, 0, 1, 0],
      [1, 1, 1, 0, 1, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 3],
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
      "Usa un bucle de N=2 para avanzar 2 pasos, y gira a la izquierda.",
      "Usa un bucle de N=2 para avanzar 2 pasos, y gira a la derecha.",
      "Usa un bucle de N=3 para avanzar 3 pasos, y gira a la izquierda.",
      "Usa un bucle de N=2 para avanzar 2 pasos para llegar a la META.",
      "Finaliza con Detener."
    ],
    victory: "El robot recorre el laberinto de doble zigzag completo sin tocar ningun obstaculo y finaliza en la meta.",
    tips: [
      "Dibuja o imagina la ruta en el simulador paso por paso.",
      "Recuerda que cada giro cambia tu orientacion y determina la direccion del siguiente bucle."
    ]
  },
];

export const LEVEL_MISSIONS: Record<"3", MissionContent> = {
  "3": {
    level: "Nivel 2",
    levelSlug: "Avanzado",
    title: "Bucles y decisiones",
    badge: "Aninados",
    icon: <Repeat size={24} weight="duotone" />,
    accent: "violet",
    objective:
      "Aprende a combinar y anidar bucles y decisiones complejas. El robot reacciona a distancias mas largas y planifica rutas inteligentes.",
    learningOutcomes: [
      "Anidar condicionales dentro de bucles Mientras no llegue.",
      "Usar lecturas de distancia de multiples sensores de forma simultanea.",
      "Resolver laberintos y zigzags de forma totalmente automatizada.",
    ],
    instructions: [
      "Inserta bloques condicionales dentro del cuerpo de un bucle para evaluar el entorno constantemente.",
      "Usa la simulacion para ver el valor exacto de distancia en centimetros de los sensores.",
      "Si la simulacion completa el laberinto, desbloquearas la carga de programa al robot fisico.",
    ],
    victory:
      "El robot debe encontrar y llegar a la meta en escenarios avanzados mediante logica repetitiva autogestionada.",
    blocks: [
      "Iniciar mision",
      "Avanzar",
      "Retroceder",
      "Girar izquierda",
      "Girar derecha",
      "Si hay obstaculo / Si no hay obstaculo",
      "Repetir N veces",
      "Detener",
    ],
    tips: [
      "Los condicionales anidados evaluan las condiciones en cada iteracion del bucle.",
      "Usa el panel de sensores para verificar que distancia detecta el robot en tiempo real.",
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
    palette: [...BASIC_PALETTE, ...ADVANCED_PALETTE],
    helperText:
      "Usa Repetir N veces para tramos fijos y Si hay obstaculo para tomar decisiones automáticas.",
  },
};

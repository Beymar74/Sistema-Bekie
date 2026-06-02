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
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0],
      [3, 0, 0, 0, 0],
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
    victory: "El robot alcanza la esquina inferior izquierda del tablero usando bucles.",
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
      [2, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
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
      [2, 0, 0, 0, 1, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 3],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
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
    difficulty: "Final",
    objective: "Resuelve una ruta de alta complejidad anidando condicionales dentro de bucles y usando For.",
    summary: "Zigzag complejo con obstaculos fijos que requiere optimizacion maxima de bloques.",
    scenarioLabel: "ESCENARIO 5 / Desafio Maestro",
    grid: [
      [2, 0, 1, 0, 0, 0],
      [0, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 3],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
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

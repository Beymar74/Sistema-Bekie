export interface Step {
  number: number;
  title: string;
  description: string;
  tip: string;
  visual: "surface" | "measure" | "grid" | "start" | "goal" | "obstacles" | null;
}

export const STEPS: Step[] = [
  {
    number: 1,
    title: "Prepara la superficie",
    description:
      "Une hojas o utiliza una cartulina grande para formar una superficie de aproximadamente 100 cm x 100 cm. Esta será la base del escenario donde se moverá el robot.",
    tip: "Tip: Pega las hojas con cinta adhesiva por el reverso para que la superficie quede plana.",
    visual: "surface",
  },
  {
    number: 2,
    title: "Mide las celdas",
    description:
      "Con ayuda de una regla, marca espacios de 20 cm tanto de forma horizontal como vertical. Cada cuadro representará una celda del escenario.",
    tip: "Cada celda es un cuadrado de 20 cm x 20 cm. Necesitas marcar 6 líneas horizontales y 6 verticales.",
    visual: "measure",
  },
  {
    number: 3,
    title: "Dibuja la cuadrícula",
    description:
      "Traza líneas horizontales y verticales para formar una matriz de 5 filas y 5 columnas. Al finalizar, tendrás 25 celdas en total.",
    tip: "Usa el marcador para trazar líneas rectas con la regla. Verifica que todas las celdas sean del mismo tamaño.",
    visual: "grid",
  },
  {
    number: 4,
    title: "Marca el punto de inicio",
    description:
      "Escribe la letra A o la palabra INICIO en la celda inferior izquierda. Esta será la posición inicial del robot.",
    tip: "En el simulador, la celda de inicio tiene el valor 2. El robot empieza mirando hacia la derecha.",
    visual: "start",
  },
  {
    number: 5,
    title: "Marca la meta",
    description:
      "Escribe la letra B o la palabra META en la celda superior derecha. El objetivo del Nivel 0 será programar al robot para llegar desde el inicio hasta esta celda.",
    tip: "En el simulador, la celda meta tiene el valor 3. El robot debe llegar aquí sin chocar con ningún obstáculo.",
    visual: "goal",
  },
  {
    number: 6,
    title: "Coloca obstáculos simples",
    description:
      "Marca una o dos celdas como obstáculos usando una X o colocando pequeños objetos livianos. En el Nivel 0, el robot no tomará decisiones automáticas; por eso deberás planificar la ruta antes de programar.",
    tip: "No pongas obstáculos en las celdas de inicio ni en la meta. Deja siempre al menos un camino libre.",
    visual: "obstacles",
  },
];

export const CHECKLIST_ITEMS = [
  "Preparé una superficie de 100 cm x 100 cm",
  "Dibujé una cuadrícula de 5x5",
  "Cada celda mide 20 cm x 20 cm",
  "Marqué el punto de inicio (A)",
  "Marqué la meta (B)",
  "Coloqué los obstáculos indicados",
];

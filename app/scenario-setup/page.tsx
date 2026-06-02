"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import {
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Circle,
  Scissors,
  Ruler,
  PencilSimple,
  Package,
  MapPin,
  Flag,
  Warning,
  Check,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const MATERIALS = [
  { icon: <Package size={16} weight="duotone" />, text: "Hojas de papel o cartulina" },
  { icon: <PencilSimple size={16} weight="duotone" />, text: "Marcador negro o de color visible" },
  { icon: <Ruler size={16} weight="duotone" />, text: "Regla de 20 cm o mas" },
  { icon: <Package size={16} weight="duotone" />, text: "Cinta adhesiva" },
  { icon: <PencilSimple size={16} weight="duotone" />, text: "Lapiz" },
  { icon: <Scissors size={16} weight="duotone" />, text: "Tijeras (si necesitas unir hojas)" },
];

const STEPS = [
  {
    number: 1,
    title: "Prepara la superficie",
    description:
      "Une hojas o utiliza una cartulina grande para formar una superficie de aproximadamente 100 cm x 100 cm. Esta sera la base del escenario donde se movera el robot.",
    tip: "Tip: Pega las hojas con cinta adhesiva por el reverso para que la superficie quede plana.",
    visual: null,
  },
  {
    number: 2,
    title: "Mide las celdas",
    description:
      "Con ayuda de una regla, marca espacios de 20 cm tanto de forma horizontal como vertical. Cada cuadro representara una celda del escenario.",
    tip: "Cada celda es un cuadrado de 20 cm x 20 cm. Necesitas marcar 6 lineas horizontales y 6 verticales.",
    visual: null,
  },
  {
    number: 3,
    title: "Dibuja la cuadricula",
    description:
      "Traza lineas horizontales y verticales para formar una matriz de 5 filas y 5 columnas. Al finalizar, tendras 25 celdas en total.",
    tip: "Usa el marcador para trazar lineas rectas con la regla. Verifica que todas las celdas sean del mismo tamano.",
    visual: "grid",
  },
  {
    number: 4,
    title: "Marca el punto de inicio",
    description:
      'Escribe la letra A o la palabra INICIO en la celda inferior izquierda. Esta sera la posicion inicial del robot.',
    tip: "En el simulador, la celda de inicio tiene el valor 2. El robot empieza mirando hacia la derecha.",
    visual: "start",
  },
  {
    number: 5,
    title: "Marca la meta",
    description:
      'Escribe la letra B o la palabra META en la celda superior derecha. El objetivo del Nivel 0 sera programar al robot para llegar desde el inicio hasta esta celda.',
    tip: "En el simulador, la celda meta tiene el valor 3. El robot debe llegar aqui sin chocar con ningun obstaculo.",
    visual: "goal",
  },
  {
    number: 6,
    title: "Coloca obstaculos simples",
    description:
      "Marca una o dos celdas como obstaculos usando una X o colocando pequenos objetos livianos. En el Nivel 0, el robot no tomara decisiones automaticas; por eso deberas planificar la ruta antes de programar.",
    tip: "No pongas obstaculos en las celdas de inicio ni en la meta. Deja siempre al menos un camino libre.",
    visual: "obstacles",
  },
];

const CHECKLIST_ITEMS = [
  "Prepare una superficie de 100 cm x 100 cm",
  "Dibuje una cuadricula de 5x5",
  "Cada celda mide 20 cm x 20 cm",
  "Marque el punto de inicio (A)",
  "Marque la meta (B)",
  "Coloque los obstaculos indicados",
];

function GridVisual({ showStart, showGoal, showObstacles }: { showStart: boolean; showGoal: boolean; showObstacles: boolean }) {
  const obstacles = showObstacles ? [[1, 2], [2, 3]] : [];

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {Array.from({ length: 5 }).map((_, row) =>
          Array.from({ length: 5 }).map((_, col) => {
            const isStart = showStart && row === 4 && col === 0;
            const isGoal = showGoal && row === 0 && col === 4;
            const isObs = obstacles.some(([r, c]) => r === row && c === col);

            return (
              <div
                key={`${row}-${col}`}
                className={`w-10 h-10 rounded-sm border flex items-center justify-center text-[11px] font-bold font-mono transition-all duration-300 ${
                  isStart
                    ? "bg-cyan-100 border-cyan-400 text-cyan-700"
                    : isGoal
                    ? "bg-emerald-100 border-emerald-400 text-emerald-700"
                    : isObs
                    ? "bg-gray-500 border-gray-600 text-gray-300"
                    : "bg-gray-50 border-gray-300"
                }`}
              >
                {isStart && "A"}
                {isGoal && "B"}
                {isObs && "X"}
              </div>
            );
          })
        )}
      </div>
      <div className="flex items-center gap-4 mt-1 text-[11px] font-mono text-gray-600">
        {showStart && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-cyan-100 border border-cyan-400 flex-shrink-0" />
            Inicio (A)
          </span>
        )}
        {showGoal && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-emerald-100 border border-emerald-400 flex-shrink-0" />
            Meta (B)
          </span>
        )}
        {showObstacles && (
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm bg-gray-500 border border-gray-600 flex-shrink-0" />
            Obstaculo
          </span>
        )}
      </div>
    </div>
  );
}


export default function ScenarioSetupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = materials, 1-6 = steps, 7 = checklist
  const [checked, setChecked] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));
  const [confirmed, setConfirmed] = useState(false);

  const totalSteps = STEPS.length;
  const isOnMaterials = step === 0;
  const isOnChecklist = step === totalSteps + 1;
  const currentStep = STEPS[step - 1];
  const progress = isOnMaterials ? 0 : isOnChecklist ? 100 : Math.round((step / totalSteps) * 100);
  const allChecked = checked.every(Boolean);

  const goNext = () => setStep((s) => s + 1);
  const goBack = () => setStep((s) => s - 1);

  const toggleCheck = (i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  };

  const handleConfirm = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bekie-scenario-ready", "true");
    }
    setConfirmed(true);
    setTimeout(() => router.push("/dashboard"), 1500);
  };

  const getVisual = (visual: string | null) => {
    if (!visual) return null;
    return (
      <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <GridVisual
          showStart={visual === "start" || visual === "goal" || visual === "obstacles"}
          showGoal={visual === "goal" || visual === "obstacles"}
          showObstacles={visual === "obstacles"}
        />
      </div>
    );
  };

  if (confirmed) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center mx-auto mb-5">
            <Check size={28} weight="bold" className="text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Escenario listo</h2>
          <p className="text-sm text-gray-600 mt-2">Redirigiendo al dashboard...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center">
            <span className="text-white font-black text-[9px] font-mono leading-none">BK</span>
          </span>
          <span className="font-semibold text-gray-700 text-sm">
            BEKIE <span className="text-gray-500">/ WIRED</span>
          </span>
        </Link>
        <span className="text-xs font-mono text-gray-500">
          {isOnMaterials ? "Materiales" : isOnChecklist ? "Verificacion" : `Paso ${step} de ${totalSteps}`}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <motion.div
          className="h-full bg-cyan-600"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
        />
      </div>

      <main className="flex-1 max-w-screen-sm mx-auto w-full px-5 py-8">
        <AnimatePresence mode="wait">
          {/* Materials screen */}
          {isOnMaterials && (
            <motion.div
              key="materials"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <div className="mb-8">
                <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                  Preparacion del escenario
                </span>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-1.5">
                  Construye tu escenario de practica
                </h1>
                <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                  Antes de programar tu robot, necesitas construir un escenario fisico de 5x5
                  celdas. Esto te ayudara a entender el espacio donde se movera el robot y
                  conectar lo que ves en la pantalla con el mundo real.
                </p>
              </div>

              <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <Package size={16} weight="duotone" className="text-cyan-600" />
                  <h2 className="text-sm font-semibold text-gray-700">Materiales necesarios</h2>
                </div>
                <div className="flex flex-col gap-3">
                  {MATERIALS.map((m, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className="text-cyan-600 flex-shrink-0">{m.icon}</span>
                      <span className="text-sm text-gray-700">{m.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-3">
                <Warning size={16} weight="duotone" className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Recomendacion:</span> Usa cartulina o varias
                  hojas unidas con cinta adhesiva para formar una superficie de aproximadamente
                  100 cm x 100 cm.
                </p>
              </div>

              <button
                onClick={goNext}
                className="w-full flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold text-sm py-3.5 rounded-xl hover:bg-cyan-700 transition-colors"
              >
                Comenzar construccion
                <ArrowRight size={16} weight="bold" />
              </button>
            </motion.div>
          )}

          {/* Step screens */}
          {!isOnMaterials && !isOnChecklist && currentStep && (
            <motion.div
              key={`step-${step}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.28, ease: EASE_OUT }}
            >
              {/* Step pills */}
              <div className="flex items-center gap-1.5 mb-6">
                {STEPS.map((s) => (
                  <div
                    key={s.number}
                    className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
                      s.number < step
                        ? "bg-cyan-600"
                        : s.number === step
                        ? "bg-cyan-600"
                        : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 mb-2">
                <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
                  {currentStep.number}
                </span>
                <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                  Paso {currentStep.number} de {totalSteps}
                </span>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">{currentStep.title}</h2>

              <p className="text-sm text-gray-600 leading-relaxed mb-5">
                {currentStep.description}
              </p>

              {getVisual(currentStep.visual)}

              {currentStep.tip && (
                <div className="mt-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <Warning size={14} weight="duotone" className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">{currentStep.tip}</p>
                </div>
              )}

              {/* Representation for step 3 (grid label mapping) */}
              {currentStep.number === 3 && (
                <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
                    Representacion digital de la cuadricula
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3">
                    {[
                      { val: "0", label: "Camino libre", color: "text-gray-500" },
                      { val: "1", label: "Obstaculo", color: "text-red-500" },
                      { val: "2", label: "Inicio (A)", color: "text-cyan-600" },
                      { val: "3", label: "Meta (B)", color: "text-emerald-600" },
                    ].map((item) => (
                      <div key={item.val} className="flex items-center gap-2">
                        <span className={`font-bold ${item.color}`}>{item.val}</span>
                        <span className="text-gray-600">= {item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-3 mt-8">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-700 transition-colors"
                >
                  <ArrowLeft size={15} weight="bold" />
                  Atras
                </button>
                <button
                  onClick={goNext}
                  className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold text-sm py-2.5 rounded-xl hover:bg-cyan-700 transition-colors"
                >
                  {step === totalSteps ? "Verificar escenario" : "Siguiente paso"}
                  <ArrowRight size={15} weight="bold" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Checklist screen */}
          {isOnChecklist && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: EASE_OUT }}
            >
              <div className="mb-7">
                <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                  Verificacion del escenario
                </span>
                <h1 className="text-2xl font-bold text-gray-900 mt-1.5">
                  Confirma que completaste todo
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Antes de continuar, marca cada paso que realizaste.
                </p>
              </div>

              {/* Final grid preview */}
              <div className="mb-6 p-5 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-4">
                  Tu escenario deberia verse asi
                </p>
                <GridVisual showStart showGoal showObstacles />
              </div>

              <div className="flex flex-col gap-3 mb-8">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <button
                    key={i}
                    onClick={() => toggleCheck(i)}
                    className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                      checked[i]
                        ? "bg-emerald-50 border-emerald-300"
                        : "bg-white border-gray-300 hover:border-gray-400"
                    }`}
                    aria-pressed={checked[i]}
                    aria-label={item}
                  >
                    {checked[i] ? (
                      <CheckCircle size={20} weight="fill" className="text-emerald-600 flex-shrink-0" />
                    ) : (
                      <Circle size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                    <span
                      className={`text-sm leading-snug ${
                        checked[i] ? "text-emerald-800" : "text-gray-700"
                      }`}
                    >
                      {item}
                    </span>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-3 rounded-xl hover:border-gray-400 transition-colors"
                >
                  <ArrowLeft size={15} weight="bold" />
                  Atras
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!allChecked}
                  className={`flex-1 flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all duration-200 ${
                    allChecked
                      ? "bg-cyan-600 text-white hover:bg-cyan-700"
                      : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <Flag size={16} weight="fill" />
                  Confirmar escenario
                </button>
              </div>

              {!allChecked && (
                <p className="text-center text-xs text-gray-500 mt-3">
                  Marca todos los items para continuar
                </p>
              )}

              {allChecked && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl"
                >
                  <CheckCircle size={15} weight="fill" className="text-emerald-600 flex-shrink-0" />
                  <p className="text-xs text-emerald-700">
                    Todo listo. Presiona Confirmar escenario para desbloquear el Nivel 0.
                  </p>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

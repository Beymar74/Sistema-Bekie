"use client";
import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowRight,
  Lock,
  CheckCircle,
  Clock,
  Code,
  Cpu,
} from "@phosphor-icons/react";
import { LEVEL_2_STAGES } from "@/lib/nivel-1";
import { LEVEL_0_STAGES } from "@/lib/levels";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } },
};

export default function LevelsPage() {
  const unlockedBasicMission = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return 1;
      const stored = Number(window.localStorage.getItem("bekie-level-0-progress") ?? "1");
      const safeValue = Number.isNaN(stored) ? 1 : stored;
      return Math.min(LEVEL_0_STAGES.length, Math.max(1, safeValue));
    },
    () => 1
  );
  const completedBasicMissions = Math.max(0, unlockedBasicMission - 1);

  const unlockedIntermediateMission = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      if (typeof window === "undefined") return 1;
      const stored = Number(window.localStorage.getItem("bekie-level-2-progress") ?? "1");
      const safeValue = Number.isNaN(stored) ? 1 : stored;
      return Math.min(LEVEL_2_STAGES.length, Math.max(1, safeValue));
    },
    () => 1
  );
  const completedIntermediateMissions = Math.max(0, unlockedIntermediateMission - 1);

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-lg mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="mb-10"
        >
          <p className="text-sm text-gray-600 font-mono">Tu progreso</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-0.5">
            Selecciona un nivel
          </h1>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {/* Nivel 0 */}
          <motion.div variants={fadeUp} className="flex flex-col">
            <div className="card-hover bg-gray-100 border border-gray-300 rounded-2xl p-7 flex flex-col gap-6 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-400/20 flex items-center justify-center">
                    <Code size={20} weight="duotone" className="text-cyan-600" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                      Nivel 0
                    </span>
                    <h2 className="text-xl font-bold text-gray-800">Basico</h2>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono text-amber-600 bg-amber-400/10 px-2.5 py-1 rounded-full">
                  <Clock size={11} weight="fill" />
                  En progreso
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Programacion secuencial. Guia el robot desde el punto A hasta el B
                usando bloques de movimiento. Sin sensores ni condicionales.
              </p>

              <div>
                <p className="text-xs text-gray-600 mb-3 font-medium">Bloques disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {["Iniciar mision", "Avanzar", "Retroceder", "Girar izquierda", "Girar derecha", "Esperar", "Detener"].map(
                    (b) => (
                      <span
                        key={b}
                        className="text-[11px] font-mono bg-gray-200 text-gray-600 px-2 py-1 rounded-md border border-gray-300"
                      >
                        {b}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-600 font-medium">
                  Misiones ({completedBasicMissions}/{LEVEL_0_STAGES.length})
                </p>
                {LEVEL_0_STAGES.map((stage) => {
                  const unlocked = stage.id <= unlockedBasicMission;
                  const completed = stage.id < unlockedBasicMission;
                  const inProgress = stage.id === unlockedBasicMission;
                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-300 last:border-0"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          completed
                            ? "bg-emerald-400/15 text-emerald-600"
                            : inProgress
                            ? "bg-amber-400/15 text-amber-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {completed ? (
                          <CheckCircle size={12} weight="fill" />
                        ) : inProgress ? (
                          <Clock size={12} weight="fill" />
                        ) : (
                          <Lock size={11} weight="fill" />
                        )}
                      </span>
                      <span className={`text-sm ${unlocked ? "text-gray-700" : "text-gray-500"}`}>
                        {stage.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                href={`/levels/1/editor?mission=${unlockedBasicMission}`}
                className="btn-press mt-auto flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-cyan-700 transition-colors"
              >
                {completedBasicMissions === 0 ? "Comenzar Nivel 0" : "Continuar mision"}
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </motion.div>

          {/* Nivel 1 */}
          <motion.div variants={fadeUp} className="flex flex-col">
            <div className="card-hover bg-violet-50 border border-violet-200 rounded-2xl p-7 flex flex-col gap-6 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violet-600/10 border border-violet-400/20 flex items-center justify-center">
                    <Cpu size={20} weight="duotone" className="text-violet-600" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-violet-600 uppercase tracking-wider">
                      Nivel 1
                    </span>
                    <h2 className="text-xl font-bold text-gray-800">Intermedio</h2>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-400/10 px-2.5 py-1 rounded-full">
                  <CheckCircle size={11} weight="fill" />
                  Disponible
                </span>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Condicionales y bucles. El robot detecta el entorno internamente, pero aquí tú
                programas una sola estructura if/else para reaccionar frente a obstáculos,
                caminos libres y desvíos.
              </p>

              <div>
                <p className="text-xs text-gray-600 mb-3 font-medium">Lo que aprenderás</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Usar if/else",
                    "Aprovechar caminos libres",
                    "Encadenar decisiones",
                    "Repetir rutas con bucles",
                  ].map(
                    (item) => (
                      <span
                        key={item}
                        className="text-[11px] font-mono bg-violet-100 text-violet-700 px-2 py-1 rounded-md border border-violet-200"
                      >
                        {item}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-600 font-medium">
                  Misiones ({completedIntermediateMissions}/{LEVEL_2_STAGES.length})
                </p>
                {LEVEL_2_STAGES.map((stage) => {
                  const unlocked = stage.id <= unlockedIntermediateMission;

                  return (
                    <div
                      key={stage.id}
                      className="flex items-center gap-3 py-2 border-b border-gray-300/50 last:border-0"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          unlocked
                            ? "bg-violet-400/15 text-violet-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {unlocked ? (
                          <CheckCircle size={11} weight="fill" />
                        ) : (
                          <Lock size={11} weight="fill" />
                        )}
                      </span>
                      <span className={`text-sm ${unlocked ? "text-gray-700" : "text-gray-500"}`}>
                        {stage.title}
                      </span>
                    </div>
                  );
                })}
              </div>

              <Link
                href="/levels/2/mission"
                className="btn-press mt-auto flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-violet-700 transition-colors"
              >
                Comenzar nivel
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

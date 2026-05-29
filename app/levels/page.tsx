"use client";
import { motion } from "motion/react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ArrowRight,
  Lock,
  CheckCircle,
  Clock,
  Code,
  Cpu,
  CaretRight,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const stagger = { visible: { transition: { staggerChildren: 0.1 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: EASE_OUT } },
};

export default function LevelsPage() {
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
          {/* Nivel 1 */}
          <motion.div variants={fadeUp} className="flex flex-col">
            <div className="card-hover bg-gray-100 border border-gray-300 rounded-2xl p-7 flex flex-col gap-6 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-600/10 border border-cyan-400/20 flex items-center justify-center">
                    <Code size={20} weight="duotone" className="text-cyan-600" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                      Nivel 1
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
                <p className="text-xs text-gray-600 font-medium">Misiones (2/5)</p>
                {["Movimiento basico", "Giro y avance", "Secuencia larga", "Laberinto simple", "Reto final"].map(
                  (m, i) => (
                    <div
                      key={m}
                      className="flex items-center gap-3 py-2 border-b border-gray-300 last:border-0"
                    >
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                          i < 2
                            ? "bg-emerald-400/15 text-emerald-600"
                            : i === 2
                            ? "bg-amber-400/15 text-amber-600"
                            : "bg-gray-200 text-gray-400"
                        }`}
                      >
                        {i < 2 ? (
                          <CheckCircle size={12} weight="fill" />
                        ) : i === 2 ? (
                          <Clock size={12} weight="fill" />
                        ) : (
                          <Lock size={11} weight="fill" />
                        )}
                      </span>
                      <span
                        className={`text-sm ${i <= 2 ? "text-gray-700" : "text-gray-500"}`}
                      >
                        {m}
                      </span>
                    </div>
                  )
                )}
              </div>

              <Link
                href="/levels/1/mission"
                className="btn-press mt-auto flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold text-sm py-3 rounded-xl hover:bg-cyan-700 transition-colors"
              >
                Continuar mision
                <ArrowRight size={15} weight="bold" />
              </Link>
            </div>
          </motion.div>

          {/* Nivel 2 */}
          <motion.div variants={fadeUp} className="flex flex-col">
            <div className="bg-gray-100/30 border border-gray-300 rounded-2xl p-7 flex flex-col gap-6 h-full">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200 border border-gray-300 flex items-center justify-center">
                    <Cpu size={20} weight="duotone" className="text-gray-500" />
                  </div>
                  <div>
                    <span className="text-xs font-mono text-gray-500 uppercase tracking-wider">
                      Nivel 2
                    </span>
                    <h2 className="text-xl font-bold text-gray-500">Intermedio</h2>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs font-mono text-gray-500 bg-gray-200 px-2.5 py-1 rounded-full">
                  <Lock size={11} weight="fill" />
                  Bloqueado
                </span>
              </div>

              <p className="text-sm text-gray-500 leading-relaxed">
                Sensores y condicionales. El robot usa datos de proximidad para
                tomar decisiones. Requiere completar el Nivel 1.
              </p>

              <div>
                <p className="text-xs text-gray-500 mb-3 font-medium">Bloques disponibles</p>
                <div className="flex flex-wrap gap-2">
                  {["Sensor frontal", "Sensor izquierdo", "Sensor derecho", "Si obstaculo", "Mientras no meta", "Repetir"].map(
                    (b) => (
                      <span
                        key={b}
                        className="text-[11px] font-mono bg-gray-100 text-gray-500 px-2 py-1 rounded-md border border-gray-200"
                      >
                        {b}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <p className="text-xs text-gray-500 font-medium">Misiones (0/5)</p>
                {["Primer sensor", "Evasion simple", "Laberinto con sensores", "Decision multiple", "Reto avanzado"].map(
                  (m) => (
                    <div
                      key={m}
                      className="flex items-center gap-3 py-2 border-b border-gray-300/50 last:border-0"
                    >
                      <span className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center flex-shrink-0">
                        <Lock size={11} weight="fill" />
                      </span>
                      <span className="text-sm text-gray-500">{m}</span>
                    </div>
                  )
                )}
              </div>

              <div className="mt-auto flex items-center gap-2.5 bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
                <Lock size={15} />
                Completa el Nivel 1 para desbloquear
              </div>
            </div>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

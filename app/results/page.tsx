"use client";
import { motion } from "motion/react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Trophy, CheckCircle, ArrowRight, ArrowCounterClockwise,
  HouseSimple, Clock, ListChecks, Star, XCircle, Warning,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

export default function ResultsPage() {
  const result = {
    success: true,
    level: 0,
    levelName: "Basico",
    mission: "Movimiento basico",
    time: "00:48",
    attempts: 2,
    score: 85,
    blocksUsed: 7,
    feedback: "Excelente trabajo. El robot completo la mision sin colisiones.",
  };

  const stars = result.score >= 90 ? 3 : result.score >= 70 ? 2 : 1;

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-sm mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          {/* Result header */}
          <div className={`relative overflow-hidden rounded-2xl p-8 mb-6 text-center ${
            result.success
              ? "bg-emerald-50 border border-emerald-300"
              : "bg-red-50 border border-red-300"
          }`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: result.success ? "radial-gradient(circle at 50% 0%, #4ade80, transparent 70%)" : "radial-gradient(circle at 50% 0%, #f87171, transparent 70%)" }}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              result.success ? "bg-emerald-100" : "bg-red-100"
            }`}>
              {result.success ? (
                <CheckCircle size={36} weight="fill" className="text-emerald-600" />
              ) : (
                <XCircle size={36} weight="fill" className="text-red-600" />
              )}
            </div>

            <p className={`text-lg font-bold ${result.success ? "text-emerald-700" : "text-red-700"}`}>
              {result.success ? "Mision completada" : "Mision fallida"}
            </p>
            <p className="text-sm text-gray-600 mt-1">{result.feedback}</p>

            {result.success && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star
                    key={i}
                    size={28}
                    weight={i < stars ? "fill" : "regular"}
                    className={i < stars ? "text-amber-500" : "text-gray-300"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats grid */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {[
              {
                label: "Nivel",
                value: `Nivel ${result.level} ${result.levelName}`,
                icon: <ListChecks size={15} className="text-cyan-600" weight="duotone" />,
              },
              {
                label: "Mision",
                value: result.mission,
                icon: <Trophy size={15} className="text-amber-600" weight="duotone" />,
              },
              {
                label: "Tiempo",
                value: result.time,
                icon: <Clock size={15} className="text-violet-600" weight="duotone" />,
                mono: true,
              },
              {
                label: "Intentos",
                value: String(result.attempts),
                icon: <ArrowCounterClockwise size={15} className="text-gray-500" weight="duotone" />,
                mono: true,
              },
              {
                label: "Puntaje",
                value: `${result.score}/100`,
                icon: <Trophy size={15} className="text-amber-500" weight="fill" />,
                mono: true,
                highlight: true,
              },
              {
                label: "Bloques usados",
                value: String(result.blocksUsed),
                icon: <ListChecks size={15} className="text-cyan-600" weight="duotone" />,
                mono: true,
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
                <p className={`text-lg font-bold ${stat.mono ? "font-mono" : ""} ${
                  stat.highlight ? "text-amber-600" : "text-gray-900"
                }`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Failure suggestion */}
          {!result.success && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <Warning size={16} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Sugerencia</p>
                <p className="text-xs text-amber-600 mt-0.5">
                  Revisa los bloques de giro antes de avanzar. Asegurate de que el robot este orientado correctamente en cada paso.
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="flex flex-col gap-3"
          >
            {result.success ? (
              <>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/levels/2/mission"
                    className="btn-press flex items-center justify-center gap-2 w-full bg-cyan-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-cyan-700 transition-colors"
                  >
                    Siguiente nivel
                    <ArrowRight size={15} weight="bold" />
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp} className="flex gap-3">
                  <Link
                    href="/levels/1/mission"
                    className="btn-press flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <ArrowCounterClockwise size={14} />
                    Repetir
                  </Link>
                  <Link
                    href="/dashboard"
                    className="btn-press flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <HouseSimple size={14} />
                    Dashboard
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/levels/1/mission"
                    className="btn-press flex items-center justify-center gap-2 w-full bg-cyan-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-cyan-700 transition-colors"
                  >
                    <ArrowCounterClockwise size={15} weight="bold" />
                    Intentar de nuevo
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/dashboard"
                    className="btn-press flex items-center justify-center gap-2 w-full text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 hover:text-gray-800 transition-colors"
                  >
                    <HouseSimple size={14} />
                    Volver al dashboard
                  </Link>
                </motion.div>
              </>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}

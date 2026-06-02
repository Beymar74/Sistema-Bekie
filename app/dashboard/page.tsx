"use client";

import { motion } from "motion/react";
import { useSyncExternalStore } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  SquaresFour,
  Trophy,
  CheckCircle,
  Clock,
  ArrowRight,
  Flame,
  Target,
  Repeat,
} from "@phosphor-icons/react";
import { LEVEL_2_STAGES } from "@/lib/nivel-1";
import { LEVEL_3_STAGES } from "@/lib/nivel-2";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const stagger = { visible: { transition: { staggerChildren: 0.09 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
      <motion.div
        className="absolute inset-y-0 left-0 bg-cyan-600 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: EASE_OUT, delay: 0.3 }}
      />
    </div>
  );
}

export default function DashboardPage() {
  const userName = "Beymar";
  const level0Missions = 2;
  const totalLevel0 = 5;

  /* ── Nivel 1 progress ── */
  const unlockedLevel1 = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("storage", onChange);
      return () => window.removeEventListener("storage", onChange);
    },
    () => {
      if (typeof window === "undefined") return 1;
      const stored = Number(
        window.localStorage.getItem("bekie-level-2-progress") ?? "1"
      );
      const safe = Number.isNaN(stored) ? 1 : stored;
      return Math.min(LEVEL_2_STAGES.length, Math.max(1, safe));
    },
    () => 1
  );
  const completedLevel1 = Math.max(0, unlockedLevel1 - 1);

  /* ── Nivel 2 progress ── */
  const unlockedLevel2 = useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => undefined;
      window.addEventListener("storage", onChange);
      return () => window.removeEventListener("storage", onChange);
    },
    () => {
      if (typeof window === "undefined") return 1;
      const stored = Number(
        window.localStorage.getItem("bekie-level-3-progress") ?? "1"
      );
      const safe = Number.isNaN(stored) ? 1 : stored;
      return Math.min(LEVEL_3_STAGES.length, Math.max(1, safe));
    },
    () => 1
  );
  const completedLevel2 = Math.max(0, unlockedLevel2 - 1);

  const totalMissions =
    totalLevel0 + LEVEL_2_STAGES.length + LEVEL_3_STAGES.length;
  const completedMissions = level0Missions + completedLevel1 + completedLevel2;
  const progress = Math.round((completedMissions / totalMissions) * 100);

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName={userName} role="student" />

      <main className="flex-1 max-w-screen-lg mx-auto w-full px-5 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
          className="mb-10"
        >
          <p className="text-sm text-gray-600 font-mono">Bienvenido de nuevo</p>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-0.5">
            Hola, {userName}
          </h1>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {[
            {
              icon: <Target size={18} weight="duotone" className="text-cyan-600" />,
              label: "Progreso general",
              value: `${progress}%`,
              sub: `${completedMissions}/${totalMissions} misiones`,
              accent: "cyan",
            },
            {
              icon: (
                <CheckCircle
                  size={18}
                  weight="duotone"
                  className="text-emerald-600"
                />
              ),
              label: "Misiones completadas",
              value: `${completedMissions}/${totalMissions}`,
              sub: "Entre los 3 niveles",
              accent: "emerald",
            },
            {
              icon: <Flame size={18} weight="duotone" className="text-amber-600" />,
              label: "Racha actual",
              value: "3 dias",
              sub: "Sigue asi",
              accent: "amber",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              className="bg-gray-100 border border-gray-300 rounded-xl p-5"
            >
              <div className="flex items-center gap-2 mb-3">
                {stat.icon}
                <span className="text-xs text-gray-600">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold font-mono text-gray-800">
                {stat.value}
              </p>
              <p className="text-xs text-gray-600 mt-0.5">{stat.sub}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Global progress bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-100 border border-gray-300 rounded-xl p-5 mb-8"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Progreso del curso
            </span>
            <span className="text-sm font-mono font-bold text-cyan-600">
              {progress}%
            </span>
          </div>
          <ProgressBar value={progress} />
          <p className="text-xs text-gray-600 mt-2.5">
            Completaste {completedMissions} de {totalMissions} misiones en los 3
            niveles
          </p>
        </motion.div>

        {/* Level cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          {/* Nivel 0 */}
          <motion.div
            variants={fadeUp}
            className="card-hover bg-gray-100 border border-gray-300 rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                  Nivel 0
                </span>
                <h3 className="mt-0.5 text-lg font-bold text-gray-800">Basico</h3>
                <p className="mt-1 text-xs text-gray-600">
                  Programacion secuencial
                </p>
              </div>
              <span className="text-xs font-mono text-amber-600 bg-amber-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Clock size={11} weight="fill" />
                En progreso
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Misiones</span>
                <span className="font-mono">
                  {level0Missions}/{totalLevel0}
                </span>
              </div>
              <ProgressBar value={(level0Missions / totalLevel0) * 100} />
            </div>
            <div className="flex gap-2 mt-auto">
              <Link
                href="/levels/1/mission"
                className="btn-press flex-1 flex items-center justify-center gap-2 bg-cyan-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700 transition-colors"
              >
                Continuar
                <ArrowRight size={14} weight="bold" />
              </Link>
              <Link
                href="/levels"
                className="btn-press px-4 flex items-center justify-center text-sm text-gray-600 border border-zinc-700 rounded-lg hover:border-gray-400 hover:text-gray-700 transition-colors"
              >
                <SquaresFour size={16} />
              </Link>
            </div>
          </motion.div>

          {/* Nivel 1 */}
          <motion.div
            variants={fadeUp}
            className="bg-violet-50 border border-violet-200 rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-violet-600 uppercase tracking-wider">
                  Nivel 1
                </span>
                <h3 className="mt-0.5 text-lg font-bold text-gray-800">
                  Intermedio
                </h3>
                <p className="mt-1 text-xs text-gray-600">
                  Sensores y condicionales
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={11} weight="fill" />
                Disponible
              </span>
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Misiones</span>
                <span className="font-mono">
                  {completedLevel1}/{LEVEL_2_STAGES.length}
                </span>
              </div>
              <ProgressBar
                value={(completedLevel1 / LEVEL_2_STAGES.length) * 100}
              />
            </div>
            <Link
              href="/levels/2/mission"
              className="btn-press mt-auto flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-violet-700 transition-colors"
            >
              {completedLevel1 > 0 ? "Continuar" : "Ir al Nivel 1"}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>

          {/* Nivel 2 */}
          <motion.div
            variants={fadeUp}
            className="bg-indigo-50 border border-indigo-200 rounded-xl p-6 flex flex-col gap-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-mono text-indigo-600 uppercase tracking-wider">
                  Nivel 2
                </span>
                <h3 className="mt-0.5 text-lg font-bold text-gray-800">
                  Avanzado
                </h3>
                <p className="mt-1 text-xs text-gray-600">While + For</p>
              </div>
              <span className="text-xs font-mono text-emerald-600 bg-emerald-400/10 px-2.5 py-1 rounded-full flex items-center gap-1">
                <CheckCircle size={11} weight="fill" />
                Disponible
              </span>
            </div>
            <p className="text-xs text-gray-600 flex-1">
              Aprende a usar bucles avanzados: For para repetir acciones fijas y
              While para evadir obstaculos automaticamente.
            </p>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-2">
                <span>Misiones</span>
                <span className="font-mono">
                  {completedLevel2}/{LEVEL_3_STAGES.length}
                </span>
              </div>
              <ProgressBar
                value={(completedLevel2 / LEVEL_3_STAGES.length) * 100}
              />
            </div>
            <Link
              href="/levels/3/mission"
              className="btn-press mt-auto flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {completedLevel2 > 0 ? "Continuar" : "Ir al Nivel 2"}
              <ArrowRight size={14} weight="bold" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Last missions */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.45, ease: EASE_OUT }}
          className="bg-gray-100 border border-gray-300 rounded-xl p-5"
        >
          <h2 className="text-sm font-semibold text-gray-700 mb-4">
            Ultimas misiones
          </h2>
          <div className="flex flex-col gap-3">
            {[
              {
                name: "Movimiento basico",
                level: 0,
                status: "Completado",
                time: "00:48",
                score: 85,
              },
              {
                name: "Giro y avance",
                level: 0,
                status: "Completado",
                time: "01:12",
                score: 72,
              },
              {
                name: "Secuencia larga",
                level: 0,
                status: "En progreso",
                time: "--:--",
                score: null,
              },
            ].map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-2.5 border-b border-gray-300 last:border-0"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${
                      m.status === "Completado"
                        ? "bg-emerald-400/10"
                        : "bg-amber-400/10"
                    }`}
                  >
                    {m.status === "Completado" ? (
                      <CheckCircle
                        size={14}
                        weight="fill"
                        className="text-emerald-600"
                      />
                    ) : (
                      <Clock size={14} weight="fill" className="text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">{m.name}</p>
                    <p className="text-xs text-gray-600">Nivel {m.level}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right">
                  {m.score && (
                    <div className="hidden sm:flex items-center gap-1 text-xs font-mono text-amber-600">
                      <Trophy size={11} weight="fill" />
                      {m.score}/100
                    </div>
                  )}
                  <span className="text-xs font-mono text-gray-600">{m.time}</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </main>
    </div>
  );
}
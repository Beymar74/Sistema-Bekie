"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  Trophy, CheckCircle, ArrowRight, ArrowCounterClockwise,
  HouseSimple, Star, XCircle, Warning, Timer, Hash,
} from "@phosphor-icons/react";
import { LEVEL_3_STAGES } from "@/lib/nivel-2";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
const stagger = { visible: { transition: { staggerChildren: 0.08 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: EASE_OUT } },
};

interface ResultData {
  mission: number;
  success: boolean;
  blocks: number;
  attempts: number;
  time: string;
  stageTitle: string;
  stageDifficulty: string;
  stageVictory: string;
  stageTip: string;
  isLast: boolean;
}

export default function Results2Page() {
  const [result, setResult] = useState<ResultData | null>(null);

  useEffect(() => {
    const raw = window.localStorage.getItem("bekie-result-3");
    if (raw) {
      try {
        setResult(JSON.parse(raw));
      } catch {
        setResult(null);
      }
    }
  }, []);

  if (!result) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col">
        <AppNav userName="Beymar" role="student" />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm mb-4">No hay resultados disponibles.</p>
            <Link href="/levels/3/mission" className="text-indigo-600 text-sm underline">
              Volver a misiones
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const { mission, success, blocks, attempts, time, stageTitle, stageDifficulty, stageVictory, stageTip, isLast } = result;
  const nextMission = mission + 1;

  // Score: base 100, -5 por intento extra, -3 por cada bloque sobre el mínimo (4)
  const score = success
    ? Math.max(50, Math.min(100, 100 - (attempts - 1) * 5 - Math.max(0, blocks - 4) * 3))
    : 0;
  const stars = score >= 90 ? 3 : score >= 70 ? 2 : 1;

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-sm mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.55, ease: EASE_OUT }}
        >
          {/* Header */}
          <div className={`relative overflow-hidden rounded-2xl p-8 mb-6 text-center ${
            success ? "bg-emerald-50 border border-emerald-300" : "bg-red-50 border border-red-300"
          }`}>
            <div className="absolute inset-0 opacity-10 pointer-events-none"
              style={{ background: success
                ? "radial-gradient(circle at 50% 0%, #818cf8, transparent 70%)"
                : "radial-gradient(circle at 50% 0%, #f87171, transparent 70%)" }}
            />
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
              success ? "bg-indigo-100" : "bg-red-100"
            }`}>
              {success
                ? <CheckCircle size={36} weight="fill" className="text-indigo-600" />
                : <XCircle size={36} weight="fill" className="text-red-600" />}
            </div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-indigo-400 mb-1">
              Nivel 2 — Avanzado / Misión {mission}/{LEVEL_3_STAGES.length}
            </p>
            <p className={`text-xl font-bold ${success ? "text-indigo-700" : "text-red-700"}`}>
              {success ? "¡Misión completada!" : "Misión fallida"}
            </p>
            <p className="text-sm font-semibold text-gray-800 mt-1">{stageTitle}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stageDifficulty}</p>

            {success && (
              <div className="flex items-center justify-center gap-1 mt-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Star key={i} size={28}
                    weight={i < stars ? "fill" : "regular"}
                    className={i < stars ? "text-amber-500" : "text-gray-300"}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {[
              {
                label: "Puntaje",
                value: success ? `${score} / 100` : "0 / 100",
                icon: <Trophy size={15} className="text-amber-500" weight="fill" />,
                highlight: true,
              },
              {
                label: "Tiempo",
                value: time,
                icon: <Timer size={15} className="text-violet-600" weight="duotone" />,
              },
              {
                label: "Intentos",
                value: String(attempts),
                icon: <ArrowCounterClockwise size={15} className="text-gray-500" weight="duotone" />,
              },
              {
                label: "Bloques usados",
                value: String(blocks),
                icon: <Hash size={15} className="text-indigo-500" weight="duotone" />,
              },
            ].map((stat) => (
              <motion.div key={stat.label} variants={fadeUp}
                className="bg-white border border-gray-200 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  {stat.icon}
                  <span className="text-xs text-gray-500">{stat.label}</span>
                </div>
                <p className={`text-xl font-bold font-mono ${stat.highlight ? "text-amber-600" : "text-gray-900"}`}>
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </motion.div>

          {/* Victory / tip */}
          {success && stageVictory && (
            <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
              <p className="text-[10px] font-mono text-indigo-500 uppercase tracking-wider mb-1">Condición de victoria</p>
              <p className="text-sm text-indigo-800">{stageVictory}</p>
            </div>
          )}
          {!success && stageTip && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-start gap-3">
              <Warning size={16} weight="fill" className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-700">Sugerencia</p>
                <p className="text-xs text-amber-600 mt-0.5">{stageTip}</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-3">
            {success ? (
              <>
                <motion.div variants={fadeUp}>
                  {isLast ? (
                    <Link href="/levels"
                      className="btn-press flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      <Trophy size={15} weight="fill" />
                      Nivel 2 completado — Ver niveles
                    </Link>
                  ) : (
                    <Link href={`/levels/3/editor?mission=${nextMission}`}
                      className="btn-press flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Siguiente misión
                      <ArrowRight size={15} weight="bold" />
                    </Link>
                  )}
                </motion.div>
                <motion.div variants={fadeUp} className="flex gap-3">
                  <Link href={`/levels/3/editor?mission=${mission}`}
                    className="btn-press flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 transition-colors"
                  >
                    <ArrowCounterClockwise size={14} />
                    Repetir
                  </Link>
                  <Link href="/levels/3/mission"
                    className="btn-press flex-1 flex items-center justify-center gap-2 text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 transition-colors"
                  >
                    <HouseSimple size={14} />
                    Misiones
                  </Link>
                </motion.div>
              </>
            ) : (
              <>
                <motion.div variants={fadeUp}>
                  <Link href={`/levels/3/editor?mission=${mission}`}
                    className="btn-press flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                    <ArrowCounterClockwise size={15} weight="bold" />
                    Intentar de nuevo
                  </Link>
                </motion.div>
                <motion.div variants={fadeUp}>
                  <Link href="/levels/3/mission"
                    className="btn-press flex items-center justify-center gap-2 w-full text-sm text-gray-600 border border-gray-300 py-3 rounded-xl hover:border-gray-400 transition-colors"
                  >
                    <HouseSimple size={14} />
                    Volver a misiones
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
"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion } from "motion/react";
import AppNav from "@/components/AppNav";
import { ArrowLeft, ArrowRight, ListChecks, Target, Trophy } from "@phosphor-icons/react";
import { LEVEL_MISSIONS as BASIC_LEVEL_MISSIONS, type LevelKey } from "@/lib/levels";
import { LEVEL_2_STAGES, LEVEL_MISSIONS as INTERMEDIATE_LEVEL_MISSIONS } from "@/lib/nivel-1";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
export default function MissionPage() {
  const params = useParams();
  const levelKey = ((params.level as string) || "1") as LevelKey;
  const isIntermediate = levelKey === "2";
  const mission = isIntermediate
    ? INTERMEDIATE_LEVEL_MISSIONS["2"]
    : BASIC_LEVEL_MISSIONS["1"];
  const isViolet = mission.accent === "violet";
  const unlockedMission = useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => undefined;

      window.addEventListener("storage", onStoreChange);
      return () => window.removeEventListener("storage", onStoreChange);
    },
    () => {
      if (!isIntermediate || typeof window === "undefined") return 1;

      const stored = Number(window.localStorage.getItem("bekie-level-2-progress") ?? "1");
      const safeValue = Number.isNaN(stored) ? 1 : stored;
      return Math.min(LEVEL_2_STAGES.length, Math.max(1, safeValue));
    },
    () => 1
  );

  if (isIntermediate) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col">
        <AppNav userName="Beymar" role="student" />

        <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT }}
          >
            <Link
              href="/levels"
              className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors mb-7"
            >
              <ArrowLeft size={13} />
              Volver a niveles
            </Link>

            <div className="p-7 rounded-2xl border mb-6 bg-violet-400/5 border-violet-400/15">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-violet-600">{mission.icon}</span>
                    <span className="text-xs font-mono uppercase tracking-wider text-violet-600">
                      {mission.level} - {mission.levelSlug}
                    </span>
                  </div>
                  <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                    {mission.title}
                  </h1>
                  <p className="mt-2 text-sm text-gray-600 max-w-2xl leading-relaxed">
                    {mission.objective}
                  </p>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full flex-shrink-0 bg-violet-400/10 text-violet-600">
                  {mission.badge}
                </span>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="flex flex-col gap-5">
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Target size={16} weight="duotone" className="text-amber-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Progreso del nivel</h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">
                    El nivel se desbloquea paso a paso. La primera mision es la mas simple y las
                    siguientes van aumentando la dificultad.
                  </p>
                  <div className="mb-4 flex items-center justify-between text-xs font-mono text-gray-500">
                    <span>Misiones desbloqueadas</span>
                    <span>
                      {unlockedMission}/{LEVEL_2_STAGES.length}
                    </span>
                  </div>
                  <div className="grid gap-3">
                    {LEVEL_2_STAGES.map((stage) => {
                      const unlocked = stage.id <= unlockedMission;
                      return (
                        <div
                          key={stage.id}
                          className={`rounded-xl border p-4 ${
                            unlocked
                              ? "border-violet-300 bg-violet-50"
                              : "border-gray-200 bg-white"
                          }`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="text-xs font-mono px-2 py-1 rounded-full bg-gray-100 text-gray-600 border border-gray-200">
                                  Mision {stage.id}/5
                                </span>
                                <span
                                  className={`text-xs font-mono px-2 py-1 rounded-full border ${
                                    unlocked
                                      ? "border-violet-200 bg-violet-100 text-violet-700"
                                      : "border-gray-200 bg-gray-100 text-gray-500"
                                  }`}
                                >
                                  {stage.difficulty}
                                </span>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900">{stage.title}</h3>
                              <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                                {stage.summary}
                              </p>
                              <div className="mt-3 rounded-xl border border-violet-200 bg-white/80 p-3">
                                <p className="text-[10px] font-mono uppercase tracking-wider text-violet-600 mb-2">
                                  Lo que aprenderás
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {stage.learningOutcomes.map((item) => (
                                    <span
                                      key={`${stage.id}-${item}`}
                                      className="text-[10px] font-mono bg-violet-50 text-violet-700 px-2.5 py-1 rounded-md border border-violet-200"
                                    >
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>
                            {unlocked ? (
                              <Link
                                href={`/levels/${levelKey}/editor?mission=${stage.id}`}
                                className="btn-press inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-violet-700 transition-colors"
                              >
                                {stage.id === 1 ? "Abrir tutorial" : "Abrir mision"}
                                <ArrowRight size={16} weight="bold" />
                              </Link>
                            ) : (
                              <span className="inline-flex items-center justify-center gap-2 bg-gray-200 text-gray-400 font-bold text-sm px-4 py-2.5 rounded-xl cursor-not-allowed">
                                Bloqueada
                              </span>
                            )}
                          </div>
                          {!unlocked && (
                            <p className="mt-3 text-[11px] text-gray-500">
                              Se desbloquea despues de completar la mision anterior.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks size={16} weight="duotone" className="text-cyan-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Lo que aprenderás</h2>
                  </div>
                  <ul className="flex flex-col gap-2">
                    {mission.learningOutcomes.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                        <span className="text-gray-500 mt-0.5">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} weight="duotone" className="text-emerald-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Objetivo general</h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{mission.objective}</p>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <ListChecks size={16} weight="duotone" className="text-cyan-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Instrucciones</h2>
                  </div>
                  <ol className="flex flex-col gap-2">
                    {mission.instructions.map((inst, i) => (
                      <li key={inst} className="flex items-start gap-3 text-sm text-gray-600">
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-mono font-bold mt-0.5">
                          {i + 1}
                        </span>
                        {inst}
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Trophy size={16} weight="duotone" className="text-emerald-600" />
                    <h2 className="text-sm font-semibold text-gray-700">Condicion de victoria</h2>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{mission.victory}</p>
                </div>

                <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
                  <p className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wide">
                    Consejos
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {mission.tips.map((tip) => (
                      <li key={tip} className="text-xs text-gray-600 flex items-start gap-2">
                        <span className="text-gray-500 mt-0.5">-</span>
                        {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <Link
              href={`/levels/${levelKey}/editor?mission=1`}
              className="btn-press mt-8 flex items-center justify-center gap-2 w-full bg-violet-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-violet-700 transition-colors"
            >
              Comenzar tutorial
              <ArrowRight size={16} weight="bold" />
            </Link>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-md mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          <Link
            href="/levels"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors mb-7"
          >
            <ArrowLeft size={13} />
            Volver a niveles
          </Link>

          <div
            className={`p-7 rounded-2xl border mb-6 ${
              isViolet
                ? "bg-violet-400/5 border-violet-400/15"
                : "bg-cyan-600/5 border-cyan-400/15"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={isViolet ? "text-violet-600" : "text-cyan-600"}>
                    {mission.icon}
                  </span>
                  <span
                    className={`text-xs font-mono uppercase tracking-wider ${
                      isViolet ? "text-violet-600" : "text-cyan-600"
                    }`}
                  >
                    {mission.level} - {mission.levelSlug}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                  {mission.title}
                </h1>
              </div>
              <span
                className={`text-xs font-mono px-2.5 py-1 rounded-full flex-shrink-0 ${
                  isViolet
                    ? "bg-violet-400/10 text-violet-600"
                    : "bg-cyan-600/10 text-cyan-600"
                }`}
              >
                {mission.badge}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-5">
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} weight="duotone" className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-700">Objetivo</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {mission.objective}
              </p>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={16} weight="duotone" className="text-cyan-600" />
                <h2 className="text-sm font-semibold text-gray-700">Instrucciones</h2>
              </div>
              <ol className="flex flex-col gap-2">
                {mission.instructions.map((inst, i) => (
                  <li key={inst} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-mono font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {inst}
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Trophy size={16} weight="duotone" className="text-emerald-600" />
                <h2 className="text-sm font-semibold text-gray-700">Condicion de victoria</h2>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {mission.victory}
              </p>
            </div>

            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <ListChecks size={16} weight="duotone" className="text-cyan-600" />
                <h2 className="text-sm font-semibold text-gray-700">Lo que aprenderás</h2>
              </div>
              <ul className="flex flex-col gap-2">
                {mission.learningOutcomes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="text-gray-500 mt-0.5">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wide">
                Consejos
              </p>
              <ul className="flex flex-col gap-1.5">
                {mission.tips.map((tip) => (
                  <li key={tip} className="text-xs text-gray-600 flex items-start gap-2">
                    <span className="text-gray-500 mt-0.5">-</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <Link
            href={`/levels/${levelKey}/editor`}
            className="btn-press mt-8 flex items-center justify-center gap-2 w-full bg-cyan-600 text-white font-bold text-sm py-3.5 rounded-xl hover:bg-cyan-700 transition-colors"
          >
            Comenzar programacion
            <ArrowRight size={16} weight="bold" />
          </Link>
        </motion.div>
      </main>
    </div>
  );
}

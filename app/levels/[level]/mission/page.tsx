"use client";
import { motion } from "motion/react";
import Link from "next/link";
import { useParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import { ArrowRight, Target, ListChecks, Trophy, ArrowLeft, Code, Cpu } from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const MISSIONS = {
  "1": {
    level: "Nivel 1",
    levelSlug: "Basico",
    title: "Movimiento basico",
    badge: "Secuencial",
    icon: <Code size={24} weight="duotone" />,
    accent: "cyan",
    objective: "Lleva el robot desde el punto A hasta el punto B usando bloques de movimiento.",
    instructions: [
      "Selecciona los bloques del panel izquierdo.",
      "Armalos en orden en el area central de programacion.",
      "Presiona Probar simulacion para verificar tu logica.",
      "Si la simulacion es exitosa, envia el programa al robot fisico.",
    ],
    victory: "El robot debe llegar al punto B sin chocar con ningun obstaculo.",
    blocks: ["Avanzar", "Retroceder", "Girar izquierda", "Girar derecha", "Esperar", "Detener"],
    tips: [
      "El robot empieza mirando hacia la derecha.",
      "Cada Avanzar mueve el robot una celda.",
      "Girar no desplaza al robot, solo cambia su direccion.",
    ],
  },
  "2": {
    level: "Nivel 2",
    levelSlug: "Intermedio",
    title: "Evadir obstaculos",
    badge: "Sensores",
    icon: <Cpu size={24} weight="duotone" />,
    accent: "violet",
    objective: "Programa al robot para avanzar en un escenario con obstaculos y evitarlos usando sensores de proximidad.",
    instructions: [
      "Usa bloques de lectura de sensores para detectar obstaculos.",
      "Usa condicionales (Si hay obstaculo) para tomar decisiones.",
      "Combina bucles con condiciones de avance para navegar el laberinto.",
      "El simulador valida colisiones en tiempo real.",
    ],
    victory: "El robot debe llegar a la meta sin colisionar con ninguna pared o bloque.",
    blocks: ["Sensor frontal", "Sensor izquierdo", "Sensor derecho", "Si obstaculo", "Sino", "Mientras no meta", "Repetir"],
    tips: [
      "El sensor retorna la distancia en centimetros.",
      "Un obstaculo a menos de 20 cm activa el condicional.",
      "Combina bucles con sensores para evasion automatica.",
    ],
  },
};

export default function MissionPage() {
  const params = useParams();
  const levelKey = (params.level as string) || "1";
  const mission = MISSIONS[levelKey as keyof typeof MISSIONS] || MISSIONS["1"];
  const isViolet = mission.accent === "violet";

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-md mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        >
          {/* Back */}
          <Link
            href="/levels"
            className="inline-flex items-center gap-1.5 text-xs text-gray-600 hover:text-gray-700 transition-colors mb-7"
          >
            <ArrowLeft size={13} />
            Volver a niveles
          </Link>

          {/* Header card */}
          <div className={`p-7 rounded-2xl border mb-6 ${isViolet ? "bg-violet-400/5 border-violet-400/15" : "bg-cyan-600/5 border-cyan-400/15"}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`${isViolet ? "text-violet-600" : "text-cyan-600"}`}>
                    {mission.icon}
                  </span>
                  <span className={`text-xs font-mono uppercase tracking-wider ${isViolet ? "text-violet-600" : "text-cyan-600"}`}>
                    {mission.level} - {mission.levelSlug}
                  </span>
                </div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">{mission.title}</h1>
              </div>
              <span className={`text-xs font-mono px-2.5 py-1 rounded-full flex-shrink-0 ${
                isViolet ? "bg-violet-400/10 text-violet-600" : "bg-cyan-600/10 text-cyan-600"
              }`}>
                {mission.badge}
              </span>
            </div>
          </div>

          {/* Sections */}
          <div className="flex flex-col gap-5">
            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={16} weight="duotone" className="text-amber-600" />
                <h2 className="text-sm font-semibold text-gray-700">Objetivo</h2>
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
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
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

            <div className="bg-gray-100 border border-gray-300 rounded-xl p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Bloques disponibles</h2>
              <div className="flex flex-wrap gap-2">
                {mission.blocks.map((b) => (
                  <span key={b} className="text-xs font-mono bg-gray-200 text-gray-600 px-2.5 py-1 rounded-md border border-gray-300">
                    {b}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-gray-100 border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-600 font-medium mb-2 uppercase tracking-wide">Consejos</p>
              <ul className="flex flex-col gap-1.5">
                {mission.tips.map((tip, i) => (
                  <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
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

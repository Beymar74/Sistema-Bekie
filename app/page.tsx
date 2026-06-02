"use client";
import { motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/Navbar";
import {
  ArrowRight,
  Code,
  Cpu,
  Play,
  CheckCircle,
  WifiHigh,
  GraduationCap,
  Sparkle,
  CaretRight,
  Repeat,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 18, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.55, ease: EASE_OUT },
  },
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

/* ── Mini simulator preview ── */
const PREVIEW_GRID = [
  [2, 0, 0, 0, 0, 0],
  [0, 0, 1, 0, 0, 0],
  [0, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 3],
];

const ROBOT_PATH = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5],
  [1, 5], [2, 5], [3, 5], [4, 5], [5, 5],
];

function SimulatorPreview() {
  const [step, setStep] = useState(0);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(
      () => setStep((s) => (s + 1) % ROBOT_PATH.length),
      700
    );
    return () => clearInterval(id);
  }, [reduce]);

  const [robotRow, robotCol] = ROBOT_PATH[step];

  return (
    <div className="relative">
      <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-cyan-600/10 to-transparent pointer-events-none" />
      <div className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <span className="text-[11px] font-mono text-gray-500 uppercase tracking-widest">
            BEKIE Simulator
          </span>
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500/70" />
          </div>
        </div>

        <div className="p-5">
          <div
            className="grid gap-1.5 mb-4"
            style={{ gridTemplateColumns: "repeat(6, 1fr)" }}
          >
            {PREVIEW_GRID.map((row, r) =>
              row.map((cell, c) => {
                const isRobot = r === robotRow && c === robotCol;
                const isGoal = cell === 3;
                const isObstacle = cell === 1;
                const isVisited = ROBOT_PATH.slice(0, step).some(
                  ([pr, pc]) => pr === r && pc === c
                );

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`w-9 h-9 rounded-md flex items-center justify-center text-[11px] font-mono transition-colors duration-300 ${
                      isObstacle
                        ? "bg-gray-400 border border-gray-500"
                        : isGoal
                        ? "bg-emerald-100 border border-emerald-600/50"
                        : isRobot
                        ? "bg-cyan-100 border border-cyan-600/70"
                        : isVisited
                        ? "bg-gray-200/60"
                        : "bg-gray-100 border border-gray-300/50"
                    }`}
                  >
                    {isRobot && (
                      <span className="text-cyan-600 text-base">▶</span>
                    )}
                    {isGoal && !isRobot && (
                      <span className="text-emerald-600 font-bold text-[10px]">
                        META
                      </span>
                    )}
                    {isObstacle && (
                      <span className="text-gray-600 text-base">■</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          <div className="flex gap-2">
            {["Avanzar", "For N=3", "While obs"].map((label) => (
              <span
                key={label}
                className="text-[11px] font-mono bg-gray-200 text-gray-700 px-2 py-1 rounded-md border border-gray-300/60"
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 px-4 py-2.5 border-t border-gray-200 bg-gray-100">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
          <span className="text-[11px] font-mono text-gray-600">
            Ejecutando simulacion...
          </span>
        </div>
      </div>
    </div>
  );
}

/* ── Landing page ── */
export default function HomePage() {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-white">
      <Navbar />

      {/* Hero */}
      <section className="min-h-[100dvh] flex items-center pt-16">
        <div className="max-w-7xl mx-auto px-6 w-full py-20 grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          <motion.div
            className="lg:col-span-6 xl:col-span-7 flex flex-col gap-8"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-600" />
              <span className="text-sm font-mono text-gray-600 uppercase tracking-widest">
                Plataforma educativa de robotica
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tighter leading-[1.04] text-gray-900"
            >
              Aprende a programar
              <br />
              <span className="text-cyan-600">controlando</span> un
              <br />
              robot real
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="text-lg text-gray-600 leading-relaxed max-w-[52ch]"
            >
              Construye secuencias con bloques visuales, prueba en el simulador
              2D y ejecuta tu programa en hardware real. Tres niveles progresivos:
              secuencial, condicional y bucles avanzados.
            </motion.p>

            <motion.div variants={fadeUp} className="flex items-center gap-3">
              <Link
                href="/login"
                className="btn-press inline-flex items-center gap-2 bg-cyan-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-cyan-700 transition-colors duration-200"
              >
                Iniciar sesion
                <ArrowRight size={16} weight="bold" />
              </Link>
              <a
                href="#como-funciona"
                className="btn-press inline-flex items-center gap-2 text-sm text-gray-700 px-5 py-2.5 rounded-lg border border-gray-300 hover:border-gray-400 hover:text-gray-800 transition-colors duration-200"
              >
                Ver como funciona
              </a>
            </motion.div>
          </motion.div>

          <motion.div
            className="lg:col-span-6 xl:col-span-5"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE_OUT }}
          >
            <SimulatorPreview />
          </motion.div>
        </div>
      </section>

      {/* What is BEKIE */}
      <section id="que-es" className="py-28 border-t border-gray-300/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="max-w-2xl mb-16"
          >
            <h2 className="text-4xl lg:text-5xl font-bold tracking-tight text-gray-900 leading-[1.1]">
              Programa, simula
              <br />y controla hardware real
            </h2>
            <p className="mt-5 text-gray-600 leading-relaxed">
              BEKIE conecta el aprendizaje de programacion con la robotica
              fisica. Cada mision tiene una logica, una simulacion y un resultado
              real.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {[
              {
                icon: <Code size={22} weight="duotone" />,
                title: "Bloques visuales",
                desc: "Sin escribir codigo. Arrastra bloques de movimiento, condicionales y bucles para construir tu programa.",
                accent: "text-cyan-600",
                bg: "bg-cyan-600/5 border-cyan-600/10",
              },
              {
                icon: <Play size={22} weight="duotone" />,
                title: "Simulador 2D",
                desc: "Verifica que el robot llegue a la meta sin colisiones antes de enviarlo al hardware real.",
                accent: "text-emerald-600",
                bg: "bg-emerald-600/5 border-emerald-600/10",
              },
              {
                icon: <Cpu size={22} weight="duotone" />,
                title: "Robot ESP32 real",
                desc: "Ejecuta tu secuencia en un rover fisico con sensores de proximidad conectado por WiFi.",
                accent: "text-violet-600",
                bg: "bg-violet-600/5 border-violet-600/10",
              },
            ].map((item) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                className={`card-hover p-6 rounded-xl border ${item.bg}`}
              >
                <span className={item.accent}>{item.icon}</span>
                <h3 className="mt-4 text-base font-semibold text-gray-800">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600 leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* How it works */}
      <section id="como-funciona" className="py-28 bg-gray-100/30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="text-center mb-16"
          >
            <span className="text-[11px] font-mono text-gray-600 uppercase tracking-[0.2em]">
              Proceso
            </span>
            <h2 className="mt-3 text-4xl font-bold tracking-tight text-gray-900">
              Tres pasos para aprender robotica
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-6"
          >
            {[
              {
                num: "01",
                title: "Programa",
                desc: "Selecciona bloques del panel y construye tu secuencia de instrucciones para el robot.",
                icon: <Code size={28} weight="duotone" className="text-cyan-600" />,
              },
              {
                num: "02",
                title: "Simula",
                desc: "Ejecuta el programa en el entorno 2D. Si hay colisiones, el sistema te muestra donde fallo.",
                icon: <Play size={28} weight="duotone" className="text-emerald-600" />,
              },
              {
                num: "03",
                title: "Ejecuta",
                desc: "Con la simulacion aprobada, envia el codigo al robot fisico y observa el resultado en tiempo real.",
                icon: <Cpu size={28} weight="duotone" className="text-violet-600" />,
              },
            ].map((step, i) => (
              <motion.div key={step.num} variants={fadeUp} className="relative">
                {i < 2 && (
                  <div className="hidden md:block absolute top-8 left-[calc(100%+12px)] w-8">
                    <CaretRight size={20} className="text-zinc-700" weight="bold" />
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    <span className="text-4xl font-black font-mono text-zinc-800 leading-none select-none">
                      {step.num}
                    </span>
                    <div className="w-px h-10 bg-zinc-800" />
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed max-w-[36ch]">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Levels – now 3 */}
      <section id="niveles" className="py-28">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
            className="mb-12"
          >
            <h2 className="text-4xl font-bold tracking-tight text-gray-900">
              Tres niveles de aprendizaje
            </h2>
            <p className="mt-3 text-gray-600">
              De lo secuencial a bucles avanzados, paso a paso.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {/* Nivel 0 */}
            <motion.div
              variants={fadeUp}
              className="card-hover relative p-7 rounded-2xl border border-gray-300/60 bg-gray-100/60 flex flex-col gap-6"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
                      Nivel 0
                    </span>
                    <h3 className="mt-1 text-2xl font-bold text-gray-800">
                      Basico
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-600/10 px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} weight="fill" />
                    Disponible
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  Programacion secuencial. Guia al robot desde el punto A hasta
                  el B usando bloques de movimiento simples.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  "Avanzar, retroceder, girar",
                  "Simulador 2D sin obstaculos",
                  "Envio al robot fisico",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <ArrowRight
                      size={13}
                      className="text-cyan-600 flex-shrink-0"
                    />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/login"
                className="btn-press mt-auto inline-flex items-center gap-2 bg-cyan-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-cyan-700 transition-colors duration-200 w-fit"
              >
                Entrar
                <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>

            {/* Nivel 1 */}
            <motion.div
              variants={fadeUp}
              className="card-hover relative p-7 rounded-2xl border border-violet-200 bg-violet-50 flex flex-col gap-6"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-violet-800/10 to-transparent pointer-events-none" />
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-violet-600 uppercase tracking-wider">
                      Nivel 1
                    </span>
                    <h3 className="mt-1 text-2xl font-bold text-gray-800">
                      Intermedio
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-600/10 px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} weight="fill" />
                    Disponible
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  Sensores y condicionales. El robot usa datos de proximidad
                  para evitar obstaculos, leer el laberinto y tomar decisiones.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  "Sensores frontal, izquierdo, derecho",
                  "Condicionales: si hay obstaculo",
                  "Bucles: repetir hasta la meta",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <ArrowRight
                      size={13}
                      className="text-violet-600 flex-shrink-0"
                    />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/levels/2/mission"
                className="btn-press mt-auto inline-flex items-center justify-center gap-2 bg-violet-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-violet-700 transition-colors w-fit"
              >
                Entrar
                <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>

            {/* Nivel 2 */}
            <motion.div
              variants={fadeUp}
              className="card-hover relative p-7 rounded-2xl border border-indigo-200 bg-indigo-50 flex flex-col gap-6"
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-800/10 to-transparent pointer-events-none" />
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-mono text-indigo-600 uppercase tracking-wider">
                      Nivel 2
                    </span>
                    <h3 className="mt-1 text-2xl font-bold text-gray-800">
                      Avanzado
                    </h3>
                  </div>
                  <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 bg-emerald-600/10 px-2.5 py-1 rounded-full">
                    <CheckCircle size={12} weight="fill" />
                    Disponible
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm leading-relaxed">
                  Bucles avanzados. Usa While para evadir obstaculos
                  automaticamente y For para repetir acciones un numero exacto
                  de veces.
                </p>
              </div>
              <ul className="flex flex-col gap-2">
                {[
                  "For N veces: repeticion exacta",
                  "While hay obstaculo: evasion automatica",
                  "Combinar if/else + While + For",
                ].map((feat) => (
                  <li
                    key={feat}
                    className="flex items-center gap-2 text-sm text-gray-600"
                  >
                    <ArrowRight
                      size={13}
                      className="text-indigo-600 flex-shrink-0"
                    />
                    {feat}
                  </li>
                ))}
              </ul>
              <Link
                href="/levels/3/mission"
                className="btn-press mt-auto inline-flex items-center justify-center gap-2 bg-indigo-600 text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors w-fit"
              >
                Entrar
                <ArrowRight size={15} weight="bold" />
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-28 border-t border-gray-300/50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6, ease: EASE_OUT }}
            className="text-center mb-16"
          >
            <h2 className="text-5xl lg:text-6xl font-bold tracking-tighter text-gray-900 leading-[1.05] max-w-3xl mx-auto">
              Robotica real
              <br />
              desde el primer dia
            </h2>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-px bg-gray-300 rounded-2xl overflow-hidden"
          >
            {[
              {
                icon: (
                  <GraduationCap
                    size={24}
                    weight="duotone"
                    className="text-cyan-600"
                  />
                ),
                title: "Aprendizaje practico",
                desc: "Cada concepto se aplica directamente en el robot. No hay teoria sin ejecucion.",
              },
              {
                icon: (
                  <Sparkle
                    size={24}
                    weight="duotone"
                    className="text-amber-600"
                  />
                ),
                title: "Misiones y puntuacion",
                desc: "Cada nivel tiene misiones con puntaje, tiempo y contador de intentos.",
              },
              {
                icon: (
                  <WifiHigh
                    size={24}
                    weight="duotone"
                    className="text-violet-600"
                  />
                ),
                title: "Hardware ESP32 real",
                desc: "Comunicacion WiFi en tiempo real con el rover. Sin cables, sin simulaciones indefinidas.",
              },
            ].map((b) => (
              <motion.div
                key={b.title}
                variants={fadeUp}
                className="bg-gray-50 p-8 flex flex-col gap-4"
              >
                {b.icon}
                <h3 className="text-base font-semibold text-gray-800">
                  {b.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Team */}
      <section
        id="equipo"
        className="py-24 bg-gray-100/20 border-t border-gray-300/40"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55, ease: EASE_OUT }}
          >
            <span className="text-[11px] font-mono text-gray-500 uppercase tracking-[0.2em]">
              El equipo
            </span>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900">
              Proyecto universitario
            </h2>
            <p className="mt-4 text-gray-600 leading-relaxed">
              Desarrollado como proyecto de robotica educativa en la carrera de
              Ingenieria en Sistemas.
            </p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                label: "Institucion",
                value: "Universidad Escuela Militar",
                sub: "de Ingenieria",
              },
              {
                label: "Integrantes",
                value: "Beymar Cruz • Kiara Pino • Evelyn Burgoa",
                sub: "",
              },
              {
                label: "Docente",
                value: "Lic. Grover M.",
                sub: "Magueño Gordillo",
              },
            ].map((item) => (
              <motion.div
                key={item.label}
                variants={fadeUp}
                className="p-5 bg-gray-100 rounded-xl border border-gray-300 text-left"
              >
                <span className="text-[11px] font-mono text-gray-500 uppercase tracking-wider">
                  {item.label}
                </span>
                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {item.value}
                </p>
                {item.sub && (
                  <p className="mt-0.5 text-xs text-gray-600">{item.sub}</p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-300/50 py-8">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo/logo-bekiev1.png"
              alt="BEKIE Logo"
              width={32}
              height={32}
              className="rounded-md flex-shrink-0"
            />
            <span className="text-sm font-medium text-gray-600">
              BEKIE / WIRED
            </span>
          </div>
          <p className="text-xs text-gray-500">
            Proyecto universitario - Robotica educativa
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-xs text-gray-600 hover:text-gray-700 transition-colors"
            >
              Iniciar sesion
            </Link>
            <Link
              href="/register"
              className="text-xs text-gray-600 hover:text-gray-700 transition-colors"
            >
              Registrarse
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
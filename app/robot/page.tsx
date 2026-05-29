"use client";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  WifiHigh, WifiSlash, BatteryFull, Cpu, StopCircle,
  ArrowLeft, CheckCircle, Warning, ArrowRight,
  Thermometer, ChartLineUp,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

const MOVEMENTS = [
  "Avanzando",
  "Girando derecha",
  "Avanzando",
  "Avanzando",
  "Girando derecha",
  "Avanzando",
  "Detenido",
];

function useFakeSensor(base: number, range: number, interval = 1200) {
  const [value, setValue] = useState(base);
  useEffect(() => {
    const id = setInterval(() => {
      setValue(Math.round(base + (Math.random() - 0.5) * range));
    }, interval);
    return () => clearInterval(id);
  }, [base, range, interval]);
  return value;
}

export default function RobotPage() {
  const [connected, setConnected] = useState(true);
  const [running, setRunning] = useState(true);
  const [stepIdx, setStepIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [missionDone, setMissionDone] = useState(false);

  const frontSensor = useFakeSensor(38, 20);
  const leftSensor = useFakeSensor(45, 30);
  const rightSensor = useFakeSensor(32, 25);
  const battery = useFakeSensor(85, 4, 5000);
  const temp = useFakeSensor(34, 6, 3000);

  useEffect(() => {
    if (!running || missionDone) return;
    const id = setInterval(() => {
      setStepIdx((s) => {
        const next = s + 1;
        if (next >= MOVEMENTS.length - 1) {
          setRunning(false);
          setMissionDone(true);
        }
        return next < MOVEMENTS.length ? next : s;
      });
      setElapsed((e) => e + 1);
    }, 1400);
    return () => clearInterval(id);
  }, [running, missionDone]);

  const formatTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const stopRobot = () => {
    setRunning(false);
    setStepIdx(MOVEMENTS.length - 1);
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-screen-lg mx-auto w-full px-5 py-10">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="mb-8 flex items-start justify-between gap-4"
        >
          <div>
            <Link href="/levels" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors mb-3">
              <ArrowLeft size={13} />
              Volver al editor
            </Link>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Dashboard del robot</h1>
            <p className="text-sm text-gray-500 mt-0.5 font-mono">ESP32-ROVER-01</p>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-mono ${
            connected
              ? "bg-emerald-50 border-emerald-300 text-emerald-700"
              : "bg-red-50 border-red-300 text-red-600"
          }`}>
            {connected ? <WifiHigh size={13} weight="fill" /> : <WifiSlash size={13} weight="fill" />}
            {connected ? "Conectado" : "Desconectado"}
          </div>
        </motion.div>

        {/* Mission complete banner */}
        {missionDone && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="mb-6 p-4 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <CheckCircle size={20} weight="fill" className="text-emerald-600 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-700">Mision completada</p>
                <p className="text-xs text-emerald-600">El robot llego a la meta en {formatTime(elapsed)}</p>
              </div>
            </div>
            <Link
              href="/results"
              className="btn-press flex items-center gap-1.5 text-xs font-semibold text-white bg-emerald-600 px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex-shrink-0"
            >
              Ver resultado
              <ArrowRight size={13} weight="bold" />
            </Link>
          </motion.div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Status panel */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {/* Current movement */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white border border-gray-200 rounded-xl p-5"
            >
              <p className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-wider">Estado actual</p>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  running ? "bg-cyan-50 border border-cyan-300" : "bg-gray-100 border border-gray-200"
                }`}>
                  <Cpu size={22} weight="duotone" className={running ? "text-cyan-600" : "text-gray-400"} />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{MOVEMENTS[stepIdx]}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    Paso {Math.min(stepIdx + 1, MOVEMENTS.length)} / {MOVEMENTS.length}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-black font-mono text-gray-700">{formatTime(elapsed)}</p>
                  <p className="text-xs text-gray-400">Tiempo de mision</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-4 relative h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-cyan-600 rounded-full"
                  animate={{ width: `${((stepIdx + 1) / MOVEMENTS.length) * 100}%` }}
                  transition={{ duration: 0.5, ease: EASE_OUT }}
                />
              </div>
            </motion.div>

            {/* Sensors */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Sensor frontal", value: frontSensor, unit: "cm", icon: <ChartLineUp size={16} weight="duotone" className="text-cyan-600" />, bar: "bg-cyan-400" },
                { label: "Sensor izquierdo", value: leftSensor, unit: "cm", icon: <ChartLineUp size={16} weight="duotone" className="text-violet-600" />, bar: "bg-violet-400" },
                { label: "Sensor derecho", value: rightSensor, unit: "cm", icon: <ChartLineUp size={16} weight="duotone" className="text-amber-600" />, bar: "bg-amber-400" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    {s.icon}
                    <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">
                      {s.label.replace("Sensor ", "")}
                    </span>
                  </div>
                  <p className="text-2xl font-black font-mono text-gray-900">
                    {s.value}
                    <span className="text-sm text-gray-400 font-normal ml-1">{s.unit}</span>
                  </p>
                  <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${s.bar} rounded-full transition-all duration-700`}
                      style={{ width: `${Math.min(100, (s.value / 100) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Movement log */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 font-mono mb-3 uppercase tracking-wider">Registro de movimientos</p>
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto">
                {MOVEMENTS.slice(0, stepIdx + 1).map((m, i) => (
                  <div key={i} className={`flex items-center gap-2 text-xs font-mono ${
                    i === stepIdx ? "text-cyan-600" : "text-gray-400"
                  }`}>
                    <span className="w-4 text-gray-300">{i + 1}</span>
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-px" style={{
                      background: i === stepIdx ? "#0891b2" : "#d1d5db"
                    }} />
                    {m}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right panel */}
          <div className="flex flex-col gap-4">
            {/* Hardware status */}
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <p className="text-xs text-gray-500 font-mono mb-4 uppercase tracking-wider">Hardware</p>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <WifiHigh size={15} weight="duotone" className="text-emerald-600" />
                    WiFi
                  </div>
                  <span className="text-xs font-mono text-emerald-600">Activo</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <BatteryFull size={15} weight="duotone" className="text-amber-600" />
                    Bateria
                  </div>
                  <span className="text-xs font-mono text-amber-600">{battery}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Thermometer size={15} weight="duotone" className="text-red-500" />
                    Temperatura
                  </div>
                  <span className="text-xs font-mono text-red-500">{temp}°C</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Cpu size={15} weight="duotone" className="text-cyan-600" />
                    ESP32
                  </div>
                  <span className="text-xs font-mono text-cyan-600">240 MHz</span>
                </div>
              </div>
            </div>

            {/* Stop button */}
            {running && (
              <button
                onClick={stopRobot}
                className="btn-press flex items-center justify-center gap-2 w-full bg-red-50 border border-red-300 text-red-600 text-sm font-semibold py-3 rounded-xl hover:bg-red-100 transition-colors"
              >
                <StopCircle size={16} weight="fill" />
                Detener robot
              </button>
            )}

            {/* No connection warning */}
            {!connected && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
                <div className="flex items-center gap-2 text-sm text-red-600 font-medium mb-1">
                  <Warning size={15} weight="fill" />
                  Robot desconectado
                </div>
                <p className="text-xs text-red-500">Verifica que el ESP32 este encendido y en la misma red WiFi.</p>
                <button
                  onClick={() => setConnected(true)}
                  className="btn-press mt-3 w-full text-xs text-red-600 border border-red-300 rounded-lg py-2 hover:border-red-400 transition-colors"
                >
                  Reintentar conexion
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

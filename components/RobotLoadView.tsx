"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Clock, Cpu, WifiHigh } from "@phosphor-icons/react";

type LoadPhase = "connecting" | "transferring" | "running" | "done";

interface RobotLoadViewProps {
  missionTitle: string;
  missionIndex: number;
  totalMissions: number;
  commands: string[];
  onComplete: () => void;
}

const CONNECT_MS = 1600;
const COMMAND_MS = 900;
const RUN_MS = 1200;

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function RobotLoadView({
  missionTitle,
  missionIndex,
  totalMissions,
  commands,
  onComplete,
}: RobotLoadViewProps) {
  const [phase, setPhase] = useState<LoadPhase>("connecting");
  const [sentCount, setSentCount] = useState(0);
  const [runStep, setRunStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  const executionCommands = commands.filter((command) => command !== "Iniciar mision");

  useEffect(() => {
    setPhase("connecting");
    setSentCount(0);
    setRunStep(0);
    setElapsed(0);
    setLog(["Buscando robot en la red WiFi..."]);

    const connectTimer = window.setTimeout(() => {
      setLog((current) => [...current, "Conexion establecida con ESP32-ROVER-01"]);
      setPhase("transferring");
    }, CONNECT_MS);

    return () => window.clearTimeout(connectTimer);
  }, [missionTitle]);

  useEffect(() => {
    if (phase !== "transferring") {
      return;
    }

    if (sentCount >= executionCommands.length) {
      const startTimer = window.setTimeout(() => {
        setLog((current) => [...current, "Programa cargado. Iniciando recorrido..."]);
        setPhase("running");
      }, 400);
      return () => window.clearTimeout(startTimer);
    }

    const timer = window.setTimeout(() => {
      const command = executionCommands[sentCount];
      setLog((current) => [...current, `>> Enviando: ${command}`]);
      setSentCount((current) => current + 1);
    }, COMMAND_MS);

    return () => window.clearTimeout(timer);
  }, [executionCommands, phase, sentCount]);

  useEffect(() => {
    if (phase !== "running") {
      return;
    }

    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
      setRunStep((current) => {
        if (current >= executionCommands.length - 1) {
          setPhase("done");
          setLog((entries) => [...entries, "Recorrido completado. Robot en meta."]);
          return current;
        }

        const next = current + 1;
        const label = executionCommands[next];
        if (label) {
          setLog((entries) => [...entries, `Ejecutando: ${label}`]);
        }
        return next;
      });
    }, RUN_MS);

    return () => window.clearInterval(timer);
  }, [executionCommands, phase]);

  const currentAction =
    phase === "connecting"
      ? "Conectando con el robot..."
      : phase === "transferring"
      ? sentCount < executionCommands.length
        ? `Enviando instruccion ${sentCount + 1} de ${executionCommands.length}`
        : "Finalizando carga del programa..."
      : phase === "running"
      ? executionCommands[runStep] ?? "Ejecutando..."
      : "Mision completada";

  const progress =
    phase === "connecting"
      ? 12
      : phase === "transferring"
      ? 15 + (sentCount / Math.max(executionCommands.length, 1)) * 45
      : phase === "running"
      ? 60 + ((runStep + 1) / Math.max(executionCommands.length, 1)) * 35
      : 100;

  const continueLabel =
    missionIndex >= totalMissions
      ? "Continuar al siguiente nivel"
      : `Continuar a mision ${missionIndex + 1}`;

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 mb-1">
          Carga al robot
        </p>
        <h1 className="text-xl font-bold text-gray-900">{missionTitle}</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Mision {missionIndex}/{totalMissions} · ESP32-ROVER-01
        </p>
      </div>

      <div className="px-6 py-5">
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono mb-4 ${
            phase === "connecting"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <WifiHigh size={14} weight="fill" />
          {phase === "connecting" ? "Conectando..." : "Conectado"}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                phase === "done"
                  ? "bg-emerald-50 border-emerald-300"
                  : "bg-cyan-50 border-cyan-300"
              }`}
            >
              <Cpu
                size={22}
                weight="duotone"
                className={phase === "done" ? "text-emerald-600" : "text-cyan-600"}
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentAction}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                {phase === "running" || phase === "done"
                  ? `Paso ${Math.min(runStep + 1, executionCommands.length)} / ${executionCommands.length}`
                  : phase === "transferring"
                  ? `Transferencia ${sentCount}/${executionCommands.length}`
                  : "Estableciendo enlace WiFi"}
              </p>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="flex items-center justify-end gap-1 text-gray-400 mb-0.5">
                <Clock size={12} weight="duotone" />
                <span className="text-[9px] font-mono uppercase tracking-wider">Tiempo</span>
              </div>
              <p className="text-xl font-black font-mono text-gray-800">{formatTime(elapsed)}</p>
            </div>
          </div>

          <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                phase === "done" ? "bg-emerald-500" : "bg-cyan-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">
            Registro de envio
          </p>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {log.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                className={`flex items-start gap-2 text-[11px] font-mono leading-relaxed ${
                  index === log.length - 1 ? "text-cyan-700" : "text-gray-500"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-current mt-1.5 flex-shrink-0" />
                <span>{entry}</span>
              </div>
            ))}
          </div>
        </div>

        {phase === "done" && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5">
            <CheckCircle size={16} weight="fill" className="text-emerald-600 flex-shrink-0" />
            <p className="text-xs text-emerald-700">
              Programa ejecutado correctamente en {formatTime(elapsed)}.
            </p>
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
        <button
          type="button"
          onClick={onComplete}
          disabled={phase !== "done"}
          className="btn-press w-full text-sm font-semibold py-3.5 rounded-xl transition-colors disabled:bg-gray-200 disabled:text-gray-400 bg-violet-600 text-white hover:bg-violet-700"
        >
          {phase === "done" ? continueLabel : "Esperando al robot..."}
        </button>
      </div>
    </div>
  );
}

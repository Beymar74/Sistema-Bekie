"use client";

import { useEffect, useState, useRef } from "react";
import { CheckCircle, Clock, Cpu, WifiHigh, Bluetooth, Warning } from "@phosphor-icons/react";

type LoadPhase = "idle" | "connecting" | "connected" | "transferring" | "running" | "done" | "error";

interface RobotLoadViewProps {
  missionTitle: string;
  missionIndex: number;
  totalMissions: number;
  commands: string[];
  onComplete: () => void;
}

const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
const CHARACTERISTIC_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";

const COMMAND_MS = 2500; // Tiempo para dejar al robot físico ejecutar el movimiento antes del siguiente comando

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

// Convierte etiquetas legibles de la interfaz a comandos de texto plano que el ESP32 interpreta
const mapLabelToBLECommand = (label: string): string => {
  const normalized = label.trim();
  if (normalized.startsWith("Avanzar")) {
    const match = normalized.match(/N=(\d+)/);
    return match ? `FORWARD:${match[1]}` : "FORWARD";
  }
  if (normalized.startsWith("Retroceder")) {
    const match = normalized.match(/N=(\d+)/);
    return match ? `BACKWARD:${match[1]}` : "BACKWARD";
  }
  if (normalized.includes("derecha")) return "TURN_RIGHT";
  if (normalized.includes("izquierda")) return "TURN_LEFT";
  if (normalized.startsWith("Esperar")) {
    return "WAIT:1000";
  }
  if (normalized.startsWith("Detener")) return "STOP";
  return normalized;
};

export default function RobotLoadView({
  missionTitle,
  missionIndex,
  totalMissions,
  commands,
  onComplete,
}: RobotLoadViewProps) {
  const [phase, setPhase] = useState<LoadPhase>("idle");
  const [sentCount, setSentCount] = useState(0);
  const [runStep, setRunStep] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [log, setLog] = useState<string[]>(["Listo para iniciar enlace con el robot."]);
  
  // Referencias para mantener los objetos de conexión BLE
  const deviceRef = useRef<any>(null);
  const characteristicRef = useRef<any>(null);
  const timerRef = useRef<number | null>(null);

  const executionCommands = commands.filter((command) => command !== "Iniciar mision");

  // Limpiar timers al desmontar el componente
  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  // Timer para la bitácora del tiempo de ejecución
  useEffect(() => {
    if (phase !== "running") return;
    const timer = window.setInterval(() => {
      setElapsed((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase]);

  // Intentar conectar con el robot por Bluetooth (BLE)
  const connectRobotBLE = async () => {
    setPhase("connecting");
    setLog(["Buscando robot 'ESP32-BEKIE' vía Bluetooth..."]);
    
    try {
      const nav = navigator as any;
      if (!nav.bluetooth) {
        throw new Error("Tu navegador no soporta Web Bluetooth. Usa Google Chrome.");
      }

      // 1. Escanear el dispositivo con el nombre configurado
      const device = await nav.bluetooth.requestDevice({
        filters: [{ name: "ESP32-BEKIE" }],
        optionalServices: [SERVICE_UUID],
      });

      deviceRef.current = device;
      setLog((current) => [...current, `Dispositivo encontrado: ${device.name}. Conectando...`]);

      // Detectar desconexión inesperada
      device.addEventListener("gattserverdisconnected", () => {
        setPhase("error");
        setLog((current) => [...current, "⚠️ Conexión Bluetooth perdida con el robot."]);
      });

      // 2. Conectar al servidor GATT del ESP32
      const server = await device.gatt.connect();
      setLog((current) => [...current, "Conectado al servidor del robot. Obteniendo servicios..."]);

      // 3. Obtener el servicio y la característica de escritura
      const service = await server.getPrimaryService(SERVICE_UUID);
      const characteristic = await service.getCharacteristic(CHARACTERISTIC_UUID);
      
      characteristicRef.current = characteristic;
      
      setLog((current) => [...current, "✅ Conexión establecida con éxito con ESP32-BEKIE."]);
      setPhase("connected");
    } catch (err: any) {
      console.error(err);
      setLog((current) => [...current, `❌ Error de conexión: ${err.message || err}`]);
      setPhase("error");
    }
  };

  // Iniciar la transmisión de instrucciones secuenciales al ESP32
  const startExecution = async () => {
    if (!characteristicRef.current) {
      setLog((current) => [...current, "❌ Error: El robot no está conectado por Bluetooth."]);
      return;
    }

    setPhase("transferring");
    setSentCount(0);
    setRunStep(0);
    setElapsed(0);
    setLog((current) => [...current, "Iniciando secuencia en el robot físico..."]);

    try {
      // 1. Enviar el comando START inicial
      const encoder = new TextEncoder();
      await characteristicRef.current.writeValue(encoder.encode("START"));
      setLog((current) => [...current, ">> Enviado: START"]);
      
      setPhase("running");
      runNextCommand(0);
    } catch (err: any) {
      setLog((current) => [...current, `❌ Error al iniciar: ${err.message || err}`]);
      setPhase("error");
    }
  };

  // Envía secuencialmente el siguiente comando esperando el delay estimado
  const runNextCommand = async (index: number) => {
    if (index >= executionCommands.length) {
      // Finalizar recorrido
      try {
        const encoder = new TextEncoder();
        await characteristicRef.current.writeValue(encoder.encode("STOP"));
        setLog((current) => [...current, ">> Enviado: STOP"]);
        setLog((current) => [...current, "Recorrido completado. Robot en meta física."]);
        setPhase("done");
      } catch (err: any) {
        setLog((current) => [...current, `❌ Error al detener: ${err.message || err}`]);
        setPhase("error");
      }
      return;
    }

    const commandLabel = executionCommands[index];
    const bleCommand = mapLabelToBLECommand(commandLabel);

    setRunStep(index);
    setSentCount(index + 1);
    setLog((current) => [...current, `Ejecutando en robot: ${commandLabel} (${bleCommand})`]);

    try {
      const encoder = new TextEncoder();
      await characteristicRef.current.writeValue(encoder.encode(bleCommand));
    } catch (err: any) {
      setLog((current) => [...current, `❌ Error al enviar comando: ${err.message || err}`]);
      setPhase("error");
      return;
    }

    // Esperar el tiempo requerido para que el robot físico realice la acción antes de enviar la siguiente
    timerRef.current = window.setTimeout(() => {
      runNextCommand(index + 1);
    }, COMMAND_MS);
  };

  const currentAction =
    phase === "idle"
      ? "Esperando conexión Bluetooth..."
      : phase === "connecting"
      ? "Enlazando con el robot..."
      : phase === "connected"
      ? "Robot listo y conectado"
      : phase === "transferring"
      ? "Iniciando recorrido..."
      : phase === "running"
      ? executionCommands[runStep] ?? "Ejecutando..."
      : phase === "error"
      ? "Ocurrió un error en la conexión"
      : "Misión completada";

  const progress =
    phase === "idle" || phase === "connecting"
      ? 10
      : phase === "connected"
      ? 30
      : phase === "transferring"
      ? 45
      : phase === "running"
      ? 50 + (sentCount / Math.max(executionCommands.length, 1)) * 45
      : 100;

  const continueLabel =
    missionIndex >= totalMissions
      ? "Continuar al siguiente nivel"
      : `Continuar a misión ${missionIndex + 1}`;

  return (
    <div className="w-full bg-white rounded-3xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100">
        <p className="text-[10px] font-mono uppercase tracking-widest text-cyan-600 mb-1">
          Carga al robot físico
        </p>
        <h1 className="text-xl font-bold text-gray-900">{missionTitle}</h1>
        <p className="text-xs text-gray-500 font-mono mt-1">
          Misión {missionIndex}/{totalMissions} · ESP32-BEKIE
        </p>
      </div>

      <div className="px-6 py-5">
        {/* Indicador de estado de conexión */}
        <div
          className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono mb-4 ${
            phase === "idle" || phase === "connecting"
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : phase === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          <Bluetooth size={14} weight="fill" />
          {phase === "idle"
            ? "Bluetooth Desconectado"
            : phase === "connecting"
            ? "Conectando BLE..."
            : phase === "error"
            ? "Error de conexión"
            : "Bluetooth Conectado"}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center border ${
                phase === "done"
                  ? "bg-emerald-50 border-emerald-300"
                  : phase === "error"
                  ? "bg-red-50 border-red-300"
                  : "bg-cyan-50 border-cyan-300"
              }`}
            >
              <Cpu
                size={22}
                weight="duotone"
                className={
                  phase === "done"
                    ? "text-emerald-600"
                    : phase === "error"
                    ? "text-red-600"
                    : "text-cyan-600"
                }
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{currentAction}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                {phase === "running" || phase === "done"
                  ? `Comando ${sentCount} de ${executionCommands.length}`
                  : phase === "connected"
                  ? "Listo para ejecutar el programa"
                  : "Enlace Bluetooth"}
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
                phase === "done" ? "bg-emerald-500" : phase === "error" ? "bg-red-500" : "bg-cyan-600"
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-3">
          <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-2">
            Registro de envío BLE
          </p>
          <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto pr-1">
            {log.map((entry, index) => (
              <div
                key={`${entry}-${index}`}
                className={`flex items-start gap-2 text-[11px] font-mono leading-relaxed ${
                  index === log.length - 1
                    ? phase === "error"
                      ? "text-red-700"
                      : "text-cyan-700"
                    : "text-gray-500"
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

      <div className="px-6 pb-6 flex flex-col gap-3">
        {/* Acciones según el estado del flujo */}
        {phase === "idle" || phase === "error" ? (
          <button
            type="button"
            onClick={connectRobotBLE}
            className="btn-press w-full text-sm font-semibold py-3.5 rounded-xl transition-colors bg-cyan-600 text-white hover:bg-cyan-700 flex items-center justify-center gap-2"
          >
            <Bluetooth size={16} weight="fill" />
            Conectar Robot por Bluetooth
          </button>
        ) : phase === "connected" ? (
          <button
            type="button"
            onClick={startExecution}
            className="btn-press w-full text-sm font-semibold py-3.5 rounded-xl transition-colors bg-violet-600 text-white hover:bg-violet-700 flex items-center justify-center gap-2"
          >
            <Cpu size={16} weight="fill" />
            Cargar y Ejecutar en Robot Físico
          </button>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            disabled={phase !== "done"}
            className="btn-press w-full text-sm font-semibold py-3.5 rounded-xl transition-colors disabled:bg-gray-200 disabled:text-gray-400 bg-violet-600 text-white hover:bg-violet-700"
          >
            {phase === "done" ? continueLabel : "Ejecutando recorrido..."}
          </button>
        )}
      </div>
    </div>
  );
}

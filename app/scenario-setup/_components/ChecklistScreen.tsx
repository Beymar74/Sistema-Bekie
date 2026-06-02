"use client";

import { motion } from "motion/react";
import { ArrowLeft, CheckCircle, Circle, Flag } from "@phosphor-icons/react";
import { CHECKLIST_ITEMS } from "../_data/steps";
import GridVisual from "./GridVisual";

interface ChecklistScreenProps {
  checked: boolean[];
  allChecked: boolean;
  toggleCheck: (i: number) => void;
  onConfirm: () => void;
  onBack: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1];

export default function ChecklistScreen({
  checked,
  allChecked,
  toggleCheck,
  onConfirm,
  onBack,
}: ChecklistScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      <div className="mb-7">
        <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
          Verificación del escenario
        </span>
        <h1 className="text-2xl font-bold text-gray-900 mt-1.5 leading-snug">
          Confirma que completaste todo
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          Antes de continuar, marca cada paso que realizaste en el escenario físico.
        </p>
      </div>

      {/* Previsualización en 3D del escenario completado */}
      <div className="mb-6">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-wider mb-3">
          Tu escenario físico final debe verse como este modelo 3D
        </p>
        <GridVisual mode="obstacles" />
      </div>

      {/* Lista de verificación animada */}
      <div className="flex flex-col gap-3.5 mb-8">
        {CHECKLIST_ITEMS.map((item, i) => (
          <motion.button
            key={i}
            onClick={() => toggleCheck(i)}
            whileTap={{ scale: 0.98 }}
            animate={
              checked[i]
                ? {
                    scale: [1, 1.04, 0.98, 1],
                    backgroundColor: "#f0fdf4",
                    borderColor: "#86efac",
                  }
                : {
                    scale: 1,
                    backgroundColor: "#ffffff",
                    borderColor: "#cbd5e1",
                  }
            }
            transition={{
              scale: {
                type: "keyframes",
                duration: 0.35,
                ease: "easeInOut",
              },
              backgroundColor: {
                duration: 0.25,
                ease: "easeInOut",
              },
              borderColor: {
                duration: 0.25,
                ease: "easeInOut",
              },
            }}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border cursor-pointer hover:shadow-sm transition-shadow duration-200 ${
              checked[i] ? "border-emerald-300" : "border-slate-300"
            }`}
            aria-pressed={checked[i]}
          >
            {checked[i] ? (
              <motion.span
                initial={{ scale: 0.5, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 10 }}
                className="text-emerald-600 flex-shrink-0"
              >
                <CheckCircle size={22} weight="fill" />
              </motion.span>
            ) : (
              <span className="text-slate-400 flex-shrink-0">
                <Circle size={22} />
              </span>
            )}
            <span
              className={`text-sm leading-snug font-medium transition-colors duration-200 ${
                checked[i] ? "text-emerald-800" : "text-slate-700"
              }`}
            >
              {item}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Botones */}
      <div className="flex gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-3 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          Atrás
        </button>
        <button
          onClick={onConfirm}
          disabled={!allChecked}
          className={`flex-1 flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all duration-200 active:scale-[0.99] ${
            allChecked
              ? "bg-cyan-600 text-white hover:bg-cyan-700 shadow-md shadow-cyan-600/10 hover:shadow-cyan-600/20"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          <Flag size={16} weight="fill" />
          Confirmar escenario
        </button>
      </div>

      {!allChecked && (
        <p className="text-center text-xs text-slate-500 mt-3 font-mono">
          Marca todos los ítems para habilitar la confirmación
        </p>
      )}

      {allChecked && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 flex items-center gap-2.5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl"
        >
          <CheckCircle size={18} weight="fill" className="text-emerald-600 flex-shrink-0" />
          <p className="text-xs text-emerald-800 font-medium">
            ¡Excelente! Has verificado la construcción física. Confirma para desbloquear el Nivel 0.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}

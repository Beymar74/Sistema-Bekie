"use client";

import { motion } from "motion/react";
import { ArrowLeft, ArrowRight, Warning } from "@phosphor-icons/react";
import { Step, STEPS } from "../_data/steps";
import GridVisual from "./GridVisual";

interface StepScreenProps {
  stepIndex: number;
  currentStep: Step;
  onNext: () => void;
  onBack: () => void;
  isLastStep: boolean;
}

const EASE_OUT = [0.23, 1, 0.32, 1];

export default function StepScreen({
  stepIndex,
  currentStep,
  onNext,
  onBack,
  isLastStep,
}: StepScreenProps) {
  const getVisual3D = (visual: Step["visual"]) => {
    if (!visual) return null;

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="mt-5"
      >
        <GridVisual mode={visual} />
      </motion.div>
    );
  };

  return (
    <motion.div
      key={`step-${stepIndex}`}
      initial={{ opacity: 0, x: 25 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -25 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
    >
      {/* Indicadores de pasos de barra superior */}
      <div className="flex items-center gap-1.5 mb-6">
        {STEPS.map((s) => (
          <div
            key={s.number}
            className={`h-1.5 rounded-full flex-1 transition-all duration-300 ${
              s.number < stepIndex
                ? "bg-cyan-600"
                : s.number === stepIndex
                ? "bg-cyan-600 scale-y-110"
                : "bg-gray-200"
            }`}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 mb-2">
        <span className="w-6 h-6 rounded-full bg-cyan-600 text-white text-xs font-bold font-mono flex items-center justify-center flex-shrink-0">
          {currentStep.number}
        </span>
        <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
          Paso {currentStep.number} de {STEPS.length}
        </span>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-3">{currentStep.title}</h2>

      <p className="text-sm text-gray-600 leading-relaxed mb-5">{currentStep.description}</p>

      {/* Visualización 3D interactiva */}
      {getVisual3D(currentStep.visual)}

      {currentStep.tip && (
        <div className="mt-5 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <Warning size={16} weight="duotone" className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 leading-relaxed font-medium">{currentStep.tip}</p>
        </div>
      )}



      {/* Botones de Navegación */}
      <div className="flex gap-3 mt-8">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-600 border border-gray-300 px-4 py-2.5 rounded-xl hover:border-gray-400 hover:text-gray-800 hover:bg-gray-50 transition-colors duration-200"
        >
          <ArrowLeft size={16} weight="bold" />
          Atrás
        </button>
        <button
          onClick={onNext}
          className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-2.5 rounded-xl transition-all shadow-md shadow-cyan-600/10 duration-200 active:scale-[0.99]"
        >
          {isLastStep ? "Verificar escenario" : "Siguiente paso"}
          <ArrowRight size={16} weight="bold" />
        </button>
      </div>
    </motion.div>
  );
}

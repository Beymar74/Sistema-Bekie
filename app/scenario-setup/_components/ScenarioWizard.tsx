"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { useScenarioWizard } from "../_hooks/useScenarioWizard";
import MaterialsScreen from "./MaterialsScreen";
import StepScreen from "./StepScreen";
import ChecklistScreen from "./ChecklistScreen";
import ConfirmedScreen from "./ConfirmedScreen";

const EASE_OUT = [0.23, 1, 0.32, 1];

export default function ScenarioWizard() {
  const {
    step,
    checked,
    confirmed,
    totalSteps,
    isOnMaterials,
    isOnChecklist,
    currentStep,
    progress,
    allChecked,
    goNext,
    goBack,
    toggleCheck,
    handleConfirm,
  } = useScenarioWizard();

  if (confirmed) {
    return <ConfirmedScreen />;
  }

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      {/* Cabecera superior del Wizard */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur px-5 py-3.5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-cyan-600 flex items-center justify-center">
            <span className="text-white font-black text-[9px] font-mono leading-none">BK</span>
          </span>
          <span className="font-semibold text-slate-800 text-sm">
            BEKIE <span className="text-slate-500 font-normal">/ WIRED</span>
          </span>
        </Link>
        <span className="text-xs font-mono text-slate-500">
          {isOnMaterials
            ? "Materiales"
            : isOnChecklist
            ? "Verificación"
            : `Paso ${step} de ${totalSteps}`}
        </span>
      </div>

      {/* Barra de progreso global del Wizard */}
      <div className="h-1 bg-slate-100 w-full">
        <motion.div
          className="h-full bg-cyan-600"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.45, ease: EASE_OUT }}
        />
      </div>

      {/* Contenido principal animado con transiciones */}
      <main className="flex-1 max-w-screen-sm mx-auto w-full px-5 py-8">
        <AnimatePresence mode="wait">
          {isOnMaterials && (
            <MaterialsScreen key="materials" onNext={goNext} />
          )}

          {!isOnMaterials && !isOnChecklist && currentStep && (
            <StepScreen
              key={`step-${step}`}
              stepIndex={step}
              currentStep={currentStep}
              onNext={goNext}
              onBack={goBack}
              isLastStep={step === totalSteps}
            />
          )}

          {isOnChecklist && (
            <ChecklistScreen
              key="checklist"
              checked={checked}
              allChecked={allChecked}
              toggleCheck={toggleCheck}
              onConfirm={handleConfirm}
              onBack={goBack}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

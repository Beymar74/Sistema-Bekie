import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { CHECKLIST_ITEMS, STEPS } from "../_data/steps";

export function useScenarioWizard() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = materials, 1-6 = steps, 7 = checklist
  const [checked, setChecked] = useState<boolean[]>(() =>
    new Array(CHECKLIST_ITEMS.length).fill(false)
  );
  const [confirmed, setConfirmed] = useState(false);

  const totalSteps = STEPS.length;
  const isOnMaterials = step === 0;
  const isOnChecklist = step === totalSteps + 1;
  const currentStepObj = useMemo(() => {
    if (step > 0 && step <= totalSteps) {
      return STEPS[step - 1];
    }
    return null;
  }, [step, totalSteps]);

  const progress = useMemo(() => {
    if (isOnMaterials) return 0;
    if (isOnChecklist) return 100;
    return Math.round((step / totalSteps) * 100);
  }, [step, totalSteps, isOnMaterials, isOnChecklist]);

  const allChecked = useMemo(() => checked.every(Boolean), [checked]);

  const goNext = useCallback(() => {
    setStep((s) => Math.min(s + 1, totalSteps + 1));
  }, [totalSteps]);

  const goBack = useCallback(() => {
    setStep((s) => Math.max(s - 1, 0));
  }, []);

  const toggleCheck = useCallback((i: number) => {
    setChecked((prev) => {
      const next = [...prev];
      next[i] = !next[i];
      return next;
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("bekie-scenario-ready", "true");
    }
    setConfirmed(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
  }, [router]);

  return {
    step,
    checked,
    confirmed,
    totalSteps,
    isOnMaterials,
    isOnChecklist,
    currentStep: currentStepObj,
    progress,
    allChecked,
    goNext,
    goBack,
    toggleCheck,
    handleConfirm,
  };
}

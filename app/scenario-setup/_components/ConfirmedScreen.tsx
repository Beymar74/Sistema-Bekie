"use client";

import { motion } from "motion/react";

const EASE_OUT = [0.23, 1, 0.32, 1];

export default function ConfirmedScreen() {
  return (
    <div className="min-h-[70dvh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
        className="text-center flex flex-col items-center gap-6 max-w-sm"
      >
        {/* Check animado usando SVG y pathLength (stroke-dashoffset bajo el capó) */}
        <div className="relative w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100 shadow-inner">
          <svg width="68" height="68" viewBox="0 0 68 68" className="absolute">
            {/* Círculo dibujándose */}
            <motion.circle
              cx="34"
              cy="34"
              r="30"
              fill="none"
              stroke="#10b981"
              strokeWidth="4"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
            />
            {/* Checkmark dibujándose */}
            <motion.path
              d="M22 34 L30 42 L46 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.6, duration: 0.45, ease: "easeOut" }}
            />
          </svg>

          {/* Micro-partículas expansivas (decorativas) */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1.2, opacity: [0, 0.8, 0] }}
            transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
            className="absolute -inset-2 rounded-full border-2 border-dashed border-emerald-400 pointer-events-none"
          />
        </div>

        <div className="flex flex-col gap-2">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.4, ease: EASE_OUT }}
            className="text-2xl font-bold text-gray-900 tracking-tight"
          >
            Escenario configurado
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.4 }}
            className="text-sm text-gray-600 leading-normal"
          >
            ¡Tu tablero físico está verificado! Redirigiendo al Dashboard para comenzar la programación.
          </motion.p>
        </div>

        {/* Pequeño loader animado */}
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: "100%" }}
          transition={{ delay: 1.0, duration: 1.5, ease: "easeInOut" }}
          className="h-1 bg-emerald-500 rounded-full w-32 mt-2"
        />
      </motion.div>
    </div>
  );
}

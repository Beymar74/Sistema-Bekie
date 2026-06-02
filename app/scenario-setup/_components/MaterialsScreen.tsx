"use client";

import { motion } from "motion/react";
import { Package, Warning } from "@phosphor-icons/react";
import { MATERIALS } from "../_data/materials";

interface MaterialsScreenProps {
  onNext: () => void;
}

const EASE_OUT = [0.23, 1, 0.32, 1];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.12,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE_OUT },
  },
};

export default function MaterialsScreen({ onNext }: { onNext: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="flex flex-col gap-6"
    >
      <div>
        <span className="text-xs font-mono text-cyan-600 uppercase tracking-wider">
          Preparación del escenario
        </span>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 mt-1.5 leading-tight">
          Construye tu escenario de práctica
        </h1>
        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
          Antes de programar tu robot, necesitas construir un escenario físico de 5x5 celdas. Esto
          te ayudará a entender el espacio donde se moverá el robot y conectar lo que ves en la
          pantalla con el mundo real.
        </p>
      </div>

      <div className="bg-cyan-50 border border-cyan-200 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Package size={18} weight="duotone" className="text-cyan-600" />
          <h2 className="text-sm font-semibold text-gray-700">Materiales necesarios</h2>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3.5"
        >
          {MATERIALS.map((m, i) => (
            <motion.div
              key={i}
              variants={itemVariants}
              className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg border border-cyan-100 shadow-sm hover:border-cyan-200 transition-colors"
            >
              <span className="text-cyan-600 flex-shrink-0">{m.icon}</span>
              <span className="text-sm text-gray-700 font-medium">{m.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3"
      >
        <Warning size={18} weight="duotone" className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed font-medium">
          Recomendación: Usa cartulina o varias hojas unidas con cinta adhesiva para formar una
          superficie de aproximadamente 100 cm x 100 cm.
        </p>
      </motion.div>

      <button
        onClick={onNext}
        className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold text-sm py-3.5 rounded-xl transition-all shadow-md shadow-cyan-600/10 hover:shadow-cyan-600/20 duration-200 active:scale-[0.99]"
      >
        Comenzar construcción
      </button>
    </motion.div>
  );
}

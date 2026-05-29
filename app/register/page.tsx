"use client";
import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, EnvelopeSimple, Lock, ArrowRight, Eye, EyeSlash, GraduationCap, ChalkboardTeacher } from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const router = useRouter();

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Ingresa tu nombre completo";
    if (!email.includes("@")) errs.email = "Correo invalido";
    if (password.length < 6) errs.password = "Minimo 6 caracteres";
    if (password !== confirm) errs.confirm = "Las contrasenas no coinciden";
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.push(role === "teacher" ? "/teacher" : "/dashboard");
    }, 1200);
  };

  return (
    <div className="min-h-[100dvh] bg-white flex items-center justify-center p-6">
      <div className="w-full max-w-sm py-10">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: EASE_OUT }}
        >
          <div className="flex items-center gap-2.5 mb-10">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="w-7 h-7 rounded-lg bg-cyan-600 flex items-center justify-center">
                <span className="text-white font-black text-[11px] font-mono leading-none">BK</span>
              </span>
              <span className="font-semibold text-gray-700">BEKIE <span className="text-gray-500">/ WIRED</span></span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">Crear cuenta</h1>
          <p className="text-sm text-gray-600 mb-8">Completa los datos para registrarte.</p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-7">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`btn-press flex flex-col items-center gap-2 py-4 rounded-xl border transition-all duration-200 ${
                  role === r
                    ? "border-cyan-500/60 bg-cyan-600/8 text-cyan-600"
                    : "border-gray-300 bg-gray-100/50 text-gray-600 hover:border-gray-400"
                }`}
              >
                {r === "student" ? (
                  <GraduationCap size={22} weight="duotone" />
                ) : (
                  <ChalkboardTeacher size={22} weight="duotone" />
                )}
                <span className="text-xs font-medium">
                  {r === "student" ? "Estudiante" : "Docente"}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="name">
                Nombre completo
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Beymar Cruz"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-4 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              {errors.name && <span className="text-xs text-red-400">{errors.name}</span>}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="email">
                Correo electronico
              </label>
              <div className="relative">
                <EnvelopeSimple size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-4 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              {errors.email && <span className="text-xs text-red-400">{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="pw">Contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  id="pw"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimo 6 caracteres"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-10 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && <span className="text-xs text-red-400">{errors.password}</span>}
            </div>

            {/* Confirm */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="confirm">Confirmar contrasena</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repite la contrasena"
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-4 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors"
                />
              </div>
              {errors.confirm && <span className="text-xs text-red-400">{errors.confirm}</span>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press mt-2 flex items-center justify-center gap-2 w-full bg-cyan-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-950/40 border-t-zinc-950 animate-spin" />
                  Creando cuenta...
                </span>
              ) : (
                <>
                  Crear cuenta
                  <ArrowRight size={15} weight="bold" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Ya tienes cuenta?{" "}
            <Link href="/login" className="text-cyan-600 hover:text-cyan-700 transition-colors font-medium">
              Iniciar sesion
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

"use client";
import { useState } from "react";
import { motion } from "motion/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EnvelopeSimple, Lock, ArrowRight, Eye, EyeSlash } from "@phosphor-icons/react";
import Navbar from "@/components/Navbar";
import Image from "next/image";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (role === "teacher") {
        router.push("/teacher");
      } else {
        let isScenarioReady = false;
        
        if (typeof window !== "undefined") {
          const lowerEmail = email.toLowerCase().trim();
          
          if (lowerEmail === "beymar@bekie.edu" && password === "password123") {
            // Beymar: Primer Ingreso
            localStorage.setItem("bekie-user-name", "Beymar");
            localStorage.setItem("bekie-scenario-ready", "false");
            localStorage.setItem("bekie-level-0-progress:v2:completed", "0");
            localStorage.setItem("bekie-level-2-progress:v2:completed", "0");
            localStorage.setItem("bekie-level-3-progress:v2:completed", "0");
            isScenarioReady = false;
          } else if (lowerEmail === "kiara@bekie.edu" && password === "password123") {
            // Kiara: Nivel 1 (Intermedio)
            localStorage.setItem("bekie-user-name", "Kiara");
            localStorage.setItem("bekie-scenario-ready", "true");
            localStorage.setItem("bekie-level-0-progress:v2:completed", "3");
            localStorage.setItem("bekie-level-2-progress:v2:completed", "0");
            localStorage.setItem("bekie-level-3-progress:v2:completed", "0");
            isScenarioReady = true;
          } else if (lowerEmail === "evelyn@bekie.edu" && password === "password123") {
            // Evelyn: Nivel 2 (Avanzado)
            localStorage.setItem("bekie-user-name", "Evelyn");
            localStorage.setItem("bekie-scenario-ready", "true");
            localStorage.setItem("bekie-level-0-progress:v2:completed", "3");
            localStorage.setItem("bekie-level-2-progress:v2:completed", "7");
            localStorage.setItem("bekie-level-3-progress:v2:completed", "0");
            isScenarioReady = true;
          } else {
            // Fallback for other mock emails
            const namePart = email.split("@")[0];
            const formattedName = namePart ? namePart.charAt(0).toUpperCase() + namePart.slice(1) : "Estudiante";
            localStorage.setItem("bekie-user-name", formattedName);
            isScenarioReady = localStorage.getItem("bekie-scenario-ready") === "true";
          }
          
          window.dispatchEvent(new Event("storage"));
        }
        
        router.push(isScenarioReady ? "/dashboard" : "/scenario-setup");
      }
    }, 1000);
  };

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col justify-between">
      <Navbar />

      <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-12">
        <div className="w-full max-w-sm">
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
          >


          <h1 className="text-2xl font-bold tracking-tight text-gray-900 mb-1">
            Iniciar sesion
          </h1>
          <p className="text-sm text-gray-600 mb-8">
            Ingresa tus datos para continuar.
          </p>

          {/* Role selector */}
          <div className="flex gap-1.5 mb-7 p-1 bg-gray-100 rounded-lg border border-gray-300">
            {(["student", "teacher"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={`btn-press flex-1 text-xs font-medium py-2 rounded-md transition-all duration-200 ${
                  role === r
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {r === "student" ? "Estudiante" : "Docente"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="email">
                Correo electronico
              </label>
              <div className="relative">
                <EnvelopeSimple
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-4 py-2.5 rounded-lg focus:border-cyan-500 focus:ring-0 outline-none transition-colors duration-200"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-gray-600" htmlFor="password">
                Contrasena
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none"
                />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-100 border border-gray-300 text-gray-800 text-sm placeholder:text-gray-500 pl-9 pr-10 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-700 transition-colors"
                >
                  {showPassword ? <EyeSlash size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-press mt-2 flex items-center justify-center gap-2 w-full bg-cyan-600 text-white font-semibold text-sm py-2.5 rounded-lg hover:bg-cyan-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-zinc-950/40 border-t-zinc-950 animate-spin" />
                  Ingresando...
                </span>
              ) : (
                <>
                  Ingresar
                  <ArrowRight size={15} weight="bold" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            No tienes cuenta?{" "}
            <Link
              href="/register"
              className="text-cyan-600 hover:text-cyan-700 transition-colors font-medium"
            >
              Registrarse
            </Link>
          </p>
        </motion.div>
      </div>
    </div>

    {/* Footer */}
    <footer className="border-t border-gray-300/50 py-8">
      <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo/logo-bekiev1.png"
            alt="BEKIE Logo"
            width={32}
            height={32}
            className="rounded-md flex-shrink-0"
          />
          <span className="text-sm font-medium text-gray-600">
            BEKIE / WIRED
          </span>
        </div>
        <p className="text-xs text-gray-500">
          Proyecto universitario - Robotica educativa
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-xs text-gray-600 hover:text-gray-700 transition-colors"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/register"
            className="text-xs text-gray-600 hover:text-gray-700 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </footer>
  </div>
  );
}

"use client";
import Link from "next/link";
import Image from "next/image";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-gray-300 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/logo/logo-bekiev1.png"
            alt="BEKIE Logo"
            width={48}
            height={48}
            className="rounded-lg flex-shrink-0"
          />
          <span className="font-semibold tracking-tight text-gray-900">
            BEKIE{" "}
            <span className="text-gray-600 font-normal text-sm">/ WIRED</span>
          </span>
        </Link>

        <div className="hidden md:flex items-center gap-7">
          <Link
            href="#como-funciona"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Como funciona
          </Link>
          <Link
            href="#niveles"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            Niveles
          </Link>
          <Link
            href="#equipo"
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
          >
            El equipo
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="btn-press text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
          >
            Iniciar sesion
          </Link>
          <Link
            href="/register"
            className="btn-press text-sm bg-cyan-600 text-white font-semibold px-4 py-2 rounded-lg hover:bg-cyan-700 transition-colors duration-200"
          >
            Registrarse
          </Link>
        </div>
      </div>
    </nav>
  );
}

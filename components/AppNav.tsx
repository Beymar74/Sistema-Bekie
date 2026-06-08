"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import {
  HouseSimple,
  SquaresFour,
  ChalkboardTeacher,
  SignOut,
  Cpu,
} from "@phosphor-icons/react";

interface AppNavProps {
  userName?: string;
  role?: "student" | "teacher";
}

export default function AppNav({
  userName: propUserName = "Estudiante",
  role = "student",
}: AppNavProps) {
  const pathname = usePathname();
  const [userName, setUserName] = useState(propUserName);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedName = localStorage.getItem("bekie-user-name");
      if (storedName) {
        setUserName(storedName);
      }
    }
  }, [propUserName]);

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + "/");

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 text-xs px-3 py-1.5 rounded-md transition-colors duration-200 ${
      isActive(path)
        ? "bg-gray-200 text-gray-900"
        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    }`;

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-300 bg-white/95 backdrop-blur-xl">
      <div className="max-w-screen-xl mx-auto px-5 h-13 flex items-center justify-between gap-4">
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <Image
            src="/logo/logo-bekiev1.png"
            alt="BEKIE Logo"
            width={28}
            height={28}
            className="rounded-md flex-shrink-0"
          />
          <span className="font-semibold text-sm text-gray-900 hidden sm:block">
            BEKIE
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {role === "student" && (
            <>
              <Link href="/dashboard" className={navLinkClass("/dashboard")}>
                <HouseSimple size={14} weight="duotone" />
                <span className="hidden sm:block">Dashboard</span>
              </Link>
              <Link href="/levels" className={navLinkClass("/levels")}>
                <SquaresFour size={14} weight="duotone" />
                <span className="hidden sm:block">Niveles</span>
              </Link>
              <Link href="/robot" className={navLinkClass("/robot")}>
                <Cpu size={14} weight="duotone" />
                <span className="hidden sm:block">Robot</span>
              </Link>
            </>
          )}
          {role === "teacher" && (
            <Link href="/teacher" className={navLinkClass("/teacher")}>
              <ChalkboardTeacher size={14} weight="duotone" />
              <span className="hidden sm:block">Panel docente</span>
            </Link>
          )}
        </div>

        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="hidden sm:flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-semibold text-gray-700">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="text-xs text-gray-600 max-w-24 truncate">
              {userName}
            </span>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            <SignOut size={14} />
            <span className="hidden sm:block">Salir</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

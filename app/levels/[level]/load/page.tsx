"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import RobotLoadView from "@/components/RobotLoadView";
import { LEVEL_2_STAGES } from "@/lib/nivel-1";
import { LEVEL_3_STAGES } from "@/lib/nivel-2";
import {
  clearRobotLoadPayload,
  readRobotLoadPayload,
  unlockMissionAfterComplete,
  type RobotLoadPayload,
} from "@/lib/progress";
import { ArrowLeft } from "@phosphor-icons/react";

export default function RobotLoadPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const levelKey = (params.level as string) || "2";
  const missionFromQuery = Number(searchParams.get("mission") ?? "1");

  const [payload, setPayload] = useState<RobotLoadPayload | null>(null);

  useEffect(() => {
    const stored = readRobotLoadPayload();
    if (stored && stored.levelKey === levelKey) {
      setPayload(stored);
      return;
    }

    if (levelKey === "2") {
      const stage = LEVEL_2_STAGES[missionFromQuery - 1];
      if (stage) {
        setPayload({
          levelKey: "2",
          missionIndex: missionFromQuery,
          missionTitle: stage.title,
          commands: ["Iniciar mision"],
        });
      }
    }
  }, [levelKey, missionFromQuery]);

  const handleComplete = () => {
    if (!payload) {
      return;
    }

    if (payload.levelKey === "2") {
      unlockMissionAfterComplete(
        "bekie-level-2-progress",
        payload.missionIndex,
        LEVEL_2_STAGES.length
      );

      clearRobotLoadPayload();

      if (payload.missionIndex < LEVEL_2_STAGES.length) {
        router.push(`/levels/2/editor?mission=${payload.missionIndex + 1}`);
        return;
      }

      router.push("/levels/3/mission");
      return;
    }

    clearRobotLoadPayload();
    router.push("/levels");
  };

  if (!payload) {
    return (
      <div className="min-h-[100dvh] bg-white flex flex-col">
        <AppNav userName="Beymar" role="student" />
        <main className="flex-1 flex items-center justify-center px-5">
          <div className="text-center max-w-sm">
            <p className="text-sm text-gray-600 mb-4">
              No hay un programa listo para cargar. Compila tu secuencia y pulsa Cargar de nuevo.
            </p>
            <Link
              href={`/levels/${levelKey}/editor?mission=${missionFromQuery}`}
              className="btn-press inline-flex items-center gap-2 text-sm font-semibold text-white bg-violet-600 px-4 py-2.5 rounded-xl hover:bg-violet-700"
            >
              <ArrowLeft size={14} />
              Volver al editor
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const totalMissions =
    payload.levelKey === "2" ? LEVEL_2_STAGES.length : LEVEL_3_STAGES.length;

  return (
    <div className="min-h-[100dvh] bg-gray-50 flex flex-col">
      <AppNav userName="Beymar" role="student" />

      <main className="flex-1 max-w-lg mx-auto w-full px-5 py-8">
        <Link
          href={`/levels/${levelKey}/editor?mission=${payload.missionIndex}`}
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft size={13} />
          Volver al editor
        </Link>

        <RobotLoadView
          missionTitle={payload.missionTitle}
          missionIndex={payload.missionIndex}
          totalMissions={totalMissions}
          commands={payload.commands}
          onComplete={handleComplete}
        />
      </main>
    </div>
  );
}

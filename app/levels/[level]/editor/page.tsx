"use client";

import { useParams, useSearchParams } from "next/navigation";
import BasicLevelEditor from "@/components/BasicLevelEditor";
import IntermediateLevelEditor from "@/components/IntermediateLevelEditor";
import AdvancedLevelEditor from "@/components/AdvancedLevelEditor";
import CustomBlockLevelEditor from "@/components/CustomBlockLevelEditor";
import { type LevelKey } from "@/lib/levels";
import {
  LEVEL_0_STAGES,
  LEVEL_EDITORS as BASIC_LEVEL_EDITORS,
} from "@/lib/nivel-0";
import {
  LEVEL_2_STAGES,
  LEVEL_EDITORS as INTERMEDIATE_LEVEL_EDITORS,
} from "@/lib/nivel-1";
import {
  LEVEL_3_STAGES,
  LEVEL_EDITORS as ADVANCED_LEVEL_EDITORS,
} from "@/lib/nivel-2";

export default function EditorPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const levelKey = ((params.level as string) || "1") as LevelKey;

  const isBasic = levelKey === "1";
  const isIntermediate = levelKey === "2";
  const isAdvanced = levelKey === "3";

  // ── Nivel 2: Avanzado (Custom Blocks / Functions) ──
  if (isAdvanced) {
    const missionIndexRaw = Number(searchParams.get("mission") ?? "1");
    const missionIndex = Math.min(
      LEVEL_3_STAGES.length,
      Math.max(1, Number.isNaN(missionIndexRaw) ? 1 : missionIndexRaw)
    );
    const stage = LEVEL_3_STAGES[missionIndex - 1] ?? LEVEL_3_STAGES[0];
    const config = { ...ADVANCED_LEVEL_EDITORS["3"], grid: stage.grid };
    return (
      <CustomBlockLevelEditor
        key={missionIndex}
        config={config}
        stage={stage}
        missionIndex={missionIndex}
      />
    );
  }

  // ── Nivel 0: Basico ──
  if (isBasic) {
    const missionIndexRaw = Number(searchParams.get("mission") ?? "1");
    const missionIndex = Math.min(
      LEVEL_0_STAGES.length,
      Math.max(1, Number.isNaN(missionIndexRaw) ? 1 : missionIndexRaw)
    );
    const stage = LEVEL_0_STAGES[missionIndex - 1] ?? LEVEL_0_STAGES[0];
    const config = { ...BASIC_LEVEL_EDITORS["1"], grid: stage.grid };
    return (
      <BasicLevelEditor
        key={missionIndex}
        config={config}
        stage={stage}
        missionIndex={missionIndex}
      />
    );
  }

  // ── Nivel 1: Intermedio ──
  if (isIntermediate) {
    const missionIndexRaw = Number(searchParams.get("mission") ?? "1");
    const missionIndex = Math.min(
      LEVEL_2_STAGES.length,
      Math.max(1, Number.isNaN(missionIndexRaw) ? 1 : missionIndexRaw)
    );
    const stage = LEVEL_2_STAGES[missionIndex - 1] ?? LEVEL_2_STAGES[0];
    const config = INTERMEDIATE_LEVEL_EDITORS["2"];

    const intermediateStart: [number, number] = (() => {
      for (let row = 0; row < stage.grid.length; row += 1) {
        for (let col = 0; col < stage.grid[row].length; col += 1) {
          if (stage.grid[row][col] === 2) {
            return [row, col];
          }
        }
      }
      return config.start;
    })();

    return (
      <IntermediateLevelEditor
        key={missionIndex}
        config={{
          ...config,
          grid: stage.grid,
          start: intermediateStart,
          levelKey: "2",
          progressKey: "bekie-level-2-progress",
        }}
        stage={stage}
        missionIndex={missionIndex}
      />
    );
  }

  return null;
}

"use client";
import { useState } from "react";
import { motion } from "motion/react";
import AppNav from "@/components/AppNav";
import {
  ChalkboardTeacher, CheckCircle, Clock, Warning,
  MagnifyingGlass, ArrowUp, ArrowDown, Export, Eye,
} from "@phosphor-icons/react";

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];

type StatusType = "Completado" | "En progreso" | "Fallido" | "Sin iniciar";

interface Student {
  id: number;
  name: string;
  level: number;
  levelName: string;
  progress: number;
  status: StatusType;
  attempts: number;
  lastScore: number | null;
  time: string;
}

const STUDENTS: Student[] = [
  { id: 1, name: "Beymar Cruz",    level: 1, levelName: "Basico",      progress: 60, status: "En progreso", attempts: 3, lastScore: 85,  time: "00:48" },
  { id: 2, name: "Kiara Pino",     level: 1, levelName: "Basico",      progress: 40, status: "En progreso", attempts: 2, lastScore: 72,  time: "01:12" },
  { id: 3, name: "Evelyn Burgoa",  level: 2, levelName: "Intermedio",  progress: 70, status: "Fallido",     attempts: 5, lastScore: 45,  time: "02:30" },
  { id: 4, name: "Carlos Morales", level: 1, levelName: "Basico",      progress: 20, status: "En progreso", attempts: 1, lastScore: null, time: "--:--" },
  { id: 5, name: "Luisa Gutierrez",level: 1, levelName: "Basico",      progress: 100,status: "Completado",  attempts: 2, lastScore: 95,  time: "00:35" },
  { id: 6, name: "Martin Vaca",    level: 1, levelName: "Basico",      progress: 0,  status: "Sin iniciar", attempts: 0, lastScore: null, time: "--:--" },
];

const STATUS_STYLE: Record<StatusType, string> = {
  Completado:   "bg-emerald-400/10 text-emerald-600",
  "En progreso":"bg-amber-400/10 text-amber-600",
  Fallido:      "bg-red-400/10 text-red-600",
  "Sin iniciar":"bg-gray-100 text-gray-500",
};

const STATUS_ICON: Record<StatusType, React.ReactNode> = {
  Completado:    <CheckCircle size={12} weight="fill" />,
  "En progreso": <Clock size={12} weight="fill" />,
  Fallido:       <Warning size={12} weight="fill" />,
  "Sin iniciar": <Clock size={12} />,
};

export default function TeacherPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"Todos" | StatusType>("Todos");
  const [sortField, setSortField] = useState<"name" | "progress" | "level">("name");
  const [sortAsc, setSortAsc] = useState(true);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortAsc((v) => !v);
    else { setSortField(field); setSortAsc(true); }
  };

  const filtered = STUDENTS
    .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    .filter((s) => filter === "Todos" || s.status === filter)
    .sort((a, b) => {
      let cmp = 0;
      if (sortField === "name") cmp = a.name.localeCompare(b.name);
      else if (sortField === "progress") cmp = a.progress - b.progress;
      else if (sortField === "level") cmp = a.level - b.level;
      return sortAsc ? cmp : -cmp;
    });

  const completed = STUDENTS.filter((s) => s.status === "Completado").length;
  const inProgress = STUDENTS.filter((s) => s.status === "En progreso").length;
  const failed = STUDENTS.filter((s) => s.status === "Fallido").length;

  const SortIcon = ({ field }: { field: typeof sortField }) =>
    sortField === field ? (
      sortAsc ? <ArrowUp size={12} /> : <ArrowDown size={12} />
    ) : null;

  return (
    <div className="min-h-[100dvh] bg-white flex flex-col">
      <AppNav userName="Prof. Asesor" role="teacher" />

      <main className="flex-1 max-w-screen-xl mx-auto w-full px-5 py-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT }}
          className="mb-8 flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ChalkboardTeacher size={20} weight="duotone" className="text-cyan-600" />
              <span className="text-sm font-mono text-gray-500 uppercase tracking-wider">Panel docente</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Monitoreo de estudiantes</h1>
          </div>
          <button className="btn-press flex items-center gap-2 text-xs text-gray-600 border border-gray-300 px-4 py-2 rounded-lg hover:border-gray-400 hover:text-gray-800 transition-colors">
            <Export size={14} />
            Exportar reporte
          </button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-7"
        >
          {[
            { label: "Total estudiantes", value: STUDENTS.length, color: "text-gray-900" },
            { label: "Completados",        value: completed,        color: "text-emerald-600" },
            { label: "En progreso",        value: inProgress,       color: "text-amber-600" },
            { label: "Fallidos",           value: failed,           color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500 mb-1.5">{s.label}</p>
              <p className={`text-3xl font-black font-mono ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col sm:flex-row gap-3 mb-5"
        >
          {/* Search */}
          <div className="relative flex-1">
            <MagnifyingGlass size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar estudiante..."
              className="w-full bg-white border border-gray-300 text-gray-800 text-sm placeholder:text-gray-400 pl-9 pr-4 py-2.5 rounded-lg focus:border-cyan-500 outline-none transition-colors"
            />
          </div>
          {/* Filter tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 border border-gray-200 rounded-lg">
            {(["Todos", "Completado", "En progreso", "Fallido", "Sin iniciar"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f as typeof filter)}
                className={`btn-press text-xs px-3 py-1.5 rounded-md transition-all duration-200 ${
                  filter === f
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4, ease: EASE_OUT }}
          className="bg-white border border-gray-200 rounded-xl overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  {[
                    { label: "Estudiante", field: "name" },
                    { label: "Nivel",      field: "level" },
                    { label: "Progreso",   field: "progress" },
                    { label: "Estado",     field: null },
                    { label: "Intentos",   field: null },
                    { label: "Puntaje",    field: null },
                    { label: "Tiempo",     field: null },
                    { label: "",           field: null },
                  ].map(({ label, field }) => (
                    <th
                      key={label}
                      onClick={() => field && toggleSort(field as typeof sortField)}
                      className={`px-4 py-3 text-left text-[11px] font-mono text-gray-500 uppercase tracking-wider whitespace-nowrap ${
                        field ? "cursor-pointer hover:text-gray-700 select-none" : ""
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {field && <SortIcon field={field as typeof sortField} />}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((s, i) => (
                  <motion.tr
                    key={s.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3, ease: EASE_OUT }}
                    className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                  >
                    {/* Estudiante */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-700 flex-shrink-0">
                          {s.name.charAt(0)}
                        </span>
                        <span className="text-sm text-gray-800 whitespace-nowrap">{s.name}</span>
                      </div>
                    </td>
                    {/* Nivel */}
                    <td className="px-4 py-3.5">
                      <span className="text-xs font-mono text-gray-500">
                        Nivel {s.level} - {s.levelName}
                      </span>
                    </td>
                    {/* Progreso */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5 min-w-[100px]">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-cyan-600 rounded-full transition-all duration-700"
                            style={{ width: `${s.progress}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-500 w-8 text-right">{s.progress}%</span>
                      </div>
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>
                        {STATUS_ICON[s.status]}
                        {s.status}
                      </span>
                    </td>
                    {/* Intentos */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-gray-600">{s.attempts}</span>
                    </td>
                    {/* Puntaje */}
                    <td className="px-4 py-3.5">
                      <span className={`text-sm font-mono ${s.lastScore ? "text-amber-600" : "text-gray-400"}`}>
                        {s.lastScore ? `${s.lastScore}/100` : "--"}
                      </span>
                    </td>
                    {/* Tiempo */}
                    <td className="px-4 py-3.5">
                      <span className="text-sm font-mono text-gray-500">{s.time}</span>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3.5">
                      <button className="btn-press flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                        <Eye size={13} />
                        Ver
                      </button>
                    </td>
                  </motion.tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-500">
                      No se encontraron estudiantes con ese filtro.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <p className="mt-3 text-xs text-gray-400 text-right font-mono">
          {filtered.length} de {STUDENTS.length} estudiantes
        </p>
      </main>
    </div>
  );
}

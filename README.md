# BEKIE / WIRED — Plataforma Educativa de Robótica

Plataforma web para la enseñanza de programación y robótica educativa mediante bloques visuales, simulación 2D y ejecución en robot físico (ESP32). Los estudiantes avanzan por tres niveles de dificultad — secuencial, condicional y bucles — desde construir su escenario físico hasta enviar instrucciones al robot real por WiFi.

---

## Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Arquitectura del sistema](#arquitectura-del-sistema)
4. [Estructura de directorios](#estructura-de-directorios)
5. [Rutas y páginas](#rutas-y-páginas)
6. [Módulos core (`lib/`)](#módulos-core-lib)
7. [Componentes reutilizables](#componentes-reutilizables)
8. [Motor de simulación](#motor-de-simulación)
9. [Sistema de progresión y misiones](#sistema-de-progresión-y-misiones)
10. [Estado y persistencia](#estado-y-persistencia)
11. [Sistema de diseño](#sistema-de-diseño)
12. [Instalación y desarrollo](#instalación-y-desarrollo)
13. [Docker](#docker)
14. [Scripts disponibles](#scripts-disponibles)
15. [Estado actual y roadmap](#estado-actual-y-roadmap)

---

## Visión general

```
Estudiante
    │
    ▼
Construye escenario físico 5×5 (100 cm × 100 cm)
    │
    ▼
Programa movimientos con bloques visuales (drag & drop)
    │
    ▼
Valida la lógica con el compilador interno
    │
    ▼
Ejecuta la simulación en la matriz 2D
    │
    ▼
Envía las instrucciones al robot ESP32 por WiFi
```

El sistema enseña tres conceptos progresivos:

| Nivel | Clave | Concepto central | Bloques nuevos |
|-------|-------|-----------------|----------------|
| 0 – Básico | `"1"` | Programación secuencial | `INIT`, `FORWARD`, `BACKWARD`, `TURN_LEFT`, `TURN_RIGHT`, `WAIT`, `STOP` |
| 1 – Intermedio | `"2"` | Condicionales y sensores | `IF_OBS_ELSE` |
| 2 – Avanzado | `"3"` | Bucles y lógica anidada | `WHILE_GOAL`, `REPEAT` |

---

## Stack tecnológico

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| Framework | Next.js (App Router) | 16.2.6 |
| UI Library | React | 19.2.4 |
| Tipado | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 |
| PostCSS | @tailwindcss/postcss | ^4 |
| Animaciones | Motion (Framer Motion v12) | ^12.40.0 |
| Íconos | Phosphor Icons React | ^2.1.10 |
| 3D (futuro) | Three.js + React Three Fiber + Drei | 0.184 / 9.6 / 10.7 |
| Runtime | Node.js (Docker) | 20 |
| Tipografía | Geist Sans / Geist Mono | Google Fonts |

---

## Arquitectura del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      Navegador (cliente)                     │
│                                                             │
│  ┌──────────┐   ┌──────────────┐   ┌──────────────────┐   │
│  │  Next.js │   │  Editor de   │   │   Simulador 2D   │   │
│  │ App Router│──▶│   bloques    │──▶│  (motor en JS)   │   │
│  └──────────┘   └──────────────┘   └────────┬─────────┘   │
│                                              │              │
│                       ┌──────────────────────┘              │
│                       ▼                                     │
│               ┌───────────────┐                             │
│               │  Compilador   │ (validación de estructura)  │
│               └───────────────┘                             │
│                                                             │
│  localStorage: progreso por nivel (misión activa)           │
└──────────────────────────────────┬──────────────────────────┘
                                   │ WiFi (futuro)
                                   ▼
                          ┌────────────────┐
                          │  Robot ESP32   │
                          │  (físico)      │
                          └────────────────┘
```

**No hay base de datos implementada todavía.** El estado persiste en `localStorage`. Las páginas de autenticación y el panel del profesor son stubs preparados para integración futura.

---

## Estructura de directorios

```
BEKIE/
│
├── app/                          # Next.js App Router — todas las rutas
│   ├── layout.tsx                # Layout raíz: fuentes Geist, metadata, lang="es"
│   ├── page.tsx                  # Landing page pública (hero, features, niveles)
│   ├── globals.css               # Tailwind v4 + variables CSS + utilidades custom
│   ├── favicon.ico
│   │
│   ├── login/
│   │   └── page.tsx              # Página de inicio de sesión (stub)
│   │
│   ├── register/
│   │   └── page.tsx              # Página de registro (stub)
│   │
│   ├── dashboard/
│   │   └── page.tsx              # Panel del estudiante (progreso, misiones activas)
│   │
│   ├── levels/
│   │   ├── page.tsx              # Vista general de los 3 niveles con progreso
│   │   └── [level]/              # Segmento dinámico: "1", "2" o "3"
│   │       ├── mission/
│   │       │   └── page.tsx      # Briefing de misión (stub)
│   │       └── editor/
│   │           └── page.tsx      # Editor + compilador + simulador (core del sistema)
│   │
│   ├── robot/
│   │   └── page.tsx              # Panel de control del robot físico (stub)
│   │
│   ├── results/
│   │   └── page.tsx              # Resultados y puntuación de misión (stub)
│   │
│   ├── teacher/
│   │   └── page.tsx              # Panel del profesor (stub)
│   │
│   └── scenario-setup/           # Flujo de preparación del escenario físico
│       ├── page.tsx              # Página contenedora del wizard
│       ├── _components/
│       │   ├── ScenarioWizard.tsx     # Orquestador del wizard (6 pantallas)
│       │   ├── MaterialsScreen.tsx    # Pantalla 1: lista de materiales
│       │   ├── StepScreen.tsx         # Pantallas 2–6: instrucciones paso a paso
│       │   ├── GridVisual.tsx         # Visualización ASCII/SVG de la cuadrícula 5×5
│       │   ├── ChecklistScreen.tsx    # Pantalla de verificación con checklist
│       │   └── ConfirmedScreen.tsx    # Confirmación: desbloquea Nivel 0
│       ├── _data/
│       │   ├── materials.tsx          # Datos: lista de materiales necesarios
│       │   └── steps.ts               # Datos: los 6 pasos de construcción del escenario
│       └── _hooks/
│           └── useScenarioWizard.ts   # Hook: estado y navegación del wizard
│
├── components/                    # Componentes compartidos entre rutas
│   ├── Navbar.tsx                 # Barra de navegación para páginas públicas
│   ├── AppNav.tsx                 # Barra de navegación para páginas autenticadas
│   ├── IntermediateLevelEditor.tsx # Editor visual completo para Nivel 1
│   └── AdvancedLevelEditor.tsx    # Editor visual completo para Nivel 2
│
├── lib/                           # Lógica core, tipos y datos de niveles
│   ├── levels.tsx                 # Tipos globales, paletas de bloques, constantes
│   ├── nivel-0/
│   │   └── index.tsx              # 5 misiones y config del editor para Nivel 0
│   ├── nivel-1/
│   │   └── index.tsx              # 5 misiones y config del editor para Nivel 1
│   └── nivel-2/
│       └── index.tsx              # 5 misiones y config del editor para Nivel 2
│
├── public/                        # Assets estáticos servidos en "/"
│   ├── logo/
│   │   └── logo-bekiev1.png       # Logo principal de BEKIE
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
│
├── package.json                   # Dependencias y scripts
├── tsconfig.json                  # TypeScript (strict, path alias @/* → ./*)
├── next.config.ts                 # Configuración mínima de Next.js
├── postcss.config.mjs             # PostCSS con plugin de Tailwind v4
├── eslint.config.mjs              # ESLint 9 + Next.js + TypeScript
├── docker-compose.yml             # Contenedor de desarrollo (Node 20)
├── CLAUDE.md                      # Especificación detallada de Nivel 0
├── AGENTS.md                      # Notas para agentes de IA
└── Context.md                     # Contexto adicional del proyecto
```

---

## Rutas y páginas

| Ruta | Archivo | Propósito | Estado |
|------|---------|-----------|--------|
| `/` | `app/page.tsx` | Landing page pública con hero animado, features y niveles | Completo |
| `/login` | `app/login/page.tsx` | Formulario de inicio de sesión | Stub |
| `/register` | `app/register/page.tsx` | Formulario de registro | Stub |
| `/dashboard` | `app/dashboard/page.tsx` | Panel del estudiante con progreso y misiones activas | Completo (datos mock) |
| `/levels` | `app/levels/page.tsx` | Selector de nivel con barra de progreso por nivel | Completo |
| `/levels/1/editor` | `app/levels/[level]/editor/page.tsx` | Editor + compilador + simulador de Nivel 0 | Completo |
| `/levels/2/editor` | `app/levels/[level]/editor/page.tsx` | Editor de Nivel 1 (usa `IntermediateLevelEditor`) | Completo |
| `/levels/3/editor` | `app/levels/[level]/editor/page.tsx` | Editor de Nivel 2 (usa `AdvancedLevelEditor`) | Completo |
| `/levels/[level]/mission` | `app/levels/[level]/mission/page.tsx` | Briefing de la misión antes del editor | Stub |
| `/robot` | `app/robot/page.tsx` | Panel de control y conexión al ESP32 | Stub |
| `/results` | `app/results/page.tsx` | Resultados, puntuación y retroalimentación | Stub |
| `/teacher` | `app/teacher/page.tsx` | Panel docente (gestión de grupos y progreso) | Stub |
| `/scenario-setup` | `app/scenario-setup/page.tsx` | Wizard de 6 pasos para construir el escenario físico | Parcial |

### Flujo de navegación principal

```
/ (landing)
    │
    ├─▶ /login ──▶ /dashboard ──▶ /levels
    │                                  │
    │                          ┌───────┼───────┐
    │                          ▼       ▼       ▼
    │                       Nivel 0  Nivel 1  Nivel 2
    │                          │       │       │
    │                          ▼       ▼       ▼
    │                      /levels/[1|2|3]/editor
    │                                  │
    │                         (simulación exitosa)
    │                                  │
    │                                  ▼
    │                              /robot (envío WiFi)
    │
    └─▶ /scenario-setup (primera vez, antes de Nivel 0)
```

---

## Módulos core (`lib/`) carpeta

### `lib/levels.tsx` — Tipos y paletas globales

Archivo central de tipos TypeScript que todos los editores y páginas importan.

```typescript
// Identificadores de nivel
type LevelKey = "1" | "2" | "3"

// Direcciones del robot en la cuadrícula (N=0, E=1, S=2, W=3)
type Dir = 0 | 1 | 2 | 3

// Todos los tipos de bloque disponibles en el sistema
type BlockType =
  | "INIT"         // Obligatorio: inicia el programa
  | "FORWARD"      // Avanzar una celda
  | "BACKWARD"     // Retroceder una celda
  | "TURN_RIGHT"   // Girar 90° a la derecha
  | "TURN_LEFT"    // Girar 90° a la izquierda
  | "WAIT"         // Esperar (pausa)
  | "STOP"         // Obligatorio: finaliza el programa
  | "IF_OBS"       // Condicional: si hay obstáculo (Nivel 1)

  | "IF_OBS_ELSE"  // Condicional con rama else (Nivel 1)
  | "WHILE_GOAL"   // Bucle: repetir hasta meta (Nivel 1)
  | "REPEAT"       // Bucle for: repetir N veces (Nivel 2)

interface PaletteBlock {
  type: BlockType
  label: string     // Texto visible en el bloque
  color: string     // Clase Tailwind de color de fondo
  icon: string      // Ícono de Phosphor Icons
}

interface MissionStage {
  id: string
  title: string
  difficulty: "easy" | "basic" | "medium" | "hard" | "final"
  objective: string
  grid: number[][]          // Matriz 5×5: 0=libre, 1=obstáculo, 2=inicio, 3=meta
  requiredSequence: BlockType[]  // Secuencia de bloques esperada (para validación)
  learningOutcomes: string[]
  instructions: string
  victory: string
  tips: string[]
}

// Paleta de bloques del Nivel 0 (exportada para el editor)
const BASIC_PALETTE: PaletteBlock[]

// Orden de desbloqueo de niveles
const LEVEL_ORDER: LevelKey[] = ["1", "2", "3"]
```

---

### `lib/nivel-0/index.tsx` — Misiones del Nivel 0

Contiene la configuración completa del Nivel 0 (Básico — Programación Secuencial).

**Exporta:** `LEVEL_0_STAGES` (array de 5 misiones), `LEVEL_EDITORS` (config del editor para este nivel).

**Misiones:**

| # | Título | Dificultad | Objetivo pedagógico |
|---|--------|-----------|---------------------|
| 1 | Primer recorrido | Fácil | Avanzar en línea recta (3 pasos) |
| 2 | Primer giro | Fácil | Combinar `FORWARD` + `TURN_RIGHT` + `FORWARD` |
| 3 | Ruta con obstáculo | Básico | Rodear un obstáculo planificando manualmente |
| 4 | Ruta en L | Medio | Ruta más larga con giro en L |
| 5 | Desafío secuencial | Final | Ruta compleja con múltiples giros y pasos |

**Cuadrícula:** 5×5 celdas (20 cm × 20 cm cada una → 100 cm × 100 cm total).  
**Bloques permitidos:** Solo la `BASIC_PALETTE` (sin condicionales ni bucles).  
**Sensores:** Ninguno — el estudiante planifica la ruta manualmente.

---

### `lib/nivel-1/index.tsx` — Misiones del Nivel 1

Nivel 1 (Intermedio — Condicionales).

**Exporta:** `LEVEL_2_STAGES`, `INTERMEDIATE_PALETTE` (extiende `BASIC_PALETTE` + `IF_OBS_ELSE`, `WHILE_GOAL`).

**Misiones:**

| # | Título | Dificultad | Objetivo pedagógico |
|---|--------|-----------|---------------------|
| 1 | Cruce inicial | Fácil | Una decisión `IF_OBS_ELSE` simple |
| 2 | Desvío corto | Básico | `if/else` + movimiento condicional |
| 3 | Lectura doble | Medio | Decisión antes de un corredor en L |
| 4 | Ruta repetible | Difícil | Condicionales anidados |
| 5 | (Final) | Final | Navegación autónoma en laberinto |

**Nuevo:** El robot detecta obstáculos en 3 direcciones (frente, izquierda, derecha) mediante sensores virtuales.

---

### `lib/nivel-2/index.tsx` — Misiones del Nivel 2

Nivel 2 (Avanzado — Bucles + Condicionales anidados).

**Exporta:** `LEVEL_3_STAGES`, `ADVANCED_PALETTE` (extiende `INTERMEDIATE_PALETTE` + `REPEAT`).

**Misiones:**

| # | Título | Dificultad | Objetivo pedagógico |
|---|--------|-----------|---------------------|
| 1 | Intro al bucle For | Fácil | Usar `REPEAT` para repetir movimientos |
| 2 | Esquina con For | Básico | Múltiples bucles encadenados |
| 3 | Decisión en el camino | Medio | `REPEAT` + `IF_OBS_ELSE` combinados |
| 4 | For dentro de condición | Difícil | Bucle anidado dentro de condicional |
| 5 | Desafío maestro | Final | Laberinto complejo con lógica anidada |

**Cuadrícula:** 6×6 celdas (más grande que los niveles anteriores).

---

## Componentes reutilizables

### `components/Navbar.tsx`

Barra de navegación de la **landing page** (páginas públicas, sin autenticación).

- Logo + título "BEKIE / WIRED"
- Links ancla: "Cómo funciona", "Niveles", "El equipo" (ocultos en móvil)
- Botones de acción: "Iniciar sesión" (outline), "Registrarse" (cyan sólido)
- Usa `next/link` y `next/image`

### `components/AppNav.tsx`

Barra de navegación para **páginas autenticadas** (dashboard, editor, robot).

Props:
```typescript
interface AppNavProps {
  userName: string
  role: "student" | "teacher"
}
```

- Navegación de estudiante: Dashboard · Niveles · Robot
- Navegación de profesor: Panel docente
- Avatar de usuario + link de cierre de sesión
- Resaltado automático de la ruta activa mediante `usePathname`

### `components/IntermediateLevelEditor.tsx`

Editor visual completo para **Nivel 1**. Maneja:
- Paleta de bloques con condicionales (`IF_OBS_ELSE`, `WHILE_GOAL`)
- Drag & drop para armar el programa
- Compilación y validación de la estructura condicional
- Simulación en cuadrícula 5×5 con lectura de sensores virtuales
- Conexión al robot físico una vez superada la simulación

### `components/AdvancedLevelEditor.tsx`

Editor visual completo para **Nivel 2**. Maneja:
- Paleta extendida con bloques de bucle (`REPEAT`, `WHILE_GOAL`)
- Soporte para bloques anidados (bucle dentro de condicional)
- Compilación con validación de estructuras anidadas
- Simulación en cuadrícula 6×6

---

## Motor de simulación

El motor se ejecuta completamente en el cliente dentro de `app/levels/[level]/editor/page.tsx`.

### Constantes del motor

```typescript
const MAX_STEPS   = 220  // Límite de pasos para evitar bucles infinitos
const MAX_LOOPS   = 10   // Límite de iteraciones de bucle
const SENSOR_STEP_CM = 20  // Cada celda representa 20 cm
```

### Valores de la cuadrícula

```typescript
0  // Celda libre
1  // Obstáculo
2  // Posición de inicio del robot
3  // Meta
```

### Orientaciones del robot

```typescript
0 = Norte (arriba)
1 = Este  (derecha)
2 = Sur   (abajo)
3 = Oeste (izquierda)

// Vectores de movimiento por dirección
DIR_DELTA = [
  [-1,  0],  // Norte: fila -1
  [ 0,  1],  // Este:  columna +1
  [ 1,  0],  // Sur:   fila +1
  [ 0, -1],  // Oeste: columna -1
]
```

### Estados de simulación

```typescript
type SimStatus =
  | "idle"       // Sin ejecutar
  | "running"    // En ejecución (animación paso a paso)
  | "success"    // Robot llegó a la meta
  | "collision"  // Robot chocó con un obstáculo
  | "oob"        // Robot salió de los límites de la cuadrícula
  | "incomplete" // Programa terminó antes de llegar a la meta
```

### Reglas del compilador (Nivel 0)

El compilador valida la estructura antes de permitir la simulación:

| Regla | Error si se incumple |
|-------|---------------------|
| Primer bloque debe ser `INIT` | "Tu programa debe comenzar con el bloque Iniciar misión." |
| Solo un bloque `INIT` permitido | "Solo puedes usar un bloque Iniciar misión." |
| Último bloque debe ser `STOP` | "Tu programa debe terminar con el bloque Detener." |
| Ningún bloque después de `STOP` | "No puede haber instrucciones después de Detener." |
| Sin bloques de nivel avanzado | "Este bloque pertenece a un nivel más avanzado." |
| Al menos un bloque de movimiento | "Agrega al menos un bloque de movimiento." |

### Resultado de la simulación

```typescript
// Exitoso
{
  status: "success",
  message: "Simulación exitosa. El robot llegó a la meta sin chocar.",
  finalPosition: [row, col],
  steps: Block[]
}

// Fallido
{
  status: "collision",
  message: "Simulación fallida. El robot chocó con un obstáculo en la fila 2, columna 3.",
  finalPosition: [row, col]
}
```

### Payload enviado al robot ESP32

Tras una simulación exitosa, el botón "Enviar al robot" queda habilitado y transmite por WiFi:

```json
[
  { "action": "START" },
  { "action": "FORWARD", "steps": 1 },
  { "action": "TURN_RIGHT" },
  { "action": "FORWARD", "steps": 1 },
  { "action": "STOP" }
]
```

---

## Sistema de progresión y misiones

Cada nivel tiene 5 misiones que se desbloquean secuencialmente. El progreso se guarda en `localStorage`.

```
Nivel 0 — Básico (LevelKey "1")
 ├─ Misión 1 — Primer recorrido        (fácil)   [desbloqueada por defecto]
 ├─ Misión 2 — Primer giro             (fácil)   [se desbloquea al completar M1]
 ├─ Misión 3 — Ruta con obstáculo      (básico)
 ├─ Misión 4 — Ruta en L               (medio)
 └─ Misión 5 — Desafío secuencial      (final)
         │
         ▼ (al completar todas las misiones)
Nivel 1 — Intermedio (LevelKey "2")
 ├─ Misión 1 — Cruce inicial           (fácil)
 ├─ Misión 2 — Desvío corto            (básico)
 ├─ Misión 3 — Lectura doble           (medio)
 ├─ Misión 4 — Ruta repetible          (difícil)
 └─ Misión 5 — (Final)                 (final)
         │
         ▼
Nivel 2 — Avanzado (LevelKey "3")
 ├─ Misión 1 — Intro al bucle For      (fácil)
 ├─ Misión 2 — Esquina con For         (básico)
 ├─ Misión 3 — Decisión en el camino   (medio)
 ├─ Misión 4 — For dentro de condición (difícil)
 └─ Misión 5 — Desafío maestro         (final)
```

### Flujo del estudiante en su primera sesión

```
1. Primer inicio de sesión
2. Pantalla de bienvenida
3. /scenario-setup → Wizard de 6 pasos (construir escenario físico 5×5)
4. Checklist de verificación
5. Confirmar escenario → Desbloquea Nivel 0
6. /levels/1/editor → Comienza Misión 1
```

---

## Estado y persistencia

El sistema usa actualmente **`localStorage`** para persistir el progreso del estudiante:

| Clave | Tipo | Descripción |
|-------|------|-------------|
| `"bekie-level-0-progress"` | `number` | Índice de la misión activa en Nivel 0 (0–4) |
| `"bekie-level-2-progress"` | `number` | Índice de la misión activa en Nivel 1 (0–4) |
| `"bekie-level-3-progress"` | `number` | Índice de la misión activa en Nivel 2 (0–4) |

En `app/levels/page.tsx` se usa el hook `useSyncExternalStore` para leer estos valores de forma reactiva y consistente entre SSR y cliente.

**Pendiente de implementar:** base de datos, autenticación real y API routes para sincronización con backend.

---

## Sistema de diseño

### Paleta de colores

| Token | Valor | Uso |
|-------|-------|-----|
| `--accent` | `#22d3ee` (cyan-400) | Acción principal, Nivel 0, foco |
| Violet | `#7c3aed` | Nivel 1 / Intermedio |
| Indigo | `#4f46e5` | Nivel 2 / Avanzado |
| Emerald | `#10b981` | Estados de éxito |
| Amber | `#f59e0b` | Advertencias, `WAIT` |
| Red | `#ef4444` | Errores, `STOP` |

### Tipografía

- **Geist Sans** — cuerpo de texto, UI
- **Geist Mono** — etiquetas de código, bloques de programación

### Clases de utilidad definidas en `globals.css`

```css
.btn-press      /* Escala 0.94 en :active — feedback táctil */
.card-hover     /* translateY(-2px) + sombra en hover */
.block-item     /* Cursor grab, transición de opacidad en drag */
```

### Animaciones (Motion library)

```typescript
const EASE_OUT = [0.23, 1, 0.32, 1]  // Easing elástico suave
// Duración típica: 0.45s–0.6s
// Stagger entre hijos: 0.09s–0.10s
// Soporte para prefers-reduced-motion
```

---

## Instalación y desarrollo

### Requisitos previos

- Node.js 18+ (recomendado 20)
- npm 9+

### Pasos

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd BEKIE

# 2. Instalar dependencias
npm install

# 3. Iniciar servidor de desarrollo
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) en el navegador.

### Variables de entorno

No hay archivo `.env` requerido actualmente (sin backend). Cuando se integre la autenticación y la base de datos, se deberán crear las siguientes variables:

```env
# Ejemplo futuro
NEXT_PUBLIC_API_URL=http://localhost:3001
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=...
ESP32_BROKER_URL=...
```

---

## Docker

El proyecto incluye un `docker-compose.yml` para levantar el entorno de desarrollo en contenedor:

```yaml
# docker-compose.yml (resumen)
services:
  bekie:
    image: node:20
    working_dir: /app
    volumes: [.:/app]
    ports: ["3000:3000"]
    command: npm install && npm run dev
```

### Comandos Docker

```bash
# Levantar contenedor (primera vez o tras resetear)
docker-compose up -d bekie

# Forzar recreación (si hay problemas de estado)
docker rm -f bekie && docker-compose up -d bekie

# Ver logs en tiempo real
docker logs -f bekie

# Detener
docker-compose down
```

---

## Scripts disponibles

```bash
npm run dev     # Servidor de desarrollo en http://localhost:3000
npm run build   # Build de producción optimizado
npm run start   # Servidor de producción (requiere build previo)
npm run lint    # Análisis estático con ESLint 9
```

---

## Estado actual y roadmap

### Funcionalidades completas

- Landing page pública con animaciones
- Editor de bloques drag & drop (Niveles 0, 1 y 2)
- Compilador con validación de estructura
- Simulador 2D paso a paso con visualización de la cuadrícula
- Sistema de 15 misiones (5 por nivel) con progresión
- Selector de niveles con barra de progreso
- Wizard de preparación del escenario físico (6 pasos)
- Dashboard del estudiante con datos mock
- Diseño responsive completo con modo reducción de movimiento

### En desarrollo / pendiente

| Funcionalidad | Estado |
|--------------|--------|
| Autenticación (login/registro) | Stub — sin backend |
| Base de datos | No implementada — datos en localStorage |
| Envío WiFi al ESP32 | Stub — payload definido, sin endpoint real |
| Panel del profesor | Stub |
| Página de resultados y puntuación | Stub |
| Briefing de misión (`/mission`) | Stub |
| Sincronización del escenario físico con la cuadrícula virtual | Parcial |
| Exportar/importar programas | No iniciado |
| Modo multijugador / colaborativo | No iniciado |
| Integración Three.js (simulador 3D) | Dependencias instaladas, no implementado |

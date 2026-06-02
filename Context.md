# Contexto del Sistema: BEKIE / WIRED

BEKIE (WIRED) es una plataforma web educativa de robótica diseñada para enseñar programación estructurada y lógica algorítmica mediante el control de un robot simulado en 2D y un robot físico real basado en microcontroladores ESP32.

---

## 🚀 Información General y Propósito
* **Tipo de Proyecto:** Proyecto universitario de robótica educativa.
* **Carrera:** Ingeniería en Sistemas.
* **Institución:** Universidad Escuela Militar de Ingeniería (EMI).
* **Autores/Integrantes:** Beymar Cruz, Kiara Pino, Evelyn Burgoa.
* **Docente/Asesor:** Lic. Grover M. Magueño Gordillo.
* **Propósito:** Permitir a los estudiantes construir programas mediante bloques visuales e intuitivos, validar la lógica a través de un simulador web interactivo en 2D y, una vez aprobada la simulación, transferir y ejecutar el algoritmo en un robot físico real (ESP32 Rover) mediante conexión WiFi.

---

## 🛠️ Stack Tecnológico
* **Framework:** [Next.js](https://nextjs.org/) (App Router, versión 16) con [React](https://react.dev/) (versión 19) y [TypeScript](https://www.typescriptlang.org/).
* **Estilos:** [Tailwind CSS v4](https://tailwindcss.com/) y PostCSS para un diseño moderno y responsive.
* **Animaciones:** [Framer Motion / Motion](https://motion.dev/) para micro-interacciones suaves y transiciones fluidas de interfaz.
* **Iconografía:** [@phosphor-icons/react](https://phosphoricons.com/) para una iconografía consistente y moderna.
* **Entorno de Ejecución:** Servidor local con soporte para compilación y desarrollo mediante `npm run dev` y empaquetamiento en producción.

---

## 📁 Estructura del Código y Rutas
La aplicación está organizada bajo el App Router de Next.js (`app/`), componentes de interfaz reutilizables (`components/`) y la lógica o configuración de los niveles (`lib/`):

### 1. Páginas de la Aplicación (`app/`)
* [app/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/page.tsx): Landing page principal con información comercial de la plataforma, un simulador en miniatura interactivo y la presentación del equipo de desarrollo.
* [app/login/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/login/page.tsx) y [app/register/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/register/page.tsx): Interfaces para la autenticación y registro de usuarios (estudiantes/docentes).
* [app/dashboard/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/dashboard/page.tsx): Panel de control del estudiante que muestra el progreso global del curso, rachas, estadísticas de misiones resueltas y el acceso rápido a los niveles.
* [app/scenario-setup/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/scenario-setup/page.tsx): Pantalla de inducción y preparación obligatoria del escenario físico 5x5, implementada con Three.js, Fiber, Drei y React Spring.
* [app/levels/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/levels/page.tsx): Selector de niveles de aprendizaje (Nivel 0: Básico y Nivel 1: Intermedio) con el detalle del progreso actual.
* **Rutas Dinámicas de Niveles:**
  * [app/levels/[level]/mission/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/levels/%5Blevel%5D/mission/page.tsx): Presenta el objetivo de aprendizaje del nivel, instrucciones detalladas, condiciones de victoria y desglose de misiones disponibles.
  * [app/levels/[level]/editor/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/levels/%5Blevel%5D/editor/page.tsx): El entorno integrado de desarrollo. Aquí los estudiantes arrastran los bloques de código, visualizan las simulaciones y envían comandos.
* [app/robot/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/robot/page.tsx): Monitor del hardware físico. Muestra la telemetría del robot (batería, temperatura del ESP32, estado de la red WiFi, sensores) y una bitácora detallada de los movimientos que ejecuta.
* [app/results/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/results/page.tsx): Pantalla de retroalimentación que evalúa el desempeño (éxito o fallo, tiempo empleado, cantidad de intentos, puntaje final e instrucciones/sugerencias de mejora).
* [app/teacher/page.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/app/teacher/page.tsx): Dashboard de monitoreo docente. Permite revisar el avance individual de los estudiantes en tiempo real, filtrar por estados y exportar reportes de progreso.

### 2. Componentes de UI (`components/`)
* [components/Navbar.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/components/Navbar.tsx): Barra de navegación pública para la landing page.
* [components/AppNav.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/components/AppNav.tsx): Navegación interna adaptada según el rol del usuario actual (Estudiante / Docente).
* [components/IntermediateLevelEditor.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/components/IntermediateLevelEditor.tsx): Componente del editor de programación y simulación adaptado específicamente para el Nivel 1 (estructuras condicionales y ciclos repetitivos).

### 3. Definición y Lógica de Niveles (`lib/`)
* [lib/levels.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/lib/levels.tsx): Define los tipos globales (`PaletteBlock`, `MissionContent`, `MissionStage`, etc.), los bloques básicos del sistema (avanzar, girar, etc.) y la estructura inicial del **Nivel 0 (Básico - Secuencial)**.
* [lib/nivel-1/index.tsx](file:///c:/Users/Beymar/Desktop/BEKIE/lib/nivel-1/index.tsx): Contiene la configuración específica de los bloques complejos (Si Obstáculo, Mientras no Llegue) y las 5 misiones del **Nivel 1 (Intermedio - Condicionales y Ciclos)**:
  1. *Cruce inicial* (Básico if/else).
  2. *Desvío corto* (Dos giros en if/else).
  3. *Lectura doble* (Desvío en L).
  4. *Ruta repetible* (Condicional combinado con un bucle while).
  5. *Desafío final* (Algoritmo en zigzag con bucle while).

---

## 📐 Preparación del Escenario Físico y Nivel 0 (Básico - Secuencial)
Antes de que un estudiante pueda programar en el Nivel 0, debe completar una etapa de inducción obligatoria para construir el entorno físico del robot, asegurando una conexión real entre lo tangible y la simulación en pantalla.

### 1. Pantalla Obligatoria: Preparación del Escenario
Al iniciar sesión por primera vez, el sistema bloquea el acceso directo a los niveles y presenta la pantalla **"Preparación del escenario"** o **"Construye tu escenario de práctica"**.

* **Objetivo:** Enseñar al estudiante a construir un escenario físico cuadriculado de 5x5 utilizando materiales cotidianos.
* **Materiales Necesarios:** Hojas de papel/cartulina, marcador, regla de $\ge 20$ cm, cinta adhesiva, lápiz y tijeras.
* **Instrucciones de Construcción:**
  1. *Preparar la superficie:* Unir hojas/cartulina hasta conseguir una superficie de $100\text{ cm} \times 100\text{ cm}$.
  2. *Medir las celdas:* Trazar marcas horizontales y verticales cada $20\text{ cm}$.
  3. *Dibujar la cuadrícula:* Trazar las líneas para obtener una matriz de 5 filas y 5 columnas ($25$ celdas en total).
  4. *Marcar el punto de inicio:* Escribir **INICIO** o la letra **A** en la celda inferior izquierda (representa el valor `2` en la matriz).
  5. *Marcar la meta:* Escribir **META** o la letra **B** en la celda superior derecha (representa el valor `3` en la matriz).
  6. *Obstáculos:* Marcar celdas específicas con una **X** o colocar pequeños objetos físicos en ellas (representan el valor `1` en la matriz; las celdas vacías corresponden a `0`).
* **Verificación:** El estudiante debe marcar una lista de verificación digital antes de poder desbloquear e ingresar al Nivel 0.

### 2. Funcionamiento del Nivel 0
El objetivo del Nivel 0 es enseñar al alumno a estructurar secuencias lineales ordenadas de comandos espaciales de arriba hacia abajo sin recurrir a sensores, condicionales ni bucles iterativos.

* **Bloques Disponibles:**
  * `Iniciar misión` (Comienzo obligatorio del algoritmo).
  * `Avanzar` / `Retroceder` (Mueve al robot una celda en su dirección actual o la opuesta).
  * `Girar izquierda` / `Girar derecha` (Cambia la orientación del robot en $90^\circ$ sin desplazarlo).
  * `Esperar` (Pausa de tiempo).
  * `Detener` (Finalización obligatoria del programa).
* **Reglas del Compilador (Nivel 0):**
  * Debe iniciar con `Iniciar misión` y solo puede haber uno en la secuencia.
  * Debe finalizar estrictamente con `Detener`, sin bloques de código posteriores.
  * Debe contener al menos un bloque de movimiento.
  * No se admiten bloques avanzados de condicionales o ciclos.
* **Validación en Simulación 2D:**
  La simulación evalúa paso a paso el programa sobre la matriz virtual. Si el robot colisiona con un obstáculo o sale del tablero, la misión falla. Si termina sin detenerse en la meta, se considera incompleta. El envío de instrucciones en formato JSON estructurado hacia el ESP32 a través de WiFi se habilita únicamente tras una simulación exitosa.
* **Misiones Recomendadas del Nivel 0:**
  1. *Primer recorrido:* Avanzar en línea recta.
  2. *Primer giro:* Cambiar dirección y avanzar.
  3. *Ruta con obstáculo:* Evitar manualmente celdas de obstáculos mediante planificación de giros.
  4. *Ruta en L:* Ejecutar secuencias coordinadas más largas.
  5. *Desafío secuencial:* Esquivar obstáculos en zigzag simple de forma lineal.

## 🎚️ Funcionamiento Detallado del Nivel 1 (Evadir Obstáculos)
El **Nivel 1 (Intermedio)** representa un salto en la curva de aprendizaje, introduciendo lógica condicional e iterativa basada en sensores simulados de distancia.

### 1. Elementos Visuales y Lógicos del Editor
El componente `IntermediateLevelEditor.tsx` maneja una interfaz especializada de bloques anidados para representar la estructura del código:
* **Estructura Condicional (`IF_OBS_ELSE`):** Se renderiza en pantalla como una tarjeta que contiene dos sub-ramas claramente demarcadas:
  * **Si hay obstáculo (Rama verdadera):** Define la acción o corrección (usualmente un giro) si el sensor frontal detecta un obstáculo a menos de 20 cm.
  * **Si no hay obstáculo (Rama falsa/libre):** Define la acción a tomar si el camino al frente está libre.
* **Bucle Iterativo (`WHILE_GOAL`):** Se presenta como una tarjeta contenedora (`Mientras no llegue`) que ejecuta cíclicamente los bloques que se ubiquen en su interior hasta que las coordenadas del robot coincidan con la meta (celda `3`).
* **Avanzar con Pasos Parametrizados (N):** A diferencia de la programación secuencial, en el Nivel 1 los bloques `Avanzar` y `Retroceder` que se anidan dentro de un condicional o un ciclo adquieren un campo numérico configurable `N` (de 1 a 9 pasos). Fuera de estas estructuras, el bloque avanza por defecto una sola celda.

### 2. Reglas Estrictas del Compilador
El sistema implementa una fase de validación estática del algoritmo (Compilación) antes de permitir la simulación y carga. Las reglas evaluadas por el compilador para el Nivel 1 son:
1. **Punto de Entrada:** El programa debe iniciar obligatoriamente con un único bloque `Iniciar misión` (tipo `INIT`).
2. **Uso de Bifurcaciones:** Cada programa de este nivel requiere obligatoriamente y de manera exacta **un bloque** `Si hay obstáculo / Si no hay obstáculo`. No se permiten condicionales simples sin rama libre.
3. **Ciclos Controlados (Misión 4 en adelante):** Las misiones de alta complejidad requieren exactamente **un bloque** `Mientras no llegue`, el cual debe contener exactamente **un único bloque hijo** de tipo `Avanzar` parametrizado con `N` pasos.
4. **Punto de Cierre:** El programa debe finalizar exactamente con un bloque `Detener` (`STOP`). Si existe algún bloque después de este, o si no se incluye, el compilador arrojará un error.

### 3. Las 5 Misiones de Nivel 1
* **Misión 1: Cruce inicial (Dificultad: Fácil - Tutorial interactivo):** 
  * *Objetivo:* Aprender a estructurar un condicional simple y cerrar la ruta con un avance fuera de la decisión.
  * *Escenario:* Cuadrícula 5x5.
  * *Secuencia Esperada:* `Iniciar misión` ➡️ `Si hay obstáculo / Si no hay obstáculo` (Obstáculo: Girar derecha | Libre: Avanzar [N=1]) ➡️ `Avanzar` (fuera del condicional) ➡️ `Detener`.
* **Misión 2: Desvío corto (Dificultad: Básica):**
  * *Objetivo:* Evaluar giros alternativos ante una ruta que bifurca al inicio.
  * *Escenario:* Cuadrícula 5x5 con un obstáculo inmediato.
  * *Secuencia Esperada:* Condicional inicial con giro a la derecha en obstáculo y giro a la izquierda en rama libre, seguido de 2 avances rectos hasta la meta.
* **Misión 3: Lectura doble (Dificultad: Media):**
  * *Objetivo:* Resolver un desvío y entrar a un pasillo en forma de "L" sin depender de pausas.
  * *Escenario:* Cuadrícula 6x6.
  * *Secuencia Esperada:* Condicional al inicio, giro a la izquierda tras salir, y 3 avances en línea recta hasta la meta final.
* **Misión 4: Ruta repetible (Dificultad: Alta):**
  * *Objetivo:* Combinar el condicional con un bucle iterativo para descender por un largo pasillo vertical cerrado.
  * *Escenario:* Cuadrícula 6x6.
  * *Secuencia Esperada:* Condicional corrector inicial, seguido de un ciclo `Mientras no llegue` que repite el bloque `Avanzar` hasta detenerse en la meta inferior.
* **Misión 5: Desafío final (Dificultad: Final):**
  * *Objetivo:* Resolver una compleja ruta en zigzag combinando decisión inicial, tramos de giros alternados y un bucle `while` al final del tramo recto.
  * *Escenario:* Cuadrícula 6x6.
  * *Secuencia Esperada:* Algoritmo estructurado en zigzag con condicional inicial, múltiples giros secuenciales, un bucle `Mientras no llegue` que contiene un `Avanzar` para el tramo final recto, y el cierre con `Detener`.

---

## 📡 Integración con Hardware
El sistema está diseñado para comunicarse con un rover físico dotado de un microcontrolador ESP32. Tras una validación exitosa en el simulador web 2D, el estudiante puede usar la función **Enviar al robot** (o cargar el programa) para transferir el listado de instrucciones procesadas, permitiendo que la máquina ejecute de manera autónoma las secuencias espaciales en el mundo real.


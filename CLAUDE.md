# Estructura de la página web BEKIE/WIRED

## 1. Página principal pública

Esta pantalla aparece antes del login. Sirve para presentar el proyecto.

**Objetivo:** explicar qué es la plataforma y motivar al usuario a ingresar.

**Contenido:**

```text
BEKIE / WIRED
Aprende programación controlando un robot móvil real

[Iniciar sesión] [Registrarse]
```

**Secciones recomendadas:**

| Sección             | Contenido                                    |
| ------------------- | -------------------------------------------- |
| Inicio              | Nombre, logo, frase principal y botones      |
| ¿Qué es BEKIE?      | Explicación breve de la plataforma           |
| ¿Cómo funciona?     | Programa → simula → envía al robot           |
| Niveles             | Nivel 1 Básico y Nivel 2 Intermedio          |
| Beneficios          | Aprendizaje práctico, gamificación, robótica |
| Contacto / Créditos | Universidad, integrantes, docente            |

**Diseño simple:**

```text
┌─────────────────────────────────────────────┐
│ LOGO BEKIE/WIRED        Inicio  Niveles     │
│                         Login  Registro     │
├─────────────────────────────────────────────┤
│                                             │
│ Aprende programación con robótica móvil     │
│ Programa, simula y controla un robot real   │
│                                             │
│ [Iniciar sesión] [Ver niveles]              │
│                                             │
│               Imagen del robot              │
└─────────────────────────────────────────────┘
```

---

## 2. Pantalla de login

**Objetivo:** permitir el ingreso de estudiantes y docentes.

**Contenido:**

```text
Iniciar sesión

Correo electrónico
Contraseña

[Ingresar]

¿No tienes cuenta? Registrarse
```

**Roles:**

| Rol        | Acceso                                         |
| ---------- | ---------------------------------------------- |
| Estudiante | Niveles, misiones, simulador, progreso         |
| Docente    | Monitoreo de estudiantes, resultados y avances |

---

## 3. Pantalla de registro

**Objetivo:** crear una cuenta nueva.

**Campos sugeridos:**

```text
Nombre completo
Correo electrónico
Contraseña
Confirmar contraseña
Rol: Estudiante / Docente

[Crear cuenta]
```

---

## 4. Dashboard del estudiante

**Objetivo:** mostrar el avance del estudiante y acceso rápido a los niveles.

**Contenido:**

```text
Bienvenido, Beymar

Progreso general: 40%

Nivel actual: Nivel 1 Básico
Misiones completadas: 2 de 5

[Continuar aprendizaje]
[Ver niveles]
[Historial de misiones]
```

**Diseño:**

```text
┌─────────────────────────────────────────────┐
│ BEKIE                         Perfil        │
├─────────────────────────────────────────────┤
│ Bienvenido, Beymar                          │
│                                             │
│ Progreso general: █████░░░░░ 40%            │
│                                             │
│ [Nivel 1 Básico]     En progreso            │
│ [Nivel 2 Intermedio] Bloqueado/Disponible   │
│                                             │
│ Última misión: Movimiento básico            │
│ Resultado: Completado                       │
└─────────────────────────────────────────────┘
```

---

# Estructura de niveles

## Nivel 1: Básico — Programación secuencial

**Objetivo educativo:** enseñar lógica secuencial mediante bloques visuales.

El estudiante aprende a ordenar instrucciones simples para mover el robot.

**Bloques disponibles:**

| Categoría      | Bloques                                             |
| -------------- | --------------------------------------------------- |
| Inicio         | Iniciar misión                                      |
| Movimiento     | Avanzar, retroceder, girar izquierda, girar derecha |
| Tiempo         | Esperar                                             |
| Control básico | Repetir                                             |
| Finalización   | Detener, finalizar misión                           |

**Misión del Nivel 1:**

> Guiar al robot virtual desde el punto A hasta el punto B usando bloques de movimiento.

**Pantalla del Nivel 1:**

```text
┌──────────────────┬────────────────────────┬─────────────────────┐
│ BLOQUES          │ PROGRAMA               │ SIMULADOR 2D         │
├──────────────────┼────────────────────────┼─────────────────────┤
│ Movimiento       │ [Iniciar misión]       │ ┌───────────────┐    │
│ [Avanzar]        │ [Avanzar 2 pasos]      │ │ A   □   □   B │    │
│ [Retroceder]     │ [Girar derecha]        │ │ □   ▓   □   □ │    │
│ [Girar derecha]  │ [Avanzar 1 paso]       │ │ 🤖  □   □   □ │    │
│ [Girar izquierda]│ [Detener]              │ └───────────────┘    │
│ [Esperar]        │                        │                     │
│ [Detener]        │ [Probar simulación]    │ Estado: Sin probar   │
│                  │                        │ [Enviar al robot]    │
└──────────────────┴────────────────────────┴─────────────────────┘
```

**Flujo del Nivel 1:**

```text
Selecciona Nivel 1
↓
Lee la misión
↓
Arma bloques simples
↓
Prueba en simulador 2D
↓
Si funciona, habilita “Enviar al robot”
↓
Ejecuta en robot físico o modo demostración
↓
Muestra resultado
```

---

## Nivel 2: Intermedio — Bloques con sensores

**Objetivo educativo:** enseñar condicionales, lectura de sensores y toma de decisiones.

El estudiante ya no solo ordena movimientos, sino que programa respuestas según el entorno.

**Bloques disponibles:**

| Categoría     | Bloques                                                         |
| ------------- | --------------------------------------------------------------- |
| Inicio        | Iniciar misión                                                  |
| Movimiento    | Avanzar, retroceder, girar izquierda, girar derecha, detener    |
| Sensores      | Leer sensor frontal, leer sensor izquierdo, leer sensor derecho |
| Condicionales | Si hay obstáculo, si distancia menor a X cm                     |
| Control       | Repetir hasta llegar a la meta, mientras no haya obstáculo      |
| Finalización  | Finalizar misión                                                |

**Misión del Nivel 2:**

> Programar al robot para avanzar en un escenario con obstáculos y evitarlos usando sensores de proximidad.

**Pantalla del Nivel 2:**

```text
┌────────────────────┬─────────────────────────────┬──────────────────────┐
│ BLOQUES            │ PROGRAMA                    │ SIMULADOR / ROBOT     │
├────────────────────┼─────────────────────────────┼──────────────────────┤
│ Movimiento         │ [Iniciar misión]            │ Escenario 2D          │
│ [Avanzar]          │ [Repetir hasta meta]         │ ┌────────────────┐    │
│ [Girar derecha]    │   [Si obstáculo al frente]  │ │ A  □  ▓  □  B  │    │
│ [Girar izquierda]  │      [Girar derecha]        │ │ □  ▓  □  ▓  □  │    │
│ [Detener]          │   [Sino]                    │ │ 🤖 □  □  □  □  │    │
│                    │      [Avanzar]              │ └────────────────┘    │
│ Sensores           │ [Finalizar misión]          │                      │
│ [Sensor frontal]   │                             │ Sensor frontal: 25cm  │
│ [Distancia < 20cm] │ [Probar simulación]         │ Estado: Conectado     │
│                    │ [Enviar al robot físico]    │ [Detener robot]       │
└────────────────────┴─────────────────────────────┴──────────────────────┘
```

**Flujo del Nivel 2:**

```text
Selecciona Nivel 2
↓
Lee misión con obstáculos
↓
Arma bloques con sensores y condicionales
↓
Prueba en simulador 2D
↓
El simulador valida choques y lógica
↓
Si la simulación es correcta, envía al robot real
↓
El dashboard muestra estado de sensores
↓
Se muestra resultado final
```

---

# Pantallas internas necesarias

## 5. Pantalla de selección de niveles

**Objetivo:** mostrar los dos niveles disponibles.

```text
Selecciona un nivel

┌─────────────────────────────┐
│ Nivel 1: Básico             │
│ Programación secuencial     │
│ Estado: Disponible          │
│ [Entrar]                    │
└─────────────────────────────┘

┌─────────────────────────────┐
│ Nivel 2: Intermedio         │
│ Bloques con sensores        │
│ Estado: Bloqueado/Disponible│
│ [Entrar]                    │
└─────────────────────────────┘
```

**Regla recomendada:**

```text
Nivel 2 se desbloquea cuando el estudiante completa Nivel 1.
```

---

## 6. Pantalla de misión

Antes del editor, el estudiante debe leer la misión.

```text
Nivel 1: Movimiento básico

Objetivo:
Lleva el robot desde el punto A hasta el punto B.

Instrucciones:
Usa bloques de movimiento para crear una secuencia correcta.

Condición de victoria:
El robot debe llegar al punto B sin chocar con obstáculos.

[Comenzar programación]
```

Para Nivel 2:

```text
Nivel 2: Evadir obstáculos

Objetivo:
Programa al robot para avanzar evitando obstáculos.

Instrucciones:
Usa sensores y condicionales para decidir cuándo avanzar o girar.

Condición de victoria:
El robot debe llegar a la meta sin colisionar.

[Comenzar programación]
```

---

## 7. Editor por bloques

Esta pantalla se usa para ambos niveles, pero cambia los bloques disponibles según el nivel.

**Zonas de la pantalla:**

| Zona            | Función                           |
| --------------- | --------------------------------- |
| Barra superior  | Nombre del nivel, misión, usuario |
| Panel izquierdo | Bloques disponibles               |
| Panel central   | Área de programación              |
| Panel derecho   | Simulador 2D                      |
| Panel inferior  | Botones y mensajes                |

**Botones importantes:**

```text
[Guardar]
[Limpiar bloques]
[Probar simulación]
[Enviar al robot]
[Detener robot]
[Volver a niveles]
```

**Regla importante:**

```text
El botón “Enviar al robot” estará deshabilitado hasta que la simulación sea exitosa.
```

---

## 8. Simulador 2D

**Objetivo:** probar la lógica antes de usar el robot físico.

**Elementos del simulador:**

| Elemento            | Significado         |
| ------------------- | ------------------- |
| Robot virtual       | Representa el rover |
| Punto A             | Inicio              |
| Punto B             | Meta                |
| Obstáculos          | Paredes o bloques   |
| Camino libre        | Zona transitable    |
| Indicador de choque | Error de movimiento |
| Cronómetro          | Tiempo de misión    |

**Estados posibles:**

```text
Sin probar
Ejecutando simulación
Simulación exitosa
Error: choque con obstáculo
Error: no llegó a la meta
```

---

## 9. Pantalla de envío al robot físico

Después de pasar la simulación:

```text
Simulación completada correctamente.

El programa está listo para enviarse al robot físico.

Estado del robot: Conectado
Batería: 85%
WiFi: Activo

[Enviar al robot físico]
[Volver al editor]
```

Si no está conectado:

```text
Robot no conectado.

Verifica que el ESP32 esté encendido y conectado a la red WiFi.

[Reintentar conexión]
```

---

## 10. Dashboard del robot

**Objetivo:** mostrar lo que hace el robot en tiempo real.

```text
┌─────────────────────────────────────────────┐
│ Dashboard del robot                         │
├─────────────────────────────────────────────┤
│ Estado: Conectado                           │
│ Movimiento actual: Avanzando                │
│ Sensor frontal: 30 cm                       │
│ Sensor izquierdo: 45 cm                     │
│ Sensor derecho: 20 cm                       │
│ Tiempo de misión: 00:35                     │
│                                             │
│ [Detener robot]                             │
└─────────────────────────────────────────────┘
```

Si usan cámara solo como monitoreo opcional:

```text
Video ESP-CAM: Vista en vivo del escenario
```

Pero para el alcance de 2 niveles, pueden dejar la cámara como opcional.

---

## 11. Pantalla de resultado de misión

Al terminar la ejecución:

```text
Resultado de misión

Nivel: Nivel 1 Básico
Misión: Movimiento básico
Estado: Completado
Tiempo: 00:48
Intentos: 2
Puntaje: 85/100

[Repetir misión]
[Siguiente nivel]
[Volver al dashboard]
```

Si falla:

```text
Estado: Fallido
Motivo: El robot chocó con un obstáculo.
Sugerencia: Revisa los bloques de giro antes de avanzar.

[Intentar de nuevo]
```

---

# Panel del docente

## 12. Dashboard docente

**Objetivo:** monitorear el avance de los estudiantes.

```text
Panel docente

Estudiante        Nivel actual        Progreso     Último resultado
Beymar Cruz       Nivel 1             60%          Completado
Kiara Pino        Nivel 1             40%          En progreso
Evelyn Burgoa     Nivel 2             70%          Fallido
```

El docente puede ver:

| Función               | Descripción                        |
| --------------------- | ---------------------------------- |
| Lista de estudiantes  | Todos los usuarios registrados     |
| Progreso por nivel    | Nivel actual y porcentaje          |
| Resultados            | Misiones completadas o fallidas    |
| Intentos              | Cantidad de pruebas realizadas     |
| Código/bloques usados | Para revisar lógica del estudiante |

---

# Resumen final de pantallas

```text
1. Página principal pública
2. Login
3. Registro
4. Dashboard estudiante
5. Selección de niveles
6. Pantalla de misión
7. Editor por bloques
8. Simulador 2D
9. Envío al robot físico
10. Dashboard del robot
11. Resultado de misión
12. Dashboard docente
```

# Resumen de niveles

```text
Nivel 1: Básico
- Programación por bloques
- Secuencias simples
- Simulador 2D
- Movimiento de punto A a punto B

Nivel 2: Intermedio
- Programación por bloques
- Sensores de proximidad
- Condicionales
- Simulador 2D
- Envío al robot físico
- Evasión de obstáculos
```



# 🤖 Firmware ESP32 & Scripts de Arduino - Sistema BEKIE

Este directorio contiene el firmware y los códigos de Arduino/ESP32 para el robot educativo **ESP32 Rover** del sistema **BEKIE (WIRED)**. 

El firmware principal del robot interactúa directamente con la plataforma web (Next.js) mediante una conexión **Bluetooth Serial (SPP)** y protocolo JSON. El firmware y los ejemplos están estructurados según el hardware del chasis y los niveles de aprendizaje de la plataforma.

---

## 🛠️ Especificaciones de Hardware

El proyecto está diseñado exclusivamente para el siguiente stack de hardware:
* **Microcontrolador:** ESP32 NodeMCU (versión de 38 pines).
* **Driver de Motores:** Puente H L298N (con control PWM en habilitadores ENA/ENB).
* **Motores:** 2 Motores DC N20 con caja reductora (relación 50:1) y encoders magnéticos de efecto Hall en eje.

---

## 📁 Estructura del Proyecto

```text
arduino/
├── README.md                          # Esta documentación
├── firmware_main/                      # Firmware de producción para el ESP32
│   ├── firmware_main.ino              # Inicialización de hardware y bucle principal
│   ├── Config.h                       # Configuración de pines de dirección (IN) y PWM (LEDC)
│   ├── MotorController.h              # Definición de controlador de motores y PID de velocidad
│   ├── MotorController.cpp            # Regulación PID de motores (PWM/Encoders)
│   ├── BluetoothManager.h             # Gestor de puerto serie inalámbrico Bluetooth
│   └── BluetoothManager.cpp           # Intérprete recursivo de comandos JSON y telemetría
│
├── nivel_1_intermedio/                 # Nivel 1: Decisiones y Bucles (Bluetooth + Hardware)
│   ├── logic.h                        # Cabecera de control de motores para misiones
│   ├── mision_1_cruce_inicial/
│   │   └── mision_1_cruce_inicial.ino          # Flujo condicional if/else y avance lineal
│   ├── mision_2_desvio_corto/
│   │   └── mision_2_desvio_corto.ino           # Condicional inicial con giros alternados
│   ├── mision_3_lectura_doble/
│   │   └── mision_3_lectura_doble.ino          # Evasión inicial y corredor en L
│   ├── mision_4_intro_bucle_for/
│   │   └── mision_4_intro_bucle_for.ino        # Bucle Repetir N=4 para escaleras
│   ├── mision_5_esquina_for/
│   │   └── mision_5_esquina_for.ino            # Múltiples bucles For para doblar esquina
│   ├── mision_6_laberinto_u/
│   │   └── mision_6_laberinto_u.ino            # Recorrido largo en U (N=4, N=4, N=2)
│   └── mision_7_doble_zigzag/
│       └── mision_7_doble_zigzag.ino          # Zigzag complejo (N=1, N=2, N=3, N=1)
│
└── nivel_2_avanzado/                   # Nivel 2: Programación en C y Bloques (Bluetooth + Hardware)
    ├── logic_c.h                      # Cabecera de control para modularización en C
    ├── mision_1_escalera_funciones/
    │   └── mision_1_escalera_funciones.ino     # Bloque personalizado en C 'escalon()'
    ├── mision_2_zigzag_arduino/
    │   └── mision_2_zigzag_arduino.ino        # Bloque personalizado en C 'avanceEnL()'
    ├── mision_3_laberinto_espiral/
    │   └── mision_3_laberinto_espiral.ino     # Bloque paramétrico 'avanzarYgirar(celdas)'
    ├── mision_4_desafio_zigzag_doble/
    │   └── mision_4_desafio_zigzag_doble.ino  # Funciones 'tramoIda()' y 'tramoVuelta()'
    └── control_pid_velocidad_lineal/  # Regulación de trayectos rectos compensados
        ├── PID.h                      # Clase genérica PID
        ├── PID.cpp                    # Cálculos con Anti-Windup
        └── control_pid_velocidad_lineal.ino   # Control PID diferencial de motores con encoders
```

---

## ⚙️ Niveles de Ejecución y Control

### 📍 Nivel 0: Básico - Secuencial
* **⚠️ Modo de Ejecución:** **Exclusivamente Entorno Virtual Frontend (Sin Hardware).** Las misiones de este nivel se resuelven y ejecutan enteramente mediante el intérprete 2D del simulador web (Next.js). Al no requerir interacción con el robot real, **no cuenta con carpeta de código Arduino**.

### 🎛️ Nivel 1: Intermedio - Condicionales y Bucles
* **⚡ Modo de Ejecución:** **Hardware Real (ESP32).** Las instrucciones compiladas se transmiten a través de la conexión Bluetooth Serial al dispositivo `ESP32-BEKIE` para ejecutarse en el robot físico.
* **Nota de Lógica:** Debido a la ausencia de sensores de proximidad físicos, los bloques condicionales (`IF_OBS_ELSE`) evalúan de manera predeterminada el camino libre por software para asegurar la continuidad del trayecto en pista.
* **Misiones (1 a 7):**
  1. *Cruce inicial:* Uso de una sola estructura if/else con avance final.
  2. *Desvío corto:* Elección entre dos giros al inicio antes de avanzar.
  3. *Lectura doble:* Condicional inicial y corredor en L.
  4. *Introducción al bucle for:* Repetición fija N=4 para subir la escalera.
  5. *Esquina con for:* Combinación de múltiples bucles repetitivos en una esquina.
  6. *Laberinto en U:* Recorrido de corredores en U con distancias parametrizadas.
  7. *Doble zigzag:* Rutina compleja con giros alternados y bucles For.

### ⚡ Nivel 2: Avanzado - Programación en C y Bloques
* **⚡ Modo de Ejecución:** **Hardware Real (ESP32).** Permite modularizar la lógica encapsulando instrucciones en funciones de C (Bloques Personalizados) y usar control PID autónomo.
* **Misiones (1 a 4) y PID:**
  1. *Escalera de funciones en C:* Modularización del movimiento en la función `escalon()`.
  2. *Pasillo en zigzag con Arduino:* Definición y reuso de la función `avanceEnL()`.
  3. *El laberinto en espiral:* Diseño de funciones paramétricas `avanzarYgirar(N)`.
  4. *Desafío de zigzag doble:* Coordinación compleja con múltiples funciones modulares en C.
  5. *Regulación de Velocidad PID:* Lazo cerrado local que equilibra la potencia PWM de ambos motores N20 en tiempo real a partir de los encoders.

---

## 📡 Protocolo de Comunicación JSON (Bluetooth Serial)

El ESP32 Rover actúa como un puerto serie inalámbrico con el nombre de dispositivo Bluetooth **`ESP32-BEKIE`**. La plataforma web transmite el lote de comandos JSON que representan la secuencia programada por el alumno.

### Ejemplo de comandos enviados desde Next.js:
```json
{
  "level": 1,
  "mission": 4,
  "commands": [
    { "type": "INIT" },
    {
      "type": "IF_OBS_ELSE",
      "condition": "distance < 20",
      "true_branch": [
        { "type": "GIRAR_DER" }
      ],
      "false_branch": [
        { "type": "AVANZAR", "steps": 1 }
      ]
    },
    {
      "type": "REPEAT",
      "steps": 4,
      "loop_branch": [
        { "type": "AVANZAR", "steps": 1 }
      ]
    },
    { "type": "STOP" }
  ]
}
```

### Telemetría enviada desde el ESP32 hacia Next.js:
```json
{
  "status": "RUNNING",
  "connection": "BLUETOOTH",
  "deviceName": "ESP32-BEKIE",
  "battery": 7.84,
  "temperature": 38.2,
  "obstacleDetected": false,
  "debug": {
    "leftEncoder": 1204,
    "rightEncoder": 1198,
    "pidError": 0.05
  }
}
```

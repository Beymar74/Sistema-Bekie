/**
 * @file Config.h
 * @brief Configuración global de hardware (Motores N20, Encoders y L298N) del ESP32 Rover.
 * @author Sistema BEKIE / WIRED
 */

#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// --- CONFIGURACIÓN DE CONEXIÓN BLUETOOTH ---
#define BLUETOOTH_DEVICE_NAME "ESP32-BEKIE"

// --- CONFIGURACIÓN DE HARDWARE (PINES ESP32 - 38 PINES) ---

// Puente H L298N (Control de Motores DC)
// ENA -> PIN_MOTOR_A_PWM, ENB -> PIN_MOTOR_B_PWM (Habilitadores PWM)
// IN1, IN2 -> Dirección Motor Izquierdo; IN3, IN4 -> Dirección Motor Derecho
#define PIN_MOTOR_A_IN1 26   // L298N IN1
#define PIN_MOTOR_A_IN2 27   // L298N IN2
#define PIN_MOTOR_A_PWM 4    // L298N ENA - Canal PWM 0 de ESP32 (LEDC)
#define PIN_MOTOR_B_IN1 18   // L298N IN3
#define PIN_MOTOR_B_IN2 19   // L298N IN4
#define PIN_MOTOR_B_PWM 5    // L298N ENB - Canal PWM 1 de ESP32 (LEDC)

// Encoders de Motores N20 (Lectura por interrupciones en canal A)
#define PIN_ENCODER_A_INT 21 // Canal A Encoder Izquierdo (GPIO 21)
#define PIN_ENCODER_B_INT 22 // Canal A Encoder Derecho (GPIO 22)

// --- PARÁMETROS DEL CONTROLADOR PID ---
// Constantes PID por defecto para control de velocidad lineal (Motores N20)
extern float KP_MOTOR;
extern float KI_MOTOR;
extern float KD_MOTOR;

// Parámetros Físicos del Robot (Ruedas y Motores N20)
#define WHEEL_DIAMETER_MM 43.0f       // Diámetro de rueda típico para motores N20 (43 mm)
#define WHEEL_BASE_MM 95.0f           // Distancia entre ruedas (95 mm para chasis micro-rover)
#define N20_GEAR_RATIO 50.0f          // Reductora N20 (ej. 50:1)
#define ENCODER_PULSES_PER_REV 7      // Pulsos por vuelta del motor (sin reductora, flanco de subida)
#define ENCODER_RESOLUTION (N20_GEAR_RATIO * ENCODER_PULSES_PER_REV) // Ticks por vuelta de rueda (~350 CPR)
#define DISTANCE_PER_TICK_MM (3.14159f * WHEEL_DIAMETER_MM / (float)ENCODER_RESOLUTION)

// Configuración de PWM en ESP32 (LEDC)
#define LEDC_FREQ_HZ 5000
#define LEDC_RESOLUTION_BITS 8 // 0 - 255
#define CHANNEL_MOTOR_A 0
#define CHANNEL_MOTOR_B 1

#endif // CONFIG_H

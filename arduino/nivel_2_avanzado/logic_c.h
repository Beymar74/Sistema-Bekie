/**
 * @file logic_c.h
 * @brief Funciones de bajo nivel para el Nivel 2 (Programación en C).
 * @author Sistema BEKIE / WIRED
 */

#ifndef LOGIC_C_H
#define LOGIC_C_H

#include <Arduino.h>

// Definición de pines para el hardware de motores
#define PIN_M1_IN1 26
#define PIN_M1_IN2 27
#define PIN_M1_PWM 4

#define PIN_M2_IN1 18
#define PIN_M2_IN2 19
#define PIN_M2_PWM 5

/**
 * Inicialización de pines de motores en Arduino/ESP32
 */
void inicializarHardware() {
    pinMode(PIN_M1_IN1, OUTPUT);
    pinMode(PIN_M1_IN2, OUTPUT);
    pinMode(PIN_M2_IN1, OUTPUT);
    pinMode(PIN_M2_IN2, OUTPUT);
    
    // Configuración inicial PWM
    pinMode(PIN_M1_PWM, OUTPUT);
    pinMode(PIN_M2_PWM, OUTPUT);
    
    digitalWrite(PIN_M1_IN1, LOW);
    digitalWrite(PIN_M1_IN2, LOW);
    digitalWrite(PIN_M2_IN1, LOW);
    digitalWrite(PIN_M2_IN2, LOW);
}

/**
 * Mueve los motores a un nivel de potencia PWM
 */
void mover(int pwmIzq, int pwmDer) {
    if (pwmIzq >= 0) {
        digitalWrite(PIN_M1_IN1, HIGH);
        digitalWrite(PIN_M1_IN2, LOW);
    } else {
        digitalWrite(PIN_M1_IN1, LOW);
        digitalWrite(PIN_M1_IN2, HIGH);
    }

    if (pwmDer >= 0) {
        digitalWrite(PIN_M2_IN1, HIGH);
        digitalWrite(PIN_M2_IN2, LOW);
    } else {
        digitalWrite(PIN_M2_IN1, LOW);
        digitalWrite(PIN_M2_IN2, HIGH);
    }

    analogWrite(PIN_M1_PWM, abs(pwmIzq));
    analogWrite(PIN_M2_PWM, abs(pwmDer));
}

/**
 * Avanza una celda física de la cuadrícula (20 cm)
 */
void avanzarPaso() {
    Serial.println("[C] Avanzando 1 celda...");
    mover(180, 180);
    delay(1200);
    mover(0, 0);
    delay(200);
}

/**
 * Gira 90 grados exactos a la derecha
 */
void girarDerecha90() {
    Serial.println("[C] Girando 90° Derecha...");
    mover(180, -180);
    delay(600);
    mover(0, 0);
    delay(200);
}

/**
 * Gira 90 grados exactos a la izquierda
 */
void girarIzquierda90() {
    Serial.println("[C] Girando 90° Izquierda...");
    mover(-180, 180);
    delay(600);
    mover(0, 0);
    delay(200);
}

/**
 * Detiene los motores del robot
 */
void detenerRobot() {
    Serial.println("[C] Deteniendo robot.");
    mover(0, 0);
}

#endif // LOGIC_C_H

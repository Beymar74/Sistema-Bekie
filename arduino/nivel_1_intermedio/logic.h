/**
 * @file logic.h
 * @brief Funciones de sensores y estructuras de decisión para el Nivel 1 (Intermedio).
 * @author Sistema BEKIE / WIRED
 */

#ifndef LOGIC_H
#define LOGIC_H

#include <Arduino.h>

// Definición de Pines de Motores
#define MOTOR_IZQ_IN1 26
#define MOTOR_IZQ_IN2 27
#define MOTOR_DER_IN1 18
#define MOTOR_DER_IN2 19

/**
 * Inicialización de pines de motores
 */
void inicializarHardware() {
    pinMode(MOTOR_IZQ_IN1, OUTPUT);
    pinMode(MOTOR_IZQ_IN2, OUTPUT);
    pinMode(MOTOR_DER_IN1, OUTPUT);
    pinMode(MOTOR_DER_IN2, OUTPUT);
    
    // Detener motores
    digitalWrite(MOTOR_IZQ_IN1, LOW);
    digitalWrite(MOTOR_IZQ_IN2, LOW);
    digitalWrite(MOTOR_DER_IN1, LOW);
    digitalWrite(MOTOR_DER_IN2, LOW);
}

/**
 * Comprobación de proximidad
 * @return Retorna siempre false en ausencia de sensor de obstáculo físico
 */
bool hayObstaculo() {
    return false; 
}

/**
 * Mueve los motores del robot
 */
void moverMotores(int potenciaIzq, int potenciaDer) {
    // Motor Izquierdo
    if (potenciaIzq >= 0) {
        digitalWrite(MOTOR_IZQ_IN1, HIGH);
        digitalWrite(MOTOR_IZQ_IN2, LOW);
    } else {
        digitalWrite(MOTOR_IZQ_IN1, LOW);
        digitalWrite(MOTOR_IZQ_IN2, HIGH);
    }

    // Motor Derecho
    if (potenciaDer >= 0) {
        digitalWrite(MOTOR_DER_IN1, HIGH);
        digitalWrite(MOTOR_DER_IN2, LOW);
    } else {
        digitalWrite(MOTOR_DER_IN1, LOW);
        digitalWrite(MOTOR_DER_IN2, HIGH);
    }
}

void avanzarPaso() {
    Serial.println("Acción: Avanzando 1 celda...");
    moverMotores(200, 200); // PWM a ~80%
    delay(1200);           // Tiempo para cruzar 20 cm
    moverMotores(0, 0);     // Detener
    delay(200);
}

void girarDerecha90() {
    Serial.println("Acción: Girando 90 grados a la derecha...");
    moverMotores(200, -200); // Giro sobre eje
    delay(600);
    moverMotores(0, 0);
    delay(200);
}

void girarIzquierda90() {
    Serial.println("Acción: Girando 90 grados a la izquierda...");
    moverMotores(-200, 200);
    delay(600);
    moverMotores(0, 0);
    delay(200);
}

void detenerRobot() {
    Serial.println("Acción: DETENER ROBOT.");
    moverMotores(0, 0);
}

#endif // LOGIC_H

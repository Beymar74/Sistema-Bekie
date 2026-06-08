/**
 * @file mision_2_desvio_corto.ino
 * @brief Nivel 1 - Misión 2: Desvío Corto
 * @details Evaluar giros alternativos ante una ruta que bifurca al inicio.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 2 (DESVÍO CORTO) ---");

  inicializarHardware();
  delay(1000);

  // [BIFURCACIÓN CONDICIONAL AL INICIO]
  if (hayObstaculo()) {
    // Rama verdadera: Girar a la derecha
    Serial.println("Obstáculo detectado en sensor infrarrojo!");
    girarDerecha90();
  } 
  else {
    // Rama falsa: Girar a la izquierda
    girarIzquierda90();
  }

  // Avanzar dos celdas hasta la meta
  avanzarPaso();
  avanzarPaso();

  detenerRobot();
  Serial.println("--- MISIÓN 2 COMPLETADA ---");
}

void loop() {
}

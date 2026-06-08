/**
 * @file mision_1_cruce_inicial.ino
 * @brief Nivel 1 - Misión 1: Cruce Inicial
 * @details Estructurar un condicional simple y cerrar la ruta con un avance fuera de la decisión.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 1 (CRUCE INICIAL) ---");

  inicializarHardware();
  delay(1000);

  // [BIFURCACIÓN CONDICIONAL]
  if (hayObstaculo()) {
    // Rama verdadera: Hay obstáculo
    Serial.println("Obstáculo detectado en sensor infrarrojo!");
    girarDerecha90();
  } 
  else {
    // Rama falsa: Camino libre
    avanzarPaso();
  }

  // Acción fuera del condicional
  avanzarPaso();

  detenerRobot();
  Serial.println("--- MISIÓN 1 COMPLETADA ---");
}

void loop() {
}

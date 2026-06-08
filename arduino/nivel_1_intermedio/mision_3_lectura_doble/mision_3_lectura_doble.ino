/**
 * @file mision_3_lectura_doble.ino
 * @brief Nivel 1 - Misión 3: Lectura Doble
 * @details Resolver un desvío y entrar a un pasillo en forma de L.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 3 (LECTURA DOBLE) ---");

  inicializarHardware();
  delay(1000);

  // [BIFURCACIÓN CONDICIONAL]
  if (hayObstaculo()) {
    Serial.println("Obstáculo detectado en sensor infrarrojo!");
    girarIzquierda90();
  } 
  else {
    avanzarPaso();
  }

  // Girar para enfilar el pasillo largo
  girarIzquierda90();

  // Avanzar 3 celdas en línea recta
  avanzarPaso();
  avanzarPaso();
  avanzarPaso();

  detenerRobot();
  Serial.println("--- MISIÓN 3 COMPLETADA ---");
}

void loop() {
}

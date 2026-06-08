/**
 * @file mision_4_intro_bucle_for.ino
 * @brief Nivel 1 - Misión 4: Introducción al Bucle For
 * @details Usar un bucle para repetir una secuencia de escaleras 4 veces.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 4 (INTRO AL BUCLE FOR) ---");

  inicializarHardware();
  delay(1000);

  // [BUCLE REPETITIVO - FOR LOOP N=4]
  Serial.println("[FOR] Subiendo escaleras (4 iteraciones)...");
  for (int i = 0; i < 4; i++) {
    Serial.printf("[FOR] Iteración: %d/4\n", i + 1);
    avanzarPaso();
    girarDerecha90();
    avanzarPaso();
    girarIzquierda90();
    delay(200);
  }

  detenerRobot();
  Serial.println("--- MISIÓN 4 COMPLETADA ---");
}

void loop() {
}

/**
 * @file mision_7_doble_zigzag.ino
 * @brief Nivel 1 - Misión 7: Doble Zigzag
 * @details Planificar una secuencia de giros alternados y bucles para sortear un pasillo de obstáculos dobles.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 7 (DOBLE ZIGZAG) ---");

  inicializarHardware();
  delay(1000);

  // 1. Paso inicial
  avanzarPaso();
  girarDerecha90();

  // 2. Primer bucle (N=1)
  Serial.println("[FOR 1] Avanzando 1 celda...");
  for (int i = 0; i < 1; i++) {
    avanzarPaso();
  }
  girarIzquierda90();

  // 3. Segundo bucle (N=2)
  Serial.println("[FOR 2] Avanzando 2 celdas...");
  for (int i = 0; i < 2; i++) {
    avanzarPaso();
  }
  girarDerecha90();

  // 4. Tercer bucle (N=3)
  Serial.println("[FOR 3] Avanzando 3 celdas...");
  for (int i = 0; i < 3; i++) {
    avanzarPaso();
  }
  girarIzquierda90();

  // 5. Cuarto bucle (N=1)
  Serial.println("[FOR 4] Avanzando 1 celda...");
  for (int i = 0; i < 1; i++) {
    avanzarPaso();
  }

  detenerRobot();
  Serial.println("--- MISIÓN 7 COMPLETADA ---");
}

void loop() {
}

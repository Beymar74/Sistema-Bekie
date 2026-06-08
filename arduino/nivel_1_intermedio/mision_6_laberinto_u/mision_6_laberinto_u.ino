/**
 * @file mision_6_laberinto_u.ino
 * @brief Nivel 1 - Misión 6: Laberinto en U
 * @details Recorrer un pasillo en forma de U usando bucles for secuenciales.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 6 (LABERINTO EN U) ---");

  inicializarHardware();
  delay(1000);

  // 1. Primer tramo recto (Avanzar 4 celdas)
  Serial.println("[FOR 1] Avanzando 4 celdas...");
  for (int i = 0; i < 4; i++) {
    avanzarPaso();
    delay(100);
  }

  // Giro 1
  girarDerecha90();
  delay(300);

  // 2. Segundo tramo recto (Avanzar 4 celdas)
  Serial.println("[FOR 2] Avanzando 4 celdas...");
  for (int i = 0; i < 4; i++) {
    avanzarPaso();
    delay(100);
  }

  // Giro 2
  girarDerecha90();
  delay(300);

  // 3. Tercer tramo recto (Avanzar 2 celdas hasta la meta)
  Serial.println("[FOR 3] Avanzando 2 celdas...");
  for (int i = 0; i < 2; i++) {
    avanzarPaso();
    delay(100);
  }

  detenerRobot();
  Serial.println("--- MISIÓN 6 COMPLETADA ---");
}

void loop() {
}

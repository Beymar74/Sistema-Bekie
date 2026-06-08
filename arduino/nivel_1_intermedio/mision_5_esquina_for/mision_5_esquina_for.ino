/**
 * @file mision_5_esquina_for.ino
 * @brief Nivel 1 - Misión 5: Esquina con For
 * @details Avanzar por un pasillo recto usando repetición y luego girar hacia la meta lateral.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic.h"

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 1: MISIÓN 5 (ESQUINA CON FOR) ---");

  inicializarHardware();
  delay(1000);

  // 1. Primer tramo recto (Avanzar 4 celdas)
  Serial.println("[FOR 1] Avanzando 4 celdas...");
  for (int i = 0; i < 4; i++) {
    avanzarPaso();
    delay(100);
  }

  // 2. Giro en la esquina
  girarDerecha90();
  delay(300);

  // 3. Segundo tramo recto (Avanzar 4 celdas)
  Serial.println("[FOR 2] Avanzando 4 celdas...");
  for (int i = 0; i < 4; i++) {
    avanzarPaso();
    delay(100);
  }

  detenerRobot();
  Serial.println("--- MISIÓN 5 COMPLETADA ---");
}

void loop() {
}

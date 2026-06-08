/**
 * @file mision_3_laberinto_espiral.ino
 * @brief Nivel 2 - Misión 3: El Laberinto en Espiral
 * @details Implementa una función en C paramétrica para recorrer rectas y
 *          doblar continuamente hacia adentro hasta llegar al centro del espiral.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic_c.h"

// --- BLOQUE PERSONALIZADO PARAMÉTRICO EN C ---
void avanzarYgirar(int celdas) {
  Serial.printf("[FUNCION] avanzarYgirar(celdas = %d)\n", celdas);
  for (int i = 0; i < celdas; i++) {
    avanzarPaso();
  }
  girarDerecha90();
}

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 2: MISIÓN 3 (LABERINTO EN ESPIRAL) ---");

  inicializarHardware();
  delay(1000);

  // Recorrido de espiral cuadrada decreciente (4 celdas -> 4 celdas -> 2 celdas -> 2 celdas...)
  avanzarYgirar(4);
  delay(200);
  avanzarYgirar(4);
  delay(200);
  avanzarYgirar(2);
  delay(200);
  avanzarYgirar(2);
  delay(200);

  detenerRobot();
  Serial.println("--- MISIÓN 3 COMPLETADA EN C ---");
}

void loop() {
}

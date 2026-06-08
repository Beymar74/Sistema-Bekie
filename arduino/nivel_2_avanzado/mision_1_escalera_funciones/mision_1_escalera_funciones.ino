/**
 * @file mision_1_escalera_funciones.ino
 * @brief Nivel 2 - Misión 1: Escalera de Funciones en C
 * @details Este sketch implementa una función modular en C ('escalon')
 *          para automatizar la subida de escaleras sin duplicar bloques.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic_c.h"

// --- BLOQUE PERSONALIZADO EN C (FUNCIÓN MODULAR) ---
void escalon() {
  Serial.println("[FUNCION] Ejecutando bloque personalizado: escalon()");
  avanzarPaso();
  girarDerecha90();
  avanzarPaso();
  girarIzquierda90();
}

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 2: MISIÓN 1 (ESCALERA DE FUNCIONES) ---");

  inicializarHardware();
  delay(1000);

  // Subir la escalera de 4 peldaños llamando a la función modular en un bucle for
  Serial.println("[MAIN] Iniciando ascenso...");
  for (int i = 0; i < 4; i++) {
    escalon();
    delay(200);
  }

  detenerRobot();
  Serial.println("--- MISIÓN 1 COMPLETADA EN C ---");
}

void loop() {
}

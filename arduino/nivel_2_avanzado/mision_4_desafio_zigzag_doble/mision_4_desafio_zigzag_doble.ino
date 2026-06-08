/**
 * @file mision_4_desafio_zigzag_doble.ino
 * @brief Nivel 2 - Misión 4: Desafío de Zigzag Doble
 * @details Solución modular en C para recorrer un laberinto de zigzag
 *          de alta complejidad usando múltiples bloques personalizados.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic_c.h"

// --- FUNCIONES MODULARES EN C ---

// Tramo de ida en la S del zigzag
void tramoIda() {
  Serial.println("[FUNCION] Ejecutando: tramoIda()");
  avanzarPaso();
  girarDerecha90();
  avanzarPaso();
  girarIzquierda90();
}

// Tramo de vuelta en la S del zigzag
void tramoVuelta() {
  Serial.println("[FUNCION] Ejecutando: tramoVuelta()");
  avanzarPaso();
  girarIzquierda90();
  avanzarPaso();
  girarDerecha90();
}

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 2: MISIÓN 4 (DESAFÍO ZIGZAG DOBLE) ---");

  inicializarHardware();
  delay(1000);

  // Ejecución coordinada del laberinto
  tramoIda();
  delay(200);
  
  tramoVuelta();
  delay(200);

  tramoIda();
  delay(200);

  // Avanzar tramo final recto a la meta
  avanzarPaso();

  detenerRobot();
  Serial.println("--- MISIÓN 4 COMPLETADA EN C ---");
}

void loop() {
}

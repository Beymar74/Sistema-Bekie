/**
 * @file mision_2_zigzag_arduino.ino
 * @brief Nivel 2 - Misión 2: Pasillo en Zigzag con Arduino
 * @details Define y reutiliza una función modular en C ('avanceEnL') 
 *          para guiar al robot a través de giros y avances alternados.
 * @author Sistema BEKIE / WIRED
 */

#include "../logic_c.h"

// --- BLOQUE PERSONALIZADO EN C ---
// Realiza el avance en L y deja al robot orientado en la dirección original
void avanceEnL() {
  Serial.println("[FUNCION] Ejecutando bloque personalizado: avanceEnL()");
  avanzarPaso();
  girarDerecha90();
  avanzarPaso();
  avanzarPaso();
  girarIzquierda90();
}

void setup() {
  Serial.begin(115200);
  Serial.println("--- INICIANDO NIVEL 2: MISIÓN 2 (ZIGZAG CON ARDUINO) ---");

  inicializarHardware();
  delay(1000);

  // Ejecución de la rutina modular para recorrer el zigzag de la pista
  avanceEnL();
  delay(300);
  
  avanceEnL();
  delay(300);

  detenerRobot();
  Serial.println("--- MISIÓN 2 COMPLETADA EN C ---");
}

void loop() {
}

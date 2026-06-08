/**
 * @file firmware_main.ino
 * @brief Código principal del firmware del ESP32 Rover para el proyecto BEKIE.
 * @details Este sketch inicializa el hardware mínimo (Motores L298N y Encoders N20),
 *          establece la conexión Bluetooth y ejecuta el bucle de actualización.
 * @author Sistema BEKIE / WIRED
 */

#include "Config.h"
#include "MotorController.h"
#include "BluetoothManager.h"

// Instancias globales de control del robot
MotorController motors;
BluetoothManager bluetoothManager(&motors);

void setup() {
  // Inicialización de comunicación serial para depuración
  Serial.begin(115200);
  while (!Serial) {
    delay(10); // Esperar a que la consola serial esté lista
  }
  
  Serial.println("\n=============================================");
  Serial.println("         INICIALIZANDO ESP32 ROVER           ");
  Serial.println("               SISTEMA BEKIE                 ");
  Serial.println("=============================================");

  // Inicializar controlador de motores y encoders
  motors.init();
  Serial.println("[OK] Motores N20 y encoders inicializados.");

  // Configurar e iniciar conexión Bluetooth
  bluetoothManager.init();
  Serial.println("[OK] Conectividad Bluetooth iniciada.");

  Serial.println("\n>>> Robot listo para recibir comandos por Bluetooth <<<");
  Serial.println("=============================================\n");
}

void loop() {
  // Procesar eventos de Bluetooth (recepción de comandos JSON y envío de telemetría)
  bluetoothManager.update();

  // Pequeño retardo para ceder tiempo de CPU al backend de FreeRTOS
  delay(1);
}

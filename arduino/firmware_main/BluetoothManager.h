/**
 * @file BluetoothManager.h
 * @brief Declaración de la clase para controlar Bluetooth SPP y protocolo JSON.
 * @author Sistema BEKIE / WIRED
 */

#ifndef BLUETOOTH_MANAGER_H
#define BLUETOOTH_MANAGER_H

#include "Config.h"
#include <BluetoothSerial.h>
#include <ArduinoJson.h>

// Declaración anticipada para evitar dependencias circulares
class MotorController;

class BluetoothManager {
public:
    BluetoothManager(MotorController* motors);
    void init();
    void update();

    // Envío de telemetría hacia el cliente conectado (Next.js via Bluetooth Serial)
    void sendTelemetry(float errorPID = 0.0f);

private:
    BluetoothSerial SerialBT;
    MotorController* motors;

    unsigned long lastTelemetryTime;
    bool hasActiveClient;

    // Procesamiento de comandos JSON
    void processCommandJSON(const char* jsonStr);
    void executeCommand(JsonObject cmd);
};

#endif // BLUETOOTH_MANAGER_H

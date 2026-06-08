/**
 * @file BluetoothManager.cpp
 * @brief Implementación de la comunicación Bluetooth SPP y parseo de comandos de BEKIE.
 * @author Sistema BEKIE / WIRED
 */

#include "BluetoothManager.h"
#include "MotorController.h"

BluetoothManager::BluetoothManager(MotorController* motors)
    : motors(motors), lastTelemetryTime(0), hasActiveClient(false) {}

void BluetoothManager::init() {
    Serial.print("Iniciando Bluetooth con nombre: ");
    Serial.println(BLUETOOTH_DEVICE_NAME);

    if (!SerialBT.begin(BLUETOOTH_DEVICE_NAME)) {
        Serial.println("¡Error al iniciar Bluetooth!");
    } else {
        Serial.println("Bluetooth inicializado correctamente.");
    }

    // Configurar LED integrado del ESP32 (GPIO 2)
    pinMode(2, OUTPUT);
    digitalWrite(2, LOW);
}

void BluetoothManager::update() {
    bool currentlyConnected = SerialBT.hasClient();
    
    if (currentlyConnected != hasActiveClient) {
        hasActiveClient = currentlyConnected;
        if (hasActiveClient) {
            Serial.println("¡Cliente Bluetooth conectado!");
            digitalWrite(2, HIGH); // LED de placa encendido con conexión
        } else {
            Serial.println("Cliente Bluetooth desconectado.");
            digitalWrite(2, LOW);
        }
    }

    if (SerialBT.available()) {
        String data = SerialBT.readStringUntil('\n');
        data.trim();
        if (data.length() > 0) {
            Serial.print("Comando Bluetooth recibido: ");
            Serial.println(data);
            processCommandJSON(data.c_str());
        }
    }

    if (hasActiveClient && (millis() - lastTelemetryTime > 250)) {
        lastTelemetryTime = millis();
        sendTelemetry();
    }
}

void BluetoothManager::processCommandJSON(const char* jsonStr) {
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, jsonStr);

    if (error) {
        Serial.print("Error al deserializar JSON Bluetooth: ");
        Serial.println(error.c_str());
        return;
    }

    if (doc.containsKey("commands")) {
        JsonArray commands = doc["commands"];
        Serial.printf("Procesando lote Bluetooth de %d comandos del Nivel %d\n", commands.size(), doc["level"].as<int>());

        for (JsonObject cmd : commands) {
            executeCommand(cmd);
            delay(300);
        }
    }
}

void BluetoothManager::executeCommand(JsonObject cmd) {
    if (!cmd.containsKey("type")) return;

    const char* type = cmd["type"];
    int steps = cmd.containsKey("steps") ? cmd["steps"].as<int>() : 1;

    Serial.printf("Ejecutando bloque: %s\n", type);

    if (strcmp(type, "INIT") == 0) {
        motors->resetEncoders();
    }
    else if (strcmp(type, "AVANZAR") == 0) {
        float distMM = steps * 200.0f; // Celdas de 20cm
        motors->driveStraight(distMM, 180.0f);
    }
    else if (strcmp(type, "RETROCEDER") == 0) {
        float distMM = -steps * 200.0f;
        motors->driveStraight(distMM, 180.0f);
    }
    else if (strcmp(type, "GIRAR_IZQ") == 0) {
        motors->turnToAngle(-90.0f);
    }
    else if (strcmp(type, "GIRAR_DER") == 0) {
        motors->turnToAngle(90.0f);
    }
    else if (strcmp(type, "ESPERAR") == 0) {
        delay(1000);
    }
    else if (strcmp(type, "STOP") == 0) {
        motors->stop();
    }
    else if (strcmp(type, "IF_OBS_ELSE") == 0) {
        // Al no disponer de sensor de proximidad físico, se evalúa por software
        // simulando camino libre (false) para evitar bloqueos del programa
        bool obstaculo = false; 
        Serial.println("[INTERPRETE] Evaluando IF: Sin sensor físico de obstáculo (asumiendo libre).");
        
        if (obstaculo) {
            Serial.println("[INTERPRETE] Rama VERDADERA (Ignorado por hardware)");
            if (cmd.containsKey("true_branch")) {
                JsonArray trueBranch = cmd["true_branch"];
                for (JsonObject subCmd : trueBranch) {
                    executeCommand(subCmd);
                    delay(200);
                }
            }
        } else {
            Serial.println("[INTERPRETE] Rama FALSA (Camino libre)");
            if (cmd.containsKey("false_branch")) {
                JsonArray falseBranch = cmd["false_branch"];
                for (JsonObject subCmd : falseBranch) {
                    executeCommand(subCmd);
                    delay(200);
                }
            }
        }
    }
    else if (strcmp(type, "WHILE_GOAL") == 0) {
        // Bucle iterativo de movimiento
        int maxIteraciones = 10;
        int conteo = 0;
        
        Serial.println("[INTERPRETE] Iniciando ciclo WHILE_GOAL");
        while (conteo < maxIteraciones) {
            if (cmd.containsKey("loop_branch")) {
                JsonArray loopBranch = cmd["loop_branch"];
                for (JsonObject subCmd : loopBranch) {
                    executeCommand(subCmd);
                    delay(200);
                }
            }
            conteo++;
        }
        Serial.println("[INTERPRETE] Bucle WHILE_GOAL finalizado.");
    }
}

void BluetoothManager::sendTelemetry(float errorPID) {
    JsonDocument doc;
    
    doc["status"] = "RUNNING";
    doc["connection"] = "BLUETOOTH";
    doc["deviceName"] = BLUETOOTH_DEVICE_NAME;
    doc["battery"] = 7.84; // Telemetría virtualizada (Voltaje de LiPo 2S nominal)
    doc["temperature"] = 38.2; // Temperatura virtual de la placa
    doc["obstacleDetected"] = false;
    
    JsonObject debug = doc.createNestedObject("debug");
    debug["leftEncoder"] = motors->getLeftEncoderTicks();
    debug["rightEncoder"] = motors->getRightEncoderTicks();
    debug["pidError"] = errorPID;
    
    String output;
    serializeJson(doc, output);
    SerialBT.println(output);
}

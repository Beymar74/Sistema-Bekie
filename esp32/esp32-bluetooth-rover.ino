/**
 * BEKIE ESP32 Rover Firmware (Bluetooth Low Energy)
 * 
 * Hardware:
 * - ESP32 38-pin Dev Module
 * - Driver Puente H L298N
 * - Motores N20 DC con Encoders de cuadratura (caja reductora)
 * 
 * Conexión recomendada:
 * - L298N IN1 -> ESP32 GPIO 26
 * - L298N IN2 -> ESP32 GPIO 27
 * - L298N ENA (PWM) -> ESP32 GPIO 25
 * - L298N IN3 -> ESP32 GPIO 12
 * - L298N IN4 -> ESP32 GPIO 13
 * - L298N ENB (PWM) -> ESP32 GPIO 14
 * 
 * Encoders:
 * - Motor Izquierdo Encoder Canal A -> ESP32 GPIO 34 (Interrupción)
 * - Motor Izquierdo Encoder Canal B -> ESP32 GPIO 35 (Lectura de dirección)
 * - Motor Derecho Encoder Canal A -> ESP32 GPIO 32 (Interrupción)
 * - Motor Derecho Encoder Canal B -> ESP32 GPIO 33 (Lectura de dirección)
 */

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>

// Pines del L298N
const int ENA = 25;
const int IN1 = 26;
const int IN2 = 27;
const int ENB = 14;
const int IN3 = 12;
const int IN4 = 13;

// Pines del Encoder
const int ENCODER_L_A = 34;
const int ENCODER_L_B = 35;
const int ENCODER_R_A = 32;
const int ENCODER_R_B = 33;

// Configuración PWM
const int PWM_FREQ = 1000;
const int PWM_RES = 8; // Resolución de 8 bits (0-255)

// Velocidad por defecto (0 a 255)
const int SPEED_NORMAL = 180;
const int SPEED_TURN = 160;

// Variables de contadores de Encoders (deben ser volátiles)
volatile long ticksLeft = 0;
volatile long ticksRight = 0;

// ==========================================
// CALIBRACIÓN (Modifica según tu robot)
// ==========================================
// Número de ticks del encoder para avanzar 1 celda del escenario (20 cm)
const long TICKS_ONE_CELL = 750; 
// Número de ticks del encoder para realizar un giro exacto de 90°
const long TICKS_90_DEGREE_TURN = 380; 

// BLE Config
#define SERVICE_UUID        "4fafc201-1fb5-459e-8fcc-c5c9c331914b"
#define CHARACTERISTIC_UUID "beb5483e-36e1-4688-b7f5-ea07361b26a8"

bool deviceConnected = false;

// ISR (Rutinas de Servicio de Interrupción) para los Encoders
void IRAM_ATTR isrEncoderLeft() {
  if (digitalRead(ENCODER_L_B) == HIGH) {
    ticksLeft++;
  } else {
    ticksLeft--;
  }
}

void IRAM_ATTR isrEncoderRight() {
  if (digitalRead(ENCODER_R_B) == HIGH) {
    ticksRight++;
  } else {
    ticksRight--;
  }
}

// Detiene por completo los motores
void stopMotors() {
  ledcWrite(ENA, 0);
  ledcWrite(ENB, 0);
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, LOW);
}

// Mueve el robot hacia adelante basándose en los encoders
void moveForward(int steps) {
  ticksLeft = 0;
  ticksRight = 0;
  long targetTicks = TICKS_ONE_CELL * steps;

  Serial.print("Avanzando. Target Ticks: ");
  Serial.println(targetTicks);

  // Configura pines para ir adelante
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  // Iniciar movimiento
  ledcWrite(ENA, SPEED_NORMAL);
  ledcWrite(ENB, SPEED_NORMAL);

  // Esperar a que se alcance el objetivo de ticks
  while (abs(ticksLeft) < targetTicks && abs(ticksRight) < targetTicks) {
    delay(5);
  }
  
  stopMotors();
  delay(200); // Estabilizar
}

// Mueve el robot hacia atrás
void moveBackward(int steps) {
  ticksLeft = 0;
  ticksRight = 0;
  long targetTicks = TICKS_ONE_CELL * steps;

  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, SPEED_NORMAL);
  ledcWrite(ENB, SPEED_NORMAL);

  while (abs(ticksLeft) < targetTicks && abs(ticksRight) < targetTicks) {
    delay(5);
  }

  stopMotors();
  delay(200);
}

// Gira 90° a la derecha
void turnRight() {
  ticksLeft = 0;
  ticksRight = 0;

  // Izquierda adelante, Derecha atrás
  digitalWrite(IN1, HIGH);
  digitalWrite(IN2, LOW);
  digitalWrite(IN3, LOW);
  digitalWrite(IN4, HIGH);

  ledcWrite(ENA, SPEED_TURN);
  ledcWrite(ENB, SPEED_TURN);

  while (abs(ticksLeft) < TICKS_90_DEGREE_TURN && abs(ticksRight) < TICKS_90_DEGREE_TURN) {
    delay(5);
  }

  stopMotors();
  delay(200);
}

// Gira 90° a la izquierda
void turnLeft() {
  ticksLeft = 0;
  ticksRight = 0;

  // Izquierda atrás, Derecha adelante
  digitalWrite(IN1, LOW);
  digitalWrite(IN2, HIGH);
  digitalWrite(IN3, HIGH);
  digitalWrite(IN4, LOW);

  ledcWrite(ENA, SPEED_TURN);
  ledcWrite(ENB, SPEED_TURN);

  while (abs(ticksLeft) < TICKS_90_DEGREE_TURN && abs(ticksRight) < TICKS_90_DEGREE_TURN) {
    delay(5);
  }

  stopMotors();
  delay(200);
}

// Ejecutar comandos
void processCommand(String cmd) {
  cmd.trim();
  Serial.print("Procesando comando: ");
  Serial.println(cmd);

  if (cmd == "START") {
    Serial.println("Inicio de misión");
  } 
  else if (cmd.startsWith("FORWARD")) {
    int steps = 1;
    int sepIndex = cmd.indexOf(':');
    if (sepIndex != -1) {
      steps = cmd.substring(sepIndex + 1).toInt();
    }
    moveForward(steps);
  } 
  else if (cmd.startsWith("BACKWARD")) {
    int steps = 1;
    int sepIndex = cmd.indexOf(':');
    if (sepIndex != -1) {
      steps = cmd.substring(sepIndex + 1).toInt();
    }
    moveBackward(steps);
  } 
  else if (cmd == "TURN_RIGHT") {
    turnRight();
  } 
  else if (cmd == "TURN_LEFT") {
    turnLeft();
  } 
  else if (cmd.startsWith("WAIT")) {
    int ms = 1000;
    int sepIndex = cmd.indexOf(':');
    if (sepIndex != -1) {
      ms = cmd.substring(sepIndex + 1).toInt();
    }
    delay(ms);
  } 
  else if (cmd == "STOP") {
    stopMotors();
    Serial.println("Fin de misión / Robot Detenido");
  }
}

// Callback del servidor BLE para gestionar conexiones
class MyServerCallbacks: public BLEServerCallbacks {
    void onConnect(BLEServer* pServer) {
      deviceConnected = true;
      Serial.println("¡Dispositivo conectado por BLE!");
    };

    void onDisconnect(BLEServer* pServer) {
      deviceConnected = false;
      Serial.println("Dispositivo desconectado. Iniciando publicidad...");
      pServer->startAdvertising();
    }
};

// Callback de la característica BLE que recibe los datos del navegador
class CommandCallbacks: public BLECharacteristicCallbacks {
    void onWrite(BLECharacteristic *pCharacteristic) {
      String value = String(pCharacteristic->getValue().c_str());
      
      if (value.length() > 0) {
        processCommand(value);
      }
    }
};

void setup() {
  Serial.begin(115200);

  // Configuración de pines de Motores
  pinMode(IN1, OUTPUT);
  pinMode(IN2, OUTPUT);
  pinMode(IN3, OUTPUT);
  pinMode(IN4, OUTPUT);

  // Configurar PWM con el API moderno de ESP32 Core v3.0+
  // ledcAttach configura directamente la frecuencia y resolución en el pin del motor
  ledcAttach(ENA, PWM_FREQ, PWM_RES);
  ledcAttach(ENB, PWM_FREQ, PWM_RES);

  // Configuración de pines de Encoders
  pinMode(ENCODER_L_A, INPUT);
  pinMode(ENCODER_L_B, INPUT);
  pinMode(ENCODER_R_A, INPUT);
  pinMode(ENCODER_R_B, INPUT);

  // Vincular interrupciones
  attachInterrupt(digitalPinToInterrupt(ENCODER_L_A), isrEncoderLeft, RISING);
  attachInterrupt(digitalPinToInterrupt(ENCODER_R_A), isrEncoderRight, RISING);

  // Detener motores al iniciar
  stopMotors();

  // Inicializar dispositivo Bluetooth BLE
  BLEDevice::init("ESP32-BEKIE");
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Crear servicio y característica
  BLEService *pService = pServer->createService(SERVICE_UUID);
  BLECharacteristic *pCharacteristic = pService->createCharacteristic(
                                         CHARACTERISTIC_UUID,
                                         BLECharacteristic::PROPERTY_READ |
                                         BLECharacteristic::PROPERTY_WRITE |
                                         BLECharacteristic::PROPERTY_NOTIFY
                                       );

  pCharacteristic->setCallbacks(new CommandCallbacks());
  pCharacteristic->addDescriptor(new BLE2902());

  pService->start();

  // Empezar publicidad BLE
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);  
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();

  Serial.println("Firmware ESP32-BEKIE listo. Esperando conexión Bluetooth...");
}

void loop() {
  static unsigned long lastPrint = 0;
  if (millis() - lastPrint > 500) {
    lastPrint = millis();
    if (deviceConnected) {
      Serial.printf("Encoder L: %ld | Encoder R: %ld\n", ticksLeft, ticksRight);
    }
  }
}

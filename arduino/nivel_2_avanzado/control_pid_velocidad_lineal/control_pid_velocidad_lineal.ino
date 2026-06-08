/**
 * @file control_pid_velocidad_lineal.ino
 * @brief Control de Velocidad Lineal en Bucle Cerrado con PID (Nivel 2).
 * @details Este sketch regula la potencia PWM del driver L298N de forma individual 
 *          para cada motor N20 basándose en los ticks medidos por los encoders.
 *          Garantiza trayectorias rectas compensando la fricción y las diferencias mecánicas.
 * @author Sistema BEKIE / WIRED
 */

#include "PID.h"

// Pines del Puente H L298N
#define PIN_M1_IN1 26
#define PIN_M1_IN2 27
#define PIN_M1_PWM 4  // ENA (PWM Motor Izquierdo)

#define PIN_M2_IN1 18
#define PIN_M2_IN2 19
#define PIN_M2_PWM 5  // ENB (PWM Motor Derecho)

// Pines de Encoders N20
#define PIN_ENCODER_IZQ 21
#define PIN_ENCODER_DER 22

// Parámetros Físicos del Robot (Ruedas y Encoders N20)
const float DIAMETRO_RUEDA_MM = 43.0f;
const float TICK_POR_VUELTA = 350.0f; // Reductora 50:1 * 7 CPR
const float DISTANCIA_POR_TICK_MM = (3.14159f * DIAMETRO_RUEDA_MM) / TICK_POR_VUELTA;

// Constantes del regulador PID de velocidad
const float KP = 2.50f;
const float KI = 0.15f;
const float KD = 0.05f;

// Consigna: Velocidad objetivo en mm/s
const float VELOCIDAD_OBJETIVO = 120.0f; 

// Instancias del controlador PID para cada motor
PID pidIzq(KP, KI, KD, 0.0f, 255.0f);
PID pidDer(KP, KI, KD, 0.0f, 255.0f);

// Variables de conteo de ticks (con volatile por ser modificadas en interrupciones)
volatile long ticksIzq = 0;
volatile long ticksDer = 0;

unsigned long ultimoTiempo = 0;

// ISR (Interrupt Service Routine) para encoders
void IRAM_ATTR handleEncoderIzq() {
  ticksIzq++;
}

void IRAM_ATTR handleEncoderDer() {
  ticksDer++;
}

void setup() {
  Serial.begin(115200);
  Serial.println("===============================================");
  Serial.println("   REGULADOR PID DE VELOCIDAD LINEAL INICIADO  ");
  Serial.println("===============================================");

  // Configurar pines de dirección del motor
  pinMode(PIN_M1_IN1, OUTPUT);
  pinMode(PIN_M1_IN2, OUTPUT);
  pinMode(PIN_M2_IN1, OUTPUT);
  pinMode(PIN_M2_IN2, OUTPUT);

  // Configurar pines de habilitación PWM
  pinMode(PIN_M1_PWM, OUTPUT);
  pinMode(PIN_M2_PWM, OUTPUT);

  // Sentido de marcha hacia adelante
  digitalWrite(PIN_M1_IN1, HIGH);
  digitalWrite(PIN_M1_IN2, LOW);
  digitalWrite(PIN_M2_IN1, HIGH);
  digitalWrite(PIN_M2_IN2, LOW);

  // Configurar entradas de encoders y adjuntar interrupciones
  pinMode(PIN_ENCODER_IZQ, INPUT_PULLUP);
  pinMode(PIN_ENCODER_DER, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(PIN_ENCODER_IZQ), handleEncoderIzq, RISING);
  attachInterrupt(digitalPinToInterrupt(PIN_ENCODER_DER), handleEncoderDer, RISING);

  ultimoTiempo = millis();
  pidIzq.reset();
  pidDer.reset();
  delay(1000);
}

void loop() {
  unsigned long tiempoActual = millis();
  float dt = (float)(tiempoActual - ultimoTiempo) / 1000.0f; // Tiempo en segundos
  
  if (dt >= 0.05f) { // Actualizar cada 50ms (Frecuencia de muestreo 20Hz)
    ultimoTiempo = tiempoActual;

    // Leer ticks de forma atómica desactivando interrupciones brevemente
    noInterrupts();
    long ticksLeidosIzq = ticksIzq;
    long ticksLeidosDer = ticksDer;
    ticksIzq = 0;
    ticksDer = 0;
    interrupts();

    // Calcular velocidad lineal actual en mm/s
    float velocidadActualIzq = (ticksLeidosIzq * DISTANCIA_POR_TICK_MM) / dt;
    float velocidadActualDer = (ticksLeidosDer * DISTANCIA_POR_TICK_MM) / dt;

    // Calcular salida de potencia PWM (0-255) mediante los reguladores PID
    float pwmIzq = pidIzq.compute(VELOCIDAD_OBJETIVO, velocidadActualIzq, dt);
    float pwmDer = pidDer.compute(VELOCIDAD_OBJETIVO, velocidadActualDer, dt);

    // Escribir salidas PWM en los habilitadores del driver L298N
    analogWrite(PIN_M1_PWM, (int)pwmIzq);
    analogWrite(PIN_M2_PWM, (int)pwmDer);

    // Depuración serial de velocidades
    Serial.printf("REF: %.1f | VIzq: %.1f -> PWM: %d | VDer: %.1f -> PWM: %d\n", 
                  VELOCIDAD_OBJETIVO, velocidadActualIzq, (int)pwmIzq, velocidadActualDer, (int)pwmDer);
  }
}

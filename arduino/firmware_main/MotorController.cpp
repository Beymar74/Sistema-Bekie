/**
 * @file MotorController.cpp
 * @brief Implementación del regulador PID y control por hardware de motores del ESP32 Rover.
 * @author Sistema BEKIE / WIRED
 */

#include "MotorController.h"

// Definición de las variables globales de ganancia PID
float KP_MOTOR = 2.45f;
float KI_MOTOR = 0.12f;
float KD_MOTOR = 0.05f;

float KP_LINEA = 3.20f;
float KI_LINEA = 0.00f;
float KD_LINEA = 0.85f;

// Inicialización de variables estáticas de encoders
volatile long MotorController::leftTicks = 0;
volatile long MotorController::rightTicks = 0;

// === CLASE PIDCONTROLLER ===

PIDController::PIDController(float kp, float ki, float kd, float minOutput, float maxOutput)
    : kp(kp), ki(ki), kd(kd), minOutput(minOutput), maxOutput(maxOutput), prevError(0.0f), integral(0.0f) {}

void PIDController::setGains(float kp, float ki, float kd) {
    this->kp = kp;
    this->ki = ki;
    this->kd = kd;
}

float PIDController::compute(float setpoint, float feedback, float dt) {
    if (dt <= 0.0f) return 0.0f;

    float error = setpoint - feedback;
    
    // Término Proporcional
    float P = kp * error;

    // Término Integral con protección de saturación (Anti-Windup)
    integral += error * dt;
    float I = ki * integral;
    if (I > maxOutput) {
        I = maxOutput;
        integral = maxOutput / ki;
    } else if (I < minOutput) {
        I = minOutput;
        integral = minOutput / ki;
    }

    // Término Derivativo
    float derivative = (error - prevError) / dt;
    float D = kd * derivative;

    // Suma de salidas
    float output = P + I + D;

    // Limitar salida
    if (output > maxOutput) output = maxOutput;
    else if (output < minOutput) output = minOutput;

    prevError = error;
    return output;
}

void PIDController::reset() {
    prevError = 0.0f;
    integral = 0.0f;
}

// === CLASE MOTORCONTROLLER ===

MotorController::MotorController()
    : pidLeft(KP_MOTOR, KI_MOTOR, KD_MOTOR, -255.0f, 255.0f),
      pidRight(KP_MOTOR, KI_MOTOR, KD_MOTOR, -255.0f, 255.0f),
      currentSpeedLeft(0.0f), currentSpeedRight(0.0f),
      targetSpeedLeft(0.0f), targetSpeedRight(0.0f),
      lastUpdateTime(0) {}

void MotorController::init() {
    // Configuración de pines de dirección del puente H
    pinMode(PIN_MOTOR_A_IN1, OUTPUT);
    pinMode(PIN_MOTOR_A_IN2, OUTPUT);
    pinMode(PIN_MOTOR_B_IN1, OUTPUT);
    pinMode(PIN_MOTOR_B_IN2, OUTPUT);

    // Configuración de PWM usando la API LEDC de ESP32
    ledcAttachChannel(PIN_MOTOR_A_PWM, LEDC_FREQ_HZ, LEDC_RESOLUTION_BITS, CHANNEL_MOTOR_A);
    ledcAttachChannel(PIN_MOTOR_B_PWM, LEDC_FREQ_HZ, LEDC_RESOLUTION_BITS, CHANNEL_MOTOR_B);

    // Configuración de pines de Encoders con resistencias Pull-Up internas
    pinMode(PIN_ENCODER_A_INT, INPUT_PULLUP);
    pinMode(PIN_ENCODER_B_INT, INPUT_PULLUP);
    
    // Adjuntar interrupciones al flanco de subida (RISING)
    attachInterrupt(digitalPinToInterrupt(PIN_ENCODER_A_INT), handleLeftEncoder, RISING);
    attachInterrupt(digitalPinToInterrupt(PIN_ENCODER_B_INT), handleRightEncoder, RISING);

    stop();
    resetEncoders();
    lastUpdateTime = millis();
}

void MotorController::resetEncoders() {
    noInterrupts();
    leftTicks = 0;
    rightTicks = 0;
    interrupts();
}

void MotorController::handleLeftEncoder() {
    leftTicks++;
}

void MotorController::handleRightEncoder() {
    rightTicks++;
}

void MotorController::setMotorDirections(bool leftForward, bool rightForward) {
    digitalWrite(PIN_MOTOR_A_IN1, leftForward ? HIGH : LOW);
    digitalWrite(PIN_MOTOR_A_IN2, leftForward ? LOW : HIGH);
    
    digitalWrite(PIN_MOTOR_B_IN1, rightForward ? HIGH : LOW);
    digitalWrite(PIN_MOTOR_B_IN2, rightForward ? LOW : HIGH);
}

void MotorController::driveRaw(int leftPWM, int rightPWM) {
    // Definir la dirección de los motores según el signo del PWM
    setMotorDirections(leftPWM >= 0, rightPWM >= 0);

    // Aplicar valor absoluto y escribir la potencia de modulación analógica
    ledcWriteChannel(CHANNEL_MOTOR_A, abs(leftPWM));
    ledcWriteChannel(CHANNEL_MOTOR_B, abs(rightPWM));
}

void MotorController::stop() {
    targetSpeedLeft = 0.0f;
    targetSpeedRight = 0.0f;
    driveRaw(0, 0);
    pidLeft.reset();
    pidRight.reset();
}

void MotorController::driveStraight(float targetDistanceMM, float targetSpeedMMS) {
    resetEncoders();
    pidLeft.reset();
    pidRight.reset();

    long targetTicks = abs(targetDistanceMM / DISTANCE_PER_TICK_MM);
    targetSpeedLeft = targetSpeedMMS;
    targetSpeedRight = targetSpeedMMS;

    bool forward = targetDistanceMM >= 0;
    setMotorDirections(forward, forward);

    unsigned long startTime = millis();
    unsigned long lastTime = startTime;

    // Bucle cerrado de distancia y corrección PID
    while ((abs(leftTicks) < targetTicks) || (abs(rightTicks) < targetTicks)) {
        unsigned long currentTime = millis();
        float dt = (currentTime - lastTime) / 1000.0f;
        
        if (dt >= 0.01f) { // Actualizar la estimación a 100Hz
            lastTime = currentTime;

            // Medir velocidades actuales basadas en ticks de encoders
            noInterrupts();
            long currentLeft = leftTicks;
            long currentRight = rightTicks;
            leftTicks = 0;
            rightTicks = 0;
            interrupts();

            // Velocidad medida en mm/s
            currentSpeedLeft = (currentLeft * DISTANCE_PER_TICK_MM) / dt;
            currentSpeedRight = (currentRight * DISTANCE_PER_TICK_MM) / dt;

            // Calcular salida PID para cada motor para mantener velocidades equilibradas
            float outputLeft = pidLeft.compute(targetSpeedLeft, currentSpeedLeft, dt);
            float outputRight = pidRight.compute(targetSpeedRight, currentSpeedRight, dt);

            // Ajustar PWM dinámicamente
            int pwmLeft = constrain(outputLeft, 0, 255);
            int pwmRight = constrain(outputRight, 0, 255);

            ledcWriteChannel(CHANNEL_MOTOR_A, pwmLeft);
            ledcWriteChannel(CHANNEL_MOTOR_B, pwmRight);
        }
        
        // Timeout de seguridad en caso de bloqueo mecánico
        if (millis() - startTime > 10000) {
            break; 
        }
        delay(5);
    }
    stop();
}

void MotorController::turnToAngle(float targetAngleDeg) {
    resetEncoders();
    pidLeft.reset();
    pidRight.reset();

    // Calcular el arco que describe el giro del chasis diferencial
    float wheelBaseRadius = WHEEL_BASE_MM / 2.0f;
    float arcLengthMM = (2.0f * 3.14159f * wheelBaseRadius) * (abs(targetAngleDeg) / 360.0f);
    long targetTicks = abs(arcLengthMM / DISTANCE_PER_TICK_MM);

    bool rotateRight = targetAngleDeg >= 0;
    setMotorDirections(rotateRight, !rotateRight); // Motores giran en sentidos contrarios

    float searchSpeed = 150.0f; // mm/s
    targetSpeedLeft = searchSpeed;
    targetSpeedRight = searchSpeed;

    unsigned long startTime = millis();
    unsigned long lastTime = startTime;

    while ((abs(leftTicks) < targetTicks) || (abs(rightTicks) < targetTicks)) {
        unsigned long currentTime = millis();
        float dt = (currentTime - lastTime) / 1000.0f;

        if (dt >= 0.01f) {
            lastTime = currentTime;

            noInterrupts();
            long currentLeft = leftTicks;
            long currentRight = rightTicks;
            leftTicks = 0;
            rightTicks = 0;
            interrupts();

            currentSpeedLeft = (currentLeft * DISTANCE_PER_TICK_MM) / dt;
            currentSpeedRight = (currentRight * DISTANCE_PER_TICK_MM) / dt;

            float outputLeft = pidLeft.compute(targetSpeedLeft, currentSpeedLeft, dt);
            float outputRight = pidRight.compute(targetSpeedRight, currentSpeedRight, dt);

            int pwmLeft = constrain(outputLeft, 0, 200);
            int pwmRight = constrain(outputRight, 0, 200);

            ledcWriteChannel(CHANNEL_MOTOR_A, pwmLeft);
            ledcWriteChannel(CHANNEL_MOTOR_B, pwmRight);
        }

        if (millis() - startTime > 5000) {
            break;
        }
        delay(5);
    }
    stop();
}

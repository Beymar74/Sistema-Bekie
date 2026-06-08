/**
 * @file MotorController.h
 * @brief Declaración del controlador de motores con bucle cerrado PID para velocidad y guiado.
 * @author Sistema BEKIE / WIRED
 */

#ifndef MOTOR_CONTROLLER_H
#define MOTOR_CONTROLLER_H

#include "Config.h"

// Clase básica para representar un controlador PID individual
class PIDController {
public:
    PIDController(float kp, float ki, float kd, float minOutput, float maxOutput);
    void setGains(float kp, float ki, float kd);
    float compute(float setpoint, float feedback, float dt);
    void reset();

private:
    float kp;
    float ki;
    float kd;
    float minOutput;
    float maxOutput;
    float prevError;
    float integral;
};

// Clase principal para el manejo de motores del robot
class MotorController {
public:
    MotorController();
    void init();
    
    // Control de Movimientos Lineales y Rotacionales (Bucle Cerrado)
    void driveStraight(float targetDistanceMM, float targetSpeedMMS);
    void turnToAngle(float targetAngleDeg);
    void driveRaw(int leftPWM, int rightPWM);
    void stop();

    // Actualización periódica llamada desde una interrupción o tarea FreeRTOS
    void updatePID(float dt);

    // Getters de telemetría de motores
    long getLeftEncoderTicks() { return leftTicks; }
    long getRightEncoderTicks() { return rightTicks; }
    void resetEncoders();

    // Manejadores de interrupciones para encoders
    static void handleLeftEncoder();
    static void handleRightEncoder();

private:
    PIDController pidLeft;
    PIDController pidRight;
    
    static volatile long leftTicks;
    static volatile long rightTicks;

    float currentSpeedLeft;
    float currentSpeedRight;
    float targetSpeedLeft;
    float targetSpeedRight;

    unsigned long lastUpdateTime;

    void setMotorDirections(bool leftForward, bool rightForward);
};

#endif // MOTOR_CONTROLLER_H

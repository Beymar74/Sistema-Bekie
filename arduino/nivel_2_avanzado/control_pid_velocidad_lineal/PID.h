/**
 * @file PID.h
 * @brief Clase PID para el control de velocidad en bucle cerrado de motores DC.
 * @author Sistema BEKIE / WIRED
 */

#ifndef PID_H
#define PID_H

#include <Arduino.h>

class PID {
public:
    PID(float kp, float ki, float kd, float outMin, float outMax);
    float compute(float setpoint, float input, float dt);
    void setTunings(float kp, float ki, float kd);
    void reset();

    float getLastError() { return lastError; }
    float getIntegralTerm() { return integral; }

private:
    float kp;
    float ki;
    float kd;
    
    float outMin;
    float outMax;

    float lastError;
    float integral;
};

#endif // PID_H

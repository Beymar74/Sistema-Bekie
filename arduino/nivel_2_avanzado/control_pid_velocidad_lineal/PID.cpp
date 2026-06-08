/**
 * @file PID.cpp
 * @brief Implementación matemática del lazo PID para control de velocidad.
 * @author Sistema BEKIE / WIRED
 */

#include "PID.h"

PID::PID(float kp, float ki, float kd, float outMin, float outMax)
    : kp(kp), ki(ki), kd(kd), outMin(outMin), outMax(outMax), lastError(0.0f), integral(0.0f) {}

void PID::setTunings(float kp, float ki, float kd) {
    this->kp = kp;
    this->ki = ki;
    this->kd = kd;
}

void PID::reset() {
    lastError = 0.0f;
    integral = 0.0f;
}

float PID::compute(float setpoint, float input, float dt) {
    if (dt <= 0.0f) return 0.0f;

    float error = setpoint - input;
    float pTerm = kp * error;

    integral += error * dt;
    float iTerm = ki * integral;
    
    // Anti-Windup
    if (iTerm > outMax) {
        iTerm = outMax;
        integral = outMax / ki;
    } else if (iTerm < outMin) {
        iTerm = outMin;
        integral = outMin / ki;
    }

    float derivative = (error - lastError) / dt;
    float dTerm = kd * derivative;

    float output = pTerm + iTerm + dTerm;

    if (output > outMax) output = outMax;
    else if (output < outMin) output = min(output, outMin);

    lastError = error;
    return output;
}

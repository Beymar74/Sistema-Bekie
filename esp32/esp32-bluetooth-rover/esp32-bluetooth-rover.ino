void setup() {
  pinMode(2, OUTPUT); // LED integrado del ESP32-WROOM está en pin 2
}

void loop() {
  digitalWrite(2, HIGH); // Enciende
  delay(500);
  digitalWrite(2, LOW);  // Apaga
  delay(500);
}
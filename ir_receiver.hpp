#pragma once

#include <Arduino.h>
#include <IRremote.h>

#define IR_PIN 53
#define PWR_BTN_PIN 33
#define LIGHTS_PIN 25

IRrecv irrecv(IR_PIN);
decode_results results;

void setup() {
  pinMode(LIGHTS_PIN, OUTPUT);
  pinMode(PWR_BTN_PIN, OUTPUT);
  Serial.begin(9600);
  irrecv.enableIRIn();
}

int lightsPower = LOW;

void loop() {
  if (irrecv.decode(&results)) {
    switch (results.value) {
      case 0xFFA25D:
        Serial.println("POWER");
        digitalWrite(PWR_BTN_PIN, HIGH);
        delay(100);
        digitalWrite(PWR_BTN_PIN, LOW);
        break;
      case 0xFFE21D:
        Serial.println("FUNC/STOP");
        lightsPower = !lightsPower;
        digitalWrite(LIGHTS_PIN, lightsPower);
        break;
      case 0xFF629D:
        Serial.println("VOL+");
        break;
      case 0xFF22DD:
        Serial.println("FAST BACK");
        break;
      case 0xFF02FD:
        Serial.println("PAUSE");
        break;
      case 0xFFC23D:
        Serial.println("FAST FORWARD");
        break;
      case 0xFFE01F:
        Serial.println("DOWN");
        break;
      case 0xFFA857:
        Serial.println("VOL-");
        break;
      case 0xFF906F:
        Serial.println("UP");
        break;
      case 0xFF9867:
        Serial.println("EQ");
        break;
      case 0xFFB04F:
        Serial.println("ST/REPT");
        break;
      case 0xFF6897:
        Serial.println("0");
        break;
      case 0xFF30CF:
        Serial.println("1");
        break;
      case 0xFF18E7:
        Serial.println("2");
        break;
      case 0xFF7A85:
        Serial.println("3");
        break;
      case 0xFF10EF:
        Serial.println("4");
        break;
      case 0xFF38C7:
        Serial.println("5");
        break;
      case 0xFF5AA5:
        Serial.println("6");
        break;
      case 0xFF42BD:
        Serial.println("7");
        break;
      case 0xFF4AB5:
        Serial.println("8");
        break;
      case 0xFF52AD:
        Serial.println("9");
        break;
      case 0xFFFFFFFF:
        Serial.println("REPEAT LAST");
        break;
      default:
        /* other button */;
    }
    delay(500);
    irrecv.resume();
  }
}

## Introduction

Smart home technology has a reputation for being expensive, proprietary, and unnecessarily complex. Off-the-shelf smart switches cost ₹1,500–₹3,000 each, require their own apps, break on cloud service outages, and offer zero flexibility. This project is the antidote.

The **ESP32-C3 Room Automation Controller** is a fully custom smart room controller built on a **hand-designed and hand-assembled PCB**, housing an **ESP32-C3 microcontroller** in a compact enclosure. It controls up to **three AC appliances** through three independent channels, with the flexibility to operate via **Alexa voice commands**, **any IR remote you already own**, or **physical wall toggle switches** — simultaneously and reliably.

This is an end-to-end embedded systems project: from schematic capture in EasyEDA, through PCB assembly and enclosure drilling, to firmware development and cloud IoT registration. Every component was chosen deliberately. Every trace was routed by hand. The result is a device that fits inside a standard electrical junction box and has been deployed in a real room, running 24/7.

---

## Why ESP32-C3?

The **ESP32-C3** was chosen over the more common ESP32 or ESP8266 for several compelling reasons:

| Feature | ESP8266 | ESP32 | ESP32-C3 |
|---|---|---|---|
| Core Architecture | Xtensa LX106 | Xtensa LX7 (dual) | RISC-V (single) |
| Wi-Fi | 802.11 b/g/n | 802.11 b/g/n | 802.11 b/g/n |
| Bluetooth | ❌ None | BT Classic + BLE 4.2 | BLE 5.0 |
| GPIO Count | 17 | 34 | 22 |
| USB Native | ❌ (needs CH340) | ❌ (needs CP2102) | ✅ USB-C native |
| Price | Low | Medium | Low |
| Package Size | Moderate | Large | Very compact |
| Security | Basic | Basic | Enhanced (secure boot, flash encryption) |

For this application, the ESP32-C3's **native USB** (no separate USB-UART chip needed), **BLE 5.0**, and **compact form factor** make it the ideal choice. The single core is entirely sufficient for the control logic workload.

---

## System Architecture

The controller manages three distinct input modalities and three output channels, all running concurrently in firmware:

```
┌─────────────────────────────────────────────────────────────────┐
│                     INPUT MODALITIES                             │
│                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │  Alexa (Cloud)   │  │   IR Remote      │  │  Manual      │  │
│  │  via Sinric Pro  │  │   (Any remote)   │  │  Switches    │  │
│  │  WebSocket       │  │   TSOP1738 recv  │  │  (3x toggle) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └──────┬───────┘  │
│           │                     │                    │          │
└───────────┼─────────────────────┼────────────────────┼──────────┘
            └─────────────────────┼────────────────────┘
                                  ▼
              ┌─────────────────────────────────────┐
              │          ESP32-C3 CONTROLLER         │
              │                                     │
              │  ┌─────────────┐  ┌──────────────┐  │
              │  │ State Engine│  │ OLED Display │  │
              │  │ (3 channels)│  │ Updater      │  │
              │  └─────────────┘  └──────────────┘  │
              └──────────────────────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
       [Relay Ch. 1]       [Relay Ch. 2]       [Relay Ch. 3]
         Light / Fan         Fan / Plug          Light / AC
```

### The State Engine

A single source of truth — the `relayStates[3]` array — governs all three channels. Any input (Alexa, IR, or manual switch) modifies this array. The output relays and OLED display always reflect the current state from this array. This prevents conflicts when multiple input methods are used simultaneously.

---

## Features

- **Triple voice control** via Amazon Alexa (Sinric Pro WebSocket integration)
- **Universal IR remote** support — map any button from any remote you already own
- **Physical wall switches** with proper hardware debouncing
- **0.96" OLED display** showing per-channel status, Wi-Fi state, and IP address
- **OTA (Over-The-Air) firmware updates** — no need to open the enclosure for updates
- **Custom PCB** designed in EasyEDA — 2-layer, fits a standard 86mm junction box
- **USB-C programming** via ESP32-C3's native USB — clean and modern
- **Status LEDs** per channel

---

## Components Required

### PCB Components
| Reference | Component | Value / Part | Notes |
|---|---|---|---|
| U1 | ESP32-C3-Mini-1 | — | The main MCU module |
| K1–K3 | Relay (PCB-mount) | SRD-05VDC-SL-C | 5V coil, 10A/250VAC contacts |
| Q1–Q3 | NPN Transistor | BC547 / 2N2222 | Relay driver |
| D1–D3 | Flyback Diode | 1N4148 | Across relay coils |
| R1–R3 | Resistor | 1kΩ | Base resistor for Q1–Q3 |
| R4–R9 | Resistor | 10kΩ | Switch pull-ups |
| R10 | Resistor | 100Ω | IR LED current limit (if IR blaster fitted) |
| U2 | IR Receiver | TSOP1738 | 38kHz carrier, 3-pin THT |
| U3 | OLED Display | SSD1306, I2C | 0.96", 128×64 |
| C1–C4 | Capacitor | 100nF (0402) | Decoupling |
| C5 | Capacitor | 100µF / 16V | Bulk cap, relay supply |
| SW1–SW3 | Toggle Switch | SPDT rocker | Wall-mount compatible |
| SW4 | Tactile | 6×6mm | Reset |
| J1 | USB-C Connector | USB 2.0 Type-C | Programming / power |
| J2 | Screw Terminals | 2-pin, 5mm pitch × 6 | AC load connections |
| J3 | Header | 4-pin, 2.54mm | OLED connector |

### Additional Materials
| Item | Notes |
|---|---|
| Custom PCB (from EasyEDA Gerbers) | Order from JLCPCB, PCBWay, or fabricate manually |
| Enclosure (86mm junction box) | Standard electrical box — PCB designed to fit |
| 5V/2A USB-C power adapter | Powers the controller |
| Heat shrink tubing | For all AC wiring connections |
| AC Wire (1.5mm²) | For relay load connections |

---

## PCB Design Deep Dive

The PCB was designed in **EasyEDA** over several iteration cycles. The design brief was clear: fit everything into a standard 86mm square junction box footprint.

### Layer Strategy

**Top Layer (Red)**: All signal traces — GPIO lines, I2C, IR signal, switch inputs. Kept short and away from AC-carrying relay traces.

**Bottom Layer (Blue)**: Ground plane (poured fill) + relay coil/contact power traces. The full ground pour provides a low-impedance return path and reduces EMI.

### Key Layout Decisions

```
┌─────────────────────────────────────────────────────────┐
│  HIGH VOLTAGE ZONE           │  LOW VOLTAGE ZONE         │
│                              │                           │
│  AC Screw Terminals  ─────── │ ─── ESP32-C3 Module       │
│  Relay Contact traces        │     Signal traces          │
│  (2mm+ wide, isolated)       │     OLED header           │
│                              │     IR Receiver            │
│  ISOLATION BOUNDARY ─────────┘     Switch headers         │
│  (3mm+ clearance between HV and LV traces, per IPC-2221) │
└─────────────────────────────────────────────────────────┘
```

### Isolation Clearance
The PCB design strictly observes **3mm minimum creepage and clearance** between high-voltage (AC relay contacts) traces and low-voltage logic traces, as specified by IPC-2221A for 250VAC reinforced insulation category. This is not optional — it is what prevents the board from becoming a shock or fire hazard.

### PCB Features Summary
- 2-layer, 1oz copper, FR4 substrate
- Dimensions: 80mm × 80mm (fits 86mm box with margin)
- 4× M3 mounting holes at corners
- USB-C edge mount for front panel accessibility
- OLED window cut in front panel lines up with display position on PCB
- Test points on all relay coil signals and I2C lines

---

## Firmware — Complete Implementation

### Development Environment
- **Arduino IDE 2.x** with ESP32-C3 board package (espressif/arduino-esp32 ≥ 2.0.5)
- **Required Libraries**:
  - `SinricPro` (v2.9+) — Alexa cloud integration
  - `IRremoteESP8266` (2.8+) — IR decoding
  - `Adafruit_SSD1306` + `Adafruit_GFX` — OLED display
  - `ArduinoOTA` — Over-the-air updates (built-in with ESP32)

### Pin Assignments

```cpp
// ── Relay Output Pins ─────────────────
#define RELAY_1  2   // Channel 1 (e.g., Main Light)
#define RELAY_2  3   // Channel 2 (e.g., Ceiling Fan)
#define RELAY_3  4   // Channel 3 (e.g., Study Lamp)

// ── Wall Switch Input Pins ────────────
#define SWITCH_1  5  // Toggle switch for Channel 1
#define SWITCH_2  6  // Toggle switch for Channel 2
#define SWITCH_3  7  // Toggle switch for Channel 3

// ── IR Receiver ───────────────────────
#define IR_RECV_PIN  8

// ── I2C for OLED ──────────────────────
#define I2C_SDA  19
#define I2C_SCL  18

// ── IR Button Codes (from your remote) ─
#define IR_BTN_CH1  0xFF30CF   // Replace with your remote's actual codes
#define IR_BTN_CH2  0xFF18E7
#define IR_BTN_CH3  0xFF7A85
```

### Core State Engine

```cpp
bool relayStates[3] = {false, false, false};
bool lastSwitchStates[3] = {false, false, false};

// The single function that changes relay state from ANY source
void setRelay(int channel, bool state, String source) {
  if (relayStates[channel] == state) return; // No change needed
  
  relayStates[channel] = state;
  
  // Active LOW relay: LOW = ON, HIGH = OFF
  int pinMap[3] = {RELAY_1, RELAY_2, RELAY_3};
  digitalWrite(pinMap[channel], state ? LOW : HIGH);
  
  // Keep Sinric Pro state in sync regardless of input source
  SinricProSwitch& sw = SinricPro[deviceIDs[channel]];
  sw.sendPowerStateEvent(state);
  
  updateOLED();
  
  Serial.printf("[%s] Channel %d → %s\n", source.c_str(), channel+1, state ? "ON" : "OFF");
}
```

### Alexa (Sinric Pro) Integration

```cpp
#include <SinricPro.h>
#include <SinricProSwitch.h>

#define APP_KEY    "your-sinric-pro-app-key"
#define APP_SECRET "your-sinric-pro-app-secret"

// Device IDs from the Sinric Pro dashboard
String deviceIDs[3] = {
  "your-device-id-ch1",
  "your-device-id-ch2",
  "your-device-id-ch3"
};

bool onPowerState(const String& deviceId, bool &state) {
  for (int i = 0; i < 3; i++) {
    if (deviceId == deviceIDs[i]) {
      setRelay(i, state, "Alexa");
      return true;
    }
  }
  return false;
}

void setupSinricPro() {
  for (int i = 0; i < 3; i++) {
    SinricProSwitch& sw = SinricPro[deviceIDs[i]];
    sw.onPowerState(onPowerState);
  }
  SinricPro.begin(APP_KEY, APP_SECRET);
}
```

### IR Remote Decoding

```cpp
#include <IRremoteESP8266.h>
#include <IRrecv.h>
#include <IRutils.h>

IRrecv irrecv(IR_RECV_PIN);
decode_results results;

void handleIRRemote() {
  if (!irrecv.decode(&results)) return;
  
  uint32_t code = results.value;
  
  switch (code) {
    case IR_BTN_CH1: setRelay(0, !relayStates[0], "IR"); break; // Toggle
    case IR_BTN_CH2: setRelay(1, !relayStates[1], "IR"); break;
    case IR_BTN_CH3: setRelay(2, !relayStates[2], "IR"); break;
    
    // Optional: All ON / All OFF buttons
    case 0xFF629D: // "+" button on common remotes
      for(int i=0;i<3;i++) setRelay(i, true, "IR");
      break;
    case 0xFFA857: // "-" button
      for(int i=0;i<3;i++) setRelay(i, false, "IR");
      break;
  }
  
  irrecv.resume(); // Ready for next code
}
```

> **How to find your remote's codes**: Upload a simple sketch that prints `results.value` to serial and press each button you want to map. Note the hex codes and fill them in as constants.

### Wall Switch Handling (with Debounce)

```cpp
unsigned long lastDebounceTime[3] = {0};
#define DEBOUNCE_DELAY 50  // ms

void handleManualSwitches() {
  int switchPins[3] = {SWITCH_1, SWITCH_2, SWITCH_3};
  
  for (int i = 0; i < 3; i++) {
    bool currentState = (digitalRead(switchPins[i]) == LOW); // Active LOW with pull-up
    
    if (currentState != lastSwitchStates[i]) {
      if ((millis() - lastDebounceTime[i]) > DEBOUNCE_DELAY) {
        // Edge detected after debounce window
        if (currentState) {
          setRelay(i, !relayStates[i], "Switch"); // Toggle on press
        }
        lastDebounceTime[i] = millis();
        lastSwitchStates[i] = currentState;
      }
    }
  }
}
```

### OLED Display

```cpp
#include <Adafruit_SSD1306.h>
#include <Adafruit_GFX.h>

#define SCREEN_W 128
#define SCREEN_H 64
Adafruit_SSD1306 display(SCREEN_W, SCREEN_H, &Wire, -1);

void updateOLED() {
  display.clearDisplay();
  
  display.setTextSize(1);
  display.setTextColor(WHITE);
  
  // Header
  display.setCursor(0, 0);
  display.print("Room Controller");
  display.drawLine(0, 10, 127, 10, WHITE);
  
  // Channel statuses
  const char* channelNames[3] = {"CH1 Light ", "CH2 Fan   ", "CH3 Lamp  "};
  for (int i = 0; i < 3; i++) {
    display.setCursor(0, 14 + (i * 12));
    display.print(channelNames[i]);
    display.print(relayStates[i] ? "[ ON]" : "[OFF]");
  }
  
  // Wi-Fi / IP
  display.setCursor(0, 52);
  display.setTextSize(1);
  if (WiFi.status() == WL_CONNECTED) {
    display.print(WiFi.localIP().toString());
  } else {
    display.print("No Wi-Fi");
  }
  
  display.display();
}
```

### OTA Update Support

```cpp
#include <ArduinoOTA.h>

void setupOTA() {
  ArduinoOTA.setHostname("room-controller");
  ArduinoOTA.setPassword("ota-password-here");
  
  ArduinoOTA.onStart([]() { display.clearDisplay(); display.print("OTA Update..."); display.display(); });
  ArduinoOTA.onProgress([](unsigned int progress, unsigned int total) {
    display.fillRect(0, 30, (progress * 128 / total), 10, WHITE);
    display.display();
  });
  ArduinoOTA.onEnd([]() { display.print("Done! Rebooting..."); display.display(); });
  
  ArduinoOTA.begin();
}
```

### Complete Setup and Loop

```cpp
void setup() {
  Serial.begin(115200);
  
  // Relay pins — default OFF
  int relayPins[3] = {RELAY_1, RELAY_2, RELAY_3};
  for (int i = 0; i < 3; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // Active LOW — HIGH = OFF
  }
  
  // Switch pins
  int switchPins[3] = {SWITCH_1, SWITCH_2, SWITCH_3};
  for (int i = 0; i < 3; i++) {
    pinMode(switchPins[i], INPUT_PULLUP);
    lastSwitchStates[i] = (digitalRead(switchPins[i]) == LOW);
  }
  
  // OLED
  Wire.begin(I2C_SDA, I2C_SCL);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextColor(WHITE);
  display.print("Booting...");
  display.display();
  
  // Wi-Fi
  WiFi.begin("YOUR_SSID", "YOUR_WIFI_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    display.print(".");
    display.display();
  }
  
  // IR
  irrecv.enableIRIn();
  
  // Sinric Pro
  setupSinricPro();
  
  // OTA
  setupOTA();
  
  updateOLED();
}

void loop() {
  SinricPro.handle();
  ArduinoOTA.handle();
  handleIRRemote();
  handleManualSwitches();
}
```

---

## Sinric Pro Setup Guide

Sinric Pro is a free cloud service that bridges your ESP32 to Amazon Alexa and Google Home via WebSocket. No port forwarding or static IP needed.

1. **Create an account** at [sinric.pro](https://sinric.pro)
2. **Add Devices**: Add three "Switch" type devices — name them exactly as you want to say them to Alexa (e.g., "Room Light", "Ceiling Fan", "Study Lamp")
3. **Copy credentials**: Copy the **App Key**, **App Secret**, and each **Device ID** into the firmware defines
4. **Flash the firmware** to your ESP32-C3
5. **Link to Alexa**:
   - Open the Alexa app → More → Skills & Games
   - Search "Sinric Pro" → Enable skill
   - Log in with your Sinric Pro credentials
   - Run device discovery: "Alexa, discover my devices"
6. **Test**: "Alexa, turn on the room light" → relay clicks

---

## Assembly Guide

### Step 1: SMD Components First
Solder all small passive components (resistors, capacitors) before through-hole parts. Use flux-core solder and a fine tip. For 0402 passives, use tweezers and steady hands (or a hot air station).

### Step 2: Through-Hole Components
1. TSOP1738 IR receiver — bend leads so it faces forward
2. Tactile reset button
3. Screw terminal blocks
4. USB-C connector

### Step 3: ESP32-C3 Module
Solder the ESP32-C3-Mini-1 module last (it has castellated edges). Ensure all pads make contact. Check with a continuity meter on all critical connections before powering up.

### Step 4: Relay Installation
The three PCB-mount relays are the tallest components. Ensure they are seated flat before soldering.

### Step 5: OLED Display
Connect via the 4-pin JST or header connector: VCC, GND, SDA, SCL.

### Step 6: Enclosure Preparation
1. Mark and cut a rectangular window for the OLED display on the enclosure front plate
2. Drill four M3 mounting holes matching the PCB mounting holes
3. Drill cable entry gland holes for switch wires and AC load wires
4. Install a short USB-C extension cable through the side panel if the USB-C port won't be accessible after mounting

### Step 7: AC Wiring
⚠️ **SAFETY CRITICAL**: Working with 230V AC mains.
- Disconnect mains power at the circuit breaker before wiring
- Use 1.5mm² wire for all AC load connections
- Apply heat shrink to every terminal connection
- Ensure relay contact current rating *exceeds* your load current by 20%

### Step 8: Wall Switch Wiring
Run a 3-core cable from the controller to your wall switches. The controller replaces the standard single-gang switch plate. Each switch's common terminal connects to GND; each normally-open terminal connects to the GPIO input pin.

---

## Safety Considerations

> ⚠️ **This project involves mains AC voltage (230V in India). Incorrect wiring can cause electric shock, fire, or death. Proceed only if you are confident in your electrical skills.**

Key safety rules:
- **Always isolate mains** from the circuit breaker before any wiring changes
- **Relay ratings**: Verify relay contact rating EXCEEDS your load. For motor loads (fans), derate by 50%
- **PCB clearance**: Maintain 3mm+ clearance between AC and DC traces on the PCB
- **Enclosure**: Use a complete, closed enclosure. No bare PCBs with live mains terminals
- **Fuse protection**: Install an appropriate MCB (miniature circuit breaker) upstream of the controller
- **Earth/Ground**: All metal enclosures must be earthed

---

## Advantages

- **Three-way control** from any source — voice, existing remote, physical switch — without conflict
- **No internet dependency for local control** — IR and manual switches work even without Wi-Fi
- **OTA updatable** — add features or fix bugs remotely, no enclosure opening required
- **Custom PCB** eliminates breadboard reliability issues — production-grade connections
- **OLED display** provides instant local status feedback — no phone needed to check what's on
- **Cost-effective** — total BOM under ₹600 for a 3-channel controller

## Disadvantages

- **Limited to 3 channels** per unit (expandable with additional units networked via MQTT)
- **Wi-Fi required for Alexa** — voice control unavailable during router outages
- **Assembly skill required** — SMD soldering experience needed for the PCB
- **Alexa discovery quirk** — occasionally requires re-running discovery after Wi-Fi reconnect

---

## Future Improvements

- **Power monitoring**: Add a **PZEM-004T** or **ACS712** current sensor on one channel to measure and display load power consumption
- **Scheduling**: Implement on-board daily schedule timer (RTC module — DS3231) for timed appliance control without cloud dependency
- **8-channel version**: Design a larger PCB with 8 relay channels for whole-room coverage
- **Home Assistant integration**: Replace Sinric Pro with an MQTT broker for full local-network control via Home Assistant
- **Touch panel**: Replace toggle switches with a capacitive touch strip panel for a modern look
- **Mesh networking**: Use **ESP-MESH** to group multiple room controllers for whole-home control from a single coordinator
- **Mobile app**: Custom Flutter app for local Bluetooth control (ESP32-C3's BLE 5.0)

---

## Conclusion

The ESP32-C3 Room Automation Controller is proof that the gap between "DIY project" and "production-quality device" is narrower than most people assume. A well-designed PCB, clean firmware architecture, and thoughtful enclosure engineering produce a device that sits invisibly in a junction box — looking and functioning like a commercial smart switch, but built with full understanding of every layer.

The triple-input design (Alexa + IR + physical) is what makes this genuinely useful. Voice control is convenient but not always practical. IR remotes are familiar and work even without Wi-Fi. Physical switches are the fallback that never fails. Every person in a room can control it in whatever way they prefer.

This project marks a significant step up from breadboard builds: it is a complete, deployable embedded product — designed, fabricated, programmed, and installed end-to-end.

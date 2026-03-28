## Introduction

What does it take to turn every light, fan, and air conditioner in an entire home into a smart appliance — without spending tens of thousands of rupees on proprietary smart home ecosystems? This project is the answer.

The **Home Automation — 15 Devices** project is a DIY smart home controller built around the **ESP32** microcontroller that handles **14 electrical devices and 1 air conditioner** across multiple rooms in a real household. It integrates **Amazon Alexa voice control**, **real-time device state monitoring** through the Alexa app, and **EEPROM-based state retention** — meaning if the power goes off and comes back on, every device returns to exactly the state it was in before the outage.

This project is about scale. Most home automation tutorials show you how to control one or two lights. This one shows how to architect a system that handles 15 devices across a house, deals with state consistency after power cycling, and integrates cleanly with the Alexa ecosystem — all on a single ESP32.

---

## Architecture Overview

The system uses a **centralized controller with distributed relay modules**:

```
┌─────────────────────────────────────────────────────┐
│              ESP32 CENTRAL CONTROLLER                │
│                                                     │
│  ┌───────────────┐  ┌────────────────────────────┐  │
│  │  Wi-Fi Stack  │  │  EEPROM State Manager      │  │
│  │  (Alexa API)  │  │  (stores all 15 states)    │  │
│  └───────────────┘  └────────────────────────────┘  │
│                                                     │
│  GPIO 1–15 → Relay Control Lines                   │
└─────────────────────────────────────────────────────┘
         │              │              │
   ┌──────────┐   ┌──────────┐   ┌──────────┐
   │ Room 1   │   │ Room 2   │   │ Room 3   │
   │ 4-Channel│   │ 4-Channel│   │ 4-Channel│
   │ Relay    │   │ Relay    │   │ Relay    │
   └──────────┘   └──────────┘   └──────────┘
        │               │              │
  Lights/Fans    Lights/Fans    Lights/Fans
         +    2-Channel Relay Module (AC + spare)
```

### Device Distribution

| Room | Devices Controlled | Relay Module |
|---|---|---|
| Living Room | Main Light, Floor Lamp, Ceiling Fan, TV Socket | 4-Channel Relay |
| Bedroom | Bed Light, Study Light, Bed Fan, AC (via IR Blaster or relay) | 4-Channel Relay |
| Kitchen | Kitchen Light, Exhaust Fan, Counter Light, Pantry Socket | 4-Channel Relay |
| Common Areas | Corridor Light, Bathroom Geyser | 2-Channel Relay |

*(Exact device assignment was customized per home layout)*

---

## Components Required

### Central Controller
| Component | Specification | Notes |
|---|---|---|
| ESP32 WROOM-32 | Dual-core, 4MB Flash, Wi-Fi + BT | Main controller |
| 5V DC Power Supply | 3A+ recommended | Powers ESP32 and relay module coils |
| Custom PCB / Veroboard | Per design | Cleaner than raw dupont wires |
| 100µF / 10µF Capacitors | Decoupling | Near ESP32 VCC pins |

### Relay Modules
| Component | Quantity | Notes |
|---|---|---|
| 4-Channel Relay Module (5V) | 3 | 12 device channels |
| Single-Channel Relay Module (5V) | 1 | AC unit control |
| Spare relay module terminals | 1 | Geyser / water heater |

### Wiring & Safety
| Component | Notes |
|---|---|
| 1.5mm² House Wiring | For AC load carrying capacity |
| MCB (Miniature Circuit Breaker) | Per room, for safety |
| Distribution Box / DB Panel space | Relay modules mounted inside or adjacent |
| Enclosure (metal/ABS) | For all electronics |

---

## How the Alexa Integration Works

The project uses the **ESP Alexa library** (or Sinric Pro) which implements Amazon's local Alexa Hue Bridge emulation protocol. Rather than going through AWS IoT, it runs an HTTP server on the ESP32 that mimics a Philips Hue Bridge — which Alexa natively supports and auto-discovers on the local network.

### Discovery Flow
1. Alexa device discovery scans the local network for UPnP devices
2. The ESP32 responds as a Hue Bridge with all 15 devices registered
3. Alexa learns device names from the ESP32's configured device list
4. Each device appears in the Alexa app as a controllable smart switch

### Voice Command Flow
```
User: "Alexa, turn off the bedroom fan"
   ↓
Amazon Alexa server (cloud)
   ↓
Local Alexa → HTTP request to ESP32 IP
   ↓
ESP32 receives HTTP PUT → parses device name + state
   ↓
ESP32 maps device name to GPIO → toggles relay
   ↓
ESP32 updates EEPROM state for that device
   ↓
Response sent back to Alexa → "OK"
```

---

## EEPROM State Retention — The Critical Feature

This might seem like a minor detail, but for a 15-device home automation system it's critical. Without EEPROM state retention, every power outage would leave all 15 devices in an unknown default state, potentially leaving the bedroom lights on, the fan off, or the geyser running unintentionally.

### Implementation

```cpp
#include <EEPROM.h>

#define EEPROM_SIZE 16  // 1 byte per device, 1 header byte

// Device state array
bool deviceStates[15] = {false}; // All OFF on cold start

void saveAllStatesToEEPROM() {
  EEPROM.write(0, 0xAB);  // Magic byte to detect valid EEPROM content
  for (int i = 0; i < 15; i++) {
    EEPROM.write(i + 1, deviceStates[i] ? 1 : 0);
  }
  EEPROM.commit();
}

void loadStatesFromEEPROM() {
  if (EEPROM.read(0) != 0xAB) {
    // First boot or EEPROM corrupted — initialize to all OFF
    for (int i = 0; i < 15; i++) deviceStates[i] = false;
    saveAllStatesToEEPROM();
    return;
  }
  for (int i = 0; i < 15; i++) {
    deviceStates[i] = (EEPROM.read(i + 1) == 1);
  }
}

void applyStatesToRelays() {
  for (int i = 0; i < 15; i++) {
    digitalWrite(relayPins[i], deviceStates[i] ? LOW : HIGH); // Active LOW relays
  }
}

void setup() {
  EEPROM.begin(EEPROM_SIZE);
  loadStatesFromEEPROM();
  applyStatesToRelays(); // Restore previous states immediately on boot
  setupAlexaServer();
}
```

### Key design decisions:
- **Magic byte validation**: A sentinel value (0xAB) in EEPROM byte 0 detects whether valid data exists or if the EEPROM has never been written (or was corrupted). If invalid, all states default to OFF.
- **Write-on-change only**: EEPROM has a limited write cycle life (~100,000 cycles). States are only written when a device actually changes — not on every Alexa poll.
- **Restore before network**: States are restored to relays BEFORE the Wi-Fi connection attempt. This ensures all devices snap to their saved state within 1 second of power restoration, regardless of whether Wi-Fi connects.

---

## Software Implementation

### Full Firmware Structure

```cpp
#include <WiFi.h>
#include <EEPROM.h>
#include "ESPAlexa.h"  // or Sinric Pro headers

// ── Pin Configuration ──────────────────────────────────
const int relayPins[15] = {
  2, 4, 5, 18, 19, 21, 22, 23, 25, 26, 27, 32, 33, 34, 35
};

// ── Device Name → Index Map ───────────────────────────
struct Device {
  const char* name;
  int relayIndex;
};

Device devices[15] = {
  {"living room light",    0},
  {"living room lamp",     1},
  {"living room fan",      2},
  {"tv socket",            3},
  {"bedroom light",        4},
  {"study light",          5},
  {"bedroom fan",          6},
  {"bedroom ac",           7},
  {"kitchen light",        8},
  {"kitchen exhaust",      9},
  {"counter light",       10},
  {"pantry socket",       11},
  {"corridor light",      12},
  {"bathroom geyser",     13},
  {"all lights",          14}  // Group device
};

ESPAlexa alexa;

void deviceCallback(uint8_t idx, bool state, uint8_t brightness) {
  deviceStates[idx] = state;
  digitalWrite(relayPins[devices[idx].relayIndex], state ? LOW : HIGH);
  saveAllStatesToEEPROM();
}

void setup() {
  Serial.begin(115200);
  EEPROM.begin(16);
  
  // Configure relay pins
  for (int i = 0; i < 15; i++) {
    pinMode(relayPins[i], OUTPUT);
    digitalWrite(relayPins[i], HIGH); // HIGH = OFF (active LOW relay)
  }
  
  loadStatesFromEEPROM();
  applyStatesToRelays();
  
  // Connect to Wi-Fi
  WiFi.begin("YOUR_SSID", "YOUR_PASSWORD");
  while (WiFi.status() != WL_CONNECTED) delay(500);
  
  // Register all 15 devices with Alexa
  for (int i = 0; i < 15; i++) {
    alexa.addDevice(devices[i].name, deviceCallback);
  }
  
  alexa.begin();
}

void loop() {
  alexa.loop();
}
```

---

## Installation in the Home

### Phase 1: Planning and Circuit Breaker Sizing
Before any wiring, document every device's power draw and calculate the total current per relay module. Each relay contact is rated for a specific current (typically 10A at 250VAC). Overloading a relay contact causes contact welding and fire risk.

| Room | Max Load Estimate | Relay Selection |
|---|---|---|
| Living Room | 200W (lights) + 75W (fan) | 10A relay ✓ |
| Bedroom | 100W (lights) + 75W (fan) | 10A relay ✓ |
| Kitchen | 150W (lights) + 40W (exhaust) | 10A relay ✓ |
| Geyser | 2000W @ 230V = 8.7A | Dedicated 16A contactor or relay |

⚠️ **The geyser requires special consideration.** At 2000W, it draws nearly 9A at 230V. Most 5V relay modules are rated only 10A — this is too close to the edge. Use a dedicated **25A DIN rail relay module (Songle** or similar), controlled by the ESP32 relay module signal.

### Phase 2: Central Controller Location
The ESP32 controller is best placed:
- In or adjacent to the main distribution board
- In a central location in the home for Wi-Fi coverage
- Away from heat sources (inverter, other electronics)

### Phase 3: Running Control Wires
Each relay module requires:
- **4 GPIO control lines** from ESP32 (one per relay channel)
- **5V and GND** from the central 5V supply
- **AC mains wiring** for each load

Running GPIO control wires (low voltage, thin cable is fine) from the central ESP32 location to each room's relay module location is manageable through existing cable conduits or above false ceilings.

---

## Advantages
- **15 devices** on a single ESP32 — cost per device is minimal
- **Alexa voice control** — works with any Alexa-enabled device on the same Wi-Fi
- **EEPROM state retention** — power outages don't create chaos
- **Real-time status** in the Alexa app — know what's on from anywhere
- **No subscription fees** — local Hue Bridge emulation, no cloud subscription
- **Expandable** — additional relay modules can be added with minimal firmware changes
- **Works with existing wiring** — no need to rewire the house

## Disadvantages
- **Requires stable Wi-Fi** for voice control (manual control requires direct ESP32 interface)
- **15-GPIO demand** limits pin availability for future expansion on same controller
- **Alexa discovery quirks** — sometimes requires repeating the discovery process after firmware updates
- **No physical wall switch integration** in base build (requires additional wiring for hybrid switches)

---

## Future Improvements

- **Physical switch integration**: Add toggle switches on each relay module output, wired to ESP32 interrupt pins, for local manual override that also updates Alexa state
- **Scene support**: Group devices into Alexa scenes (e.g., "Good Night" turns off all lights and fans)
- **Energy monitoring**: Add **ACS712** current sensors on high-load channels to monitor power consumption
- **Google Home / HomeKit support**: Add parallel IFTTT or HomeKit bridge support alongside Alexa
- **OTA updates**: Implement ArduinoOTA for Wi-Fi firmware updates without physically accessing the ESP32
- **Failsafe relay**: Add a single normally-closed "emergency override" relay that restores basic lighting on ESP32 failure

---

## Conclusion

The 15-device home automation system demonstrates that a single ESP32 can serve as the nervous system of an entire household's electrical control. The integration of Alexa voice control, real-time state visibility, and robust EEPROM-based state retention makes this a genuinely reliable, daily-use automation platform — not just a demonstration project.

The project scales technical skills across embedded systems (EEPROM, GPIO, interrupt handling), networking (Wi-Fi, HTTP, UPnP), and practical electrical installation (relay sizing, load calculations, safety). More importantly, it delivers real value: every morning, the right lights come on with a voice command, and every night, everything goes off with a single phrase.

*"Alexa, good night."* — and 15 relays click off across the house.
